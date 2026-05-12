import { eventBus, EVENTS } from '../eventBus.js';
import { query } from '../../db/pool.js';
import { calculateXP, getLevelFromXP, getCareerStage } from '../../../../shared/xpCalculator.js';

eventBus.on(EVENTS.LESSON_COMPLETED, async ({ userId, lessonId, xpReward, isFirstAttempt }) => {
    try {
        const { rows: streakRows } = await query(
            `SELECT current_streak FROM streaks WHERE user_id = $1`,
            [userId]
        );

        const streakDays = streakRows[0]?.current_streak ?? 0;

        const xpEarned = calculateXP({
            base: xpReward,
            streakDays,
            isFirstAttempt,
        });

        await query(
            `INSERT INTO xp_transactions (user_id, amount, reason, lesson_id)
       VALUES ($1, $2, $3, $4)`,
            [userId, xpEarned, 'lesson_completed', lessonId]
        );

        const { rows: userRows } = await query(
            `UPDATE users
       SET current_xp = current_xp + $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING current_xp, level`,
            [xpEarned, userId]
        );

        const { current_xp: newXP, level: oldLevel } = userRows[0];
        const newLevel = getLevelFromXP(newXP);
        const newCareerStage = getCareerStage(newXP);

        if (newLevel > oldLevel) {
            await query(
                `UPDATE users SET level = $1 WHERE id = $2`,
                [newLevel, userId]
            );
            eventBus.publish(EVENTS.LEVEL_UP, { userId, newLevel, previousLevel: oldLevel, xpEarned });
        }

        eventBus.publish(EVENTS.XP_AWARDED, { userId, xpEarned, lessonId, totalXP: newXP, careerStage: newCareerStage });
    } catch (err) {
        console.error('[xpHandler] Error:', err.message);
    }
});