import { eventBus, EVENTS } from '../eventBus.js';
import { query } from '../../db/pool.js';

const CELEBRATION_LEVELS = {
    SUBTLE: 'subtle',
    MEDIUM: 'medium',
    BIG: 'big',
};

const logCelebration = async (userId, type, level, metadata = {}) => {
    await query(
        `INSERT INTO analytics_events (user_id, event_name, metadata)
     VALUES ($1, 'celebration_triggered', $2)`,
        [userId, JSON.stringify({ type, level, ...metadata })]
    );
};

eventBus.on(EVENTS.LESSON_COMPLETED, async ({ userId, isFirstAttempt }) => {
    try {
        const level = isFirstAttempt ? CELEBRATION_LEVELS.MEDIUM : CELEBRATION_LEVELS.SUBTLE;
        await logCelebration(userId, 'lesson_complete', level, { isFirstAttempt });
    } catch (err) {
        console.error('[celebrationHandler] Error:', err.message);
    }
});

eventBus.on(EVENTS.LEVEL_UP, async ({ userId, newLevel }) => {
    try {
        await logCelebration(userId, 'level_up', CELEBRATION_LEVELS.BIG, { newLevel });
    } catch (err) {
        console.error('[celebrationHandler] level.up error:', err.message);
    }
});

eventBus.on(EVENTS.BADGE_EARNED, async ({ userId, badgeSlug }) => {
    try {
        await logCelebration(userId, 'badge_earned', CELEBRATION_LEVELS.MEDIUM, { badgeSlug });
    } catch (err) {
        console.error('[celebrationHandler] badge.earned error:', err.message);
    }
});

eventBus.on(EVENTS.CAREER_STAGE_REACHED, async ({ userId, stageSlug }) => {
    try {
        await logCelebration(userId, 'career_stage', CELEBRATION_LEVELS.BIG, { stageSlug });
    } catch (err) {
        console.error('[celebrationHandler] career.stage error:', err.message);
    }
});

export { CELEBRATION_LEVELS };