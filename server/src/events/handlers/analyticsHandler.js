import { createLogger } from '../../utils/logger.js';
import { eventBus, EVENTS } from '../eventBus.js';
import { query } from '../../db/pool.js';

const log = createLogger('analyticsHandler');

const logEvent = async (eventName, userId, metadata = {}) => {
    try {
        await query(
            `INSERT INTO analytics_events (user_id, event_name, metadata)
       VALUES ($1, $2, $3)`,
            [userId ?? null, eventName, JSON.stringify(metadata)]
        );
    } catch (err) {
        log.error(`Failed to log ${eventName}:`, { error: err.message });
    }
};

eventBus.on(EVENTS.USER_REGISTERED, ({ userId, email }) =>
    logEvent('user_registered', userId, { email }));

eventBus.on(EVENTS.LESSON_COMPLETED, ({ userId, lessonId, isFirstAttempt }) =>
    logEvent('lesson_completed', userId, { lessonId, isFirstAttempt }));

eventBus.on(EVENTS.SUBMISSION_COMPLETED, ({ userId, lessonId, isCorrect, type }) =>
    logEvent('submission_completed', userId, { lessonId, isCorrect, type }));

eventBus.on(EVENTS.QUIZ_ANSWERED, ({ userId, lessonId, isCorrect, attempts }) =>
    logEvent('quiz_answered', userId, { lessonId, isCorrect, attempts }));

eventBus.on(EVENTS.PLAYGROUND_RUN, ({ userId, lessonId }) =>
    logEvent('playground_run', userId, { lessonId }));

eventBus.on(EVENTS.XP_AWARDED, ({ userId, xpEarned, totalXP }) =>
    logEvent('xp_awarded', userId, { xpEarned, totalXP }));

eventBus.on(EVENTS.LEVEL_UP, ({ userId, newLevel }) =>
    logEvent('level_up', userId, { newLevel }));

eventBus.on(EVENTS.BADGE_EARNED, ({ userId, badgeSlug }) =>
    logEvent('badge_earned', userId, { badgeSlug }));

eventBus.on(EVENTS.STREAK_UPDATED, ({ userId, currentStreak }) =>
    logEvent('streak_updated', userId, { currentStreak }));

eventBus.on(EVENTS.STREAK_LOST, ({ userId, previousStreak }) =>
    logEvent('streak_lost', userId, { previousStreak }));

eventBus.on(EVENTS.HINT_REQUESTED, ({ userId, lessonId }) =>
    logEvent('hint_requested', userId, { lessonId }));

eventBus.on(EVENTS.CAREER_STAGE_REACHED, ({ userId, stageSlug }) =>
    logEvent('career_stage_reached', userId, { stageSlug }));