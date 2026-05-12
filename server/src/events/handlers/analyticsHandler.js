import { eventBus, EVENTS } from '../eventBus.js';
import { query } from '../../db/pool.js';

const log = async (eventName, userId, metadata = {}) => {
    try {
        await query(
            `INSERT INTO analytics_events (user_id, event_name, metadata)
       VALUES ($1, $2, $3)`,
            [userId ?? null, eventName, JSON.stringify(metadata)]
        );
    } catch (err) {
        console.error(`[analyticsHandler] Failed to log ${eventName}:`, err.message);
    }
};

eventBus.on(EVENTS.USER_REGISTERED, ({ userId, email }) =>
    log('user_registered', userId, { email }));

eventBus.on(EVENTS.LESSON_COMPLETED, ({ userId, lessonId, isFirstAttempt }) =>
    log('lesson_completed', userId, { lessonId, isFirstAttempt }));

eventBus.on(EVENTS.SUBMISSION_COMPLETED, ({ userId, lessonId, isCorrect, type }) =>
    log('submission_completed', userId, { lessonId, isCorrect, type }));

eventBus.on(EVENTS.QUIZ_ANSWERED, ({ userId, lessonId, isCorrect, attempts }) =>
    log('quiz_answered', userId, { lessonId, isCorrect, attempts }));

eventBus.on(EVENTS.PLAYGROUND_RUN, ({ userId, lessonId }) =>
    log('playground_run', userId, { lessonId }));

eventBus.on(EVENTS.XP_AWARDED, ({ userId, xpEarned, totalXP }) =>
    log('xp_awarded', userId, { xpEarned, totalXP }));

eventBus.on(EVENTS.LEVEL_UP, ({ userId, newLevel }) =>
    log('level_up', userId, { newLevel }));

eventBus.on(EVENTS.BADGE_EARNED, ({ userId, badgeSlug }) =>
    log('badge_earned', userId, { badgeSlug }));

eventBus.on(EVENTS.STREAK_UPDATED, ({ userId, currentStreak }) =>
    log('streak_updated', userId, { currentStreak }));

eventBus.on(EVENTS.STREAK_LOST, ({ userId, previousStreak }) =>
    log('streak_lost', userId, { previousStreak }));

eventBus.on(EVENTS.HINT_REQUESTED, ({ userId, lessonId }) =>
    log('hint_requested', userId, { lessonId }));

eventBus.on(EVENTS.CAREER_STAGE_REACHED, ({ userId, stageSlug }) =>
    log('career_stage_reached', userId, { stageSlug }));