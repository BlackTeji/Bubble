import { eventBus, EVENTS } from '../eventBus.js';
import { query } from '../../db/pool.js';
import { calculateXP, getLevelFromXP, getCareerStage } from '../../../../shared/xpCalculator.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('xp-handler');

const STAGE_ORDER = [
    'curious-beginner', 'data-explorer', 'junior-analyst',
    'insight-hunter', 'dashboard-architect', 'analytics-strategist',
];
const stageIndex = (slug) => STAGE_ORDER.indexOf(slug ?? 'curious-beginner');

eventBus.on(EVENTS.LESSON_COMPLETED, async ({ userId, lessonId, xpReward, isFirstAttempt }) => {
    try {
        const { rows: streakRows } = await query(
            `SELECT current_streak FROM streaks WHERE user_id = $1`, [userId]
        );
        const streakDays = streakRows[0]?.current_streak ?? 0;
        const xpEarned = calculateXP({ base: xpReward, streakDays, isFirstAttempt });

        await query(
            `INSERT INTO xp_transactions (user_id, amount, reason, lesson_id)
       VALUES ($1, $2, 'lesson_completed', $3)`,
            [userId, xpEarned, lessonId]
        );

        const { rows: userRows } = await query(
            `UPDATE users SET current_xp = current_xp + $1, updated_at = NOW()
       WHERE id = $2 RETURNING current_xp, level`,
            [xpEarned, userId]
        );

        if (!userRows[0]) { log.warn('User not found during XP award', { userId }); return; }

        const { current_xp: newXP, level: oldLevel } = userRows[0];
        const newLevel = getLevelFromXP(newXP);
        const oldStage = getCareerStage(newXP - xpEarned);
        const newStage = getCareerStage(newXP);

        if (newLevel > oldLevel) {
            await query(`UPDATE users SET level = $1 WHERE id = $2`, [newLevel, userId]);
            eventBus.publish(EVENTS.LEVEL_UP, { userId, newLevel, previousLevel: oldLevel, xpEarned });
            log.info('Level up', { userId, newLevel });
        }

        if (stageIndex(newStage.slug) > stageIndex(oldStage.slug)) {
            eventBus.publish(EVENTS.CAREER_STAGE_REACHED, {
                userId, stageSlug: newStage.slug, previousSlug: oldStage.slug,
            });
            log.info('Career stage reached', { userId, stage: newStage.slug });
        }

        eventBus.publish(EVENTS.XP_AWARDED, { userId, xpEarned, lessonId, totalXP: newXP, careerStage: newStage });
    } catch (err) {
        log.error('XP award failed', { userId, lessonId, error: err.message });
    }
});