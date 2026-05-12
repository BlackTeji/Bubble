import { eventBus, EVENTS } from '../eventBus.js';
import { query } from '../../db/pool.js';

eventBus.on(EVENTS.LESSON_COMPLETED, async ({ userId }) => {
    try {
        const { rows } = await query(
            `SELECT current_streak, longest_streak, last_activity, grace_used
       FROM streaks WHERE user_id = $1`,
            [userId]
        );

        const streak = rows[0];
        if (!streak) return;

        const today = new Date().toISOString().split('T')[0];
        const lastActivity = streak.last_activity?.toISOString?.()?.split('T')[0];

        if (lastActivity === today) return;

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const dayBeforeYesterday = new Date(Date.now() - 172800000).toISOString().split('T')[0];

        let newStreak = streak.current_streak;
        let graceUsed = streak.grace_used;
        let streakLost = false;

        if (lastActivity === yesterday) {
            newStreak = streak.current_streak + 1;
            graceUsed = false;
        } else if (lastActivity === dayBeforeYesterday && !streak.grace_used) {
            newStreak = streak.current_streak + 1;
            graceUsed = true;
        } else if (!lastActivity) {
            newStreak = 1;
        } else {
            streakLost = streak.current_streak > 1;
            newStreak = 1;
            graceUsed = false;
        }

        const newLongest = Math.max(newStreak, streak.longest_streak);

        await query(
            `UPDATE streaks
       SET current_streak = $1,
           longest_streak  = $2,
           last_activity   = $3,
           grace_used      = $4,
           updated_at      = NOW()
       WHERE user_id = $5`,
            [newStreak, newLongest, today, graceUsed, userId]
        );

        if (streakLost) {
            eventBus.publish(EVENTS.STREAK_LOST, {
                userId,
                previousStreak: streak.current_streak,
            });
        } else {
            eventBus.publish(EVENTS.STREAK_UPDATED, {
                userId,
                currentStreak: newStreak,
                isNewRecord: newStreak === newLongest && newStreak > 1,
            });
        }
    } catch (err) {
        console.error('[streakHandler] Error:', err.message);
    }
});