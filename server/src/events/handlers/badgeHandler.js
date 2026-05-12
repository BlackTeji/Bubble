import { eventBus, EVENTS } from '../eventBus.js';
import { query } from '../../db/pool.js';

const checkAndAwardBadge = async (userId, badgeSlug) => {
    const { rows: badgeRows } = await query(
        `SELECT id FROM badges WHERE slug = $1`,
        [badgeSlug]
    );
    if (!badgeRows[0]) return;

    const badgeId = badgeRows[0].id;

    const { rows: existing } = await query(
        `SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2`,
        [userId, badgeId]
    );
    if (existing.length > 0) return;

    await query(
        `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)`,
        [userId, badgeId]
    );

    eventBus.publish(EVENTS.BADGE_EARNED, { userId, badgeSlug });
};

eventBus.on(EVENTS.LESSON_COMPLETED, async ({ userId, isFirstAttempt }) => {
    try {
        const { rows } = await query(
            `SELECT COUNT(*) AS count FROM user_progress
       WHERE user_id = $1 AND status = 'completed'`,
            [userId]
        );

        const count = parseInt(rows[0].count, 10);

        if (count >= 1) await checkAndAwardBadge(userId, 'first-lesson');
        if (count >= 5) await checkAndAwardBadge(userId, 'five-lessons');
        if (isFirstAttempt) await checkAndAwardBadge(userId, 'first-correct');
    } catch (err) {
        console.error('[badgeHandler] lesson.completed error:', err.message);
    }
});

eventBus.on(EVENTS.STREAK_UPDATED, async ({ userId, currentStreak }) => {
    try {
        if (currentStreak >= 3) await checkAndAwardBadge(userId, 'first-streak');
    } catch (err) {
        console.error('[badgeHandler] streak.updated error:', err.message);
    }
});

eventBus.on(EVENTS.PLAYGROUND_RUN, async ({ userId }) => {
    try {
        await checkAndAwardBadge(userId, 'first-code');
    } catch (err) {
        console.error('[badgeHandler] playground.run error:', err.message);
    }
});