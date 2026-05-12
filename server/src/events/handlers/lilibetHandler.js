import { eventBus, EVENTS } from '../eventBus.js';
import { getMessage } from '../../../../shared/lilibet/index.js';
import { query } from '../../db/pool.js';

const logMessage = async (userId, event, message) => {
    await query(
        `INSERT INTO analytics_events (user_id, event_name, metadata)
     VALUES ($1, 'lilibet_message', $2)`,
        [userId, JSON.stringify({ event, message })]
    );
};

eventBus.on(EVENTS.SUBMISSION_COMPLETED, async ({ userId, isCorrect, isFirstAttempt }) => {
    try {
        const event = isCorrect ? 'quiz_correct' : 'quiz_wrong';
        const { rows } = await query(
            `SELECT state FROM learner_state WHERE user_id = $1`,
            [userId]
        );
        const state = rows[0]?.state ?? 'exploring';
        const message = getMessage(event, { isCorrect, isFirstAttempt, state });
        await logMessage(userId, event, message);
    } catch (err) {
        console.error('[lilibetHandler] Error:', err.message);
    }
});

eventBus.on(EVENTS.LESSON_COMPLETED, async ({ userId }) => {
    try {
        const message = getMessage('lesson_complete', {});
        await logMessage(userId, 'lesson_complete', message);
    } catch (err) {
        console.error('[lilibetHandler] lesson.completed error:', err.message);
    }
});

eventBus.on(EVENTS.STREAK_LOST, async ({ userId }) => {
    try {
        const message = getMessage('streak_lost', {});
        await logMessage(userId, 'streak_lost', message);
    } catch (err) {
        console.error('[lilibetHandler] streak.lost error:', err.message);
    }
});

eventBus.on(EVENTS.LEVEL_UP, async ({ userId }) => {
    try {
        const message = getMessage('level_up', {});
        await logMessage(userId, 'level_up', message);
    } catch (err) {
        console.error('[lilibetHandler] level.up error:', err.message);
    }
});