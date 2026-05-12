import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate, schemas } from '../middleware/validate.js';
import { success } from '../utils/response.js';
import { query } from '../db/pool.js';
import { eventBus, EVENTS } from '../events/eventBus.js';
import { getMessage } from '../../../shared/lilibet/index.js';
import { getLevelFromXP } from '../../../shared/xpCalculator.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('submissions');
const router = Router();

router.post('/', authenticate, validate(schemas.submission), async (req, res, next) => {
    try {
        const { lessonId, type, code, answerJson, timeTakenS } = req.body;
        const userId = req.user.id;

        const { rows: lessonRows } = await query(
            `SELECT id, xp_reward, content_json FROM lessons WHERE id = $1`,
            [lessonId]
        );

        if (!lessonRows[0]) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Lesson not found.' },
            });
        }

        const lesson = lessonRows[0];
        const isCorrect = evaluateSubmission(type, answerJson, lesson.content_json);

        const { rows: subRows } = await query(
            `INSERT INTO submissions (user_id, lesson_id, type, code, answer_json, is_correct, time_taken_s)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
            [userId, lessonId, type,
                code ?? null,
                answerJson ? JSON.stringify(answerJson) : null,
                isCorrect,
                timeTakenS ?? null]
        );

        const { rows: attemptRows } = await query(
            `INSERT INTO user_progress (user_id, lesson_id, status, score, attempts)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET
         attempts     = user_progress.attempts + 1,
         status       = CASE WHEN $3 = 'completed' THEN 'completed' ELSE user_progress.status END,
         score        = CASE WHEN $4 > COALESCE(user_progress.score, 0) THEN $4 ELSE user_progress.score END,
         completed_at = CASE WHEN $3 = 'completed' AND user_progress.completed_at IS NULL
                             THEN NOW() ELSE user_progress.completed_at END,
         updated_at   = NOW()
       RETURNING attempts, status`,
            [userId, lessonId, isCorrect ? 'completed' : 'in_progress', isCorrect ? 100 : 0]
        );

        const attempts = attemptRows[0].attempts;
        const isFirstAttempt = attempts === 1;

        eventBus.publish(EVENTS.SUBMISSION_COMPLETED, {
            userId, lessonId, lessonXpReward: lesson.xp_reward,
            type, isCorrect, isFirstAttempt, submissionId: subRows[0].id,
        });

        if (isCorrect) {
            eventBus.publish(EVENTS.LESSON_COMPLETED, {
                userId, lessonId, xpReward: lesson.xp_reward, isFirstAttempt,
            });
        }

        // Enrichment is best-effort — failures here never block the learner's progress being saved
        let lilibetMessage = null;
        let xpEarned = null;
        let levelUp = false;

        try {
            const [stateRows, userRows] = await Promise.all([
                query(`SELECT state FROM learner_state WHERE user_id = $1`, [userId]),
                query(`SELECT current_xp, level FROM users WHERE id = $1`, [userId]),
            ]);

            const learnerState = stateRows.rows[0]?.state ?? 'exploring';
            const currentXP = userRows.rows[0]?.current_xp ?? 0;
            const oldLevel = userRows.rows[0]?.level ?? 1;

            const lilibetEvent = type === 'lesson_complete'
                ? 'lesson_complete'
                : isCorrect ? 'quiz_correct' : 'quiz_wrong';

            lilibetMessage = getMessage(lilibetEvent, { isCorrect, isFirstAttempt, state: learnerState });

            if (isCorrect) {
                xpEarned = lesson.xp_reward;
                levelUp = getLevelFromXP(currentXP + xpEarned) > oldLevel;
            }
        } catch (enrichErr) {
            log.warn('Response enrichment failed', { error: enrichErr.message, userId });
        }

        return success(res, { isCorrect, attempts, submissionId: subRows[0].id, lilibetMessage, xpEarned, levelUp });
    } catch (err) {
        next(err);
    }
});

const evaluateSubmission = (type, answerJson, contentJson) => {
    if (type === 'lesson_complete') return true;
    if (type === 'playground') return true;

    if (type === 'quiz' && answerJson?.selectedIndex !== undefined) {
        const blocks = contentJson?.blocks ?? [];
        const quizBlock = blocks.find((b) => b.type === 'quiz');
        if (!quizBlock) return false;
        return answerJson.selectedIndex === quizBlock.correct;
    }

    return false;
};

export default router;