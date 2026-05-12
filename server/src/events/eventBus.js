import { EventEmitter } from 'events';

class BubbleEventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20);
    }

    publish(event, payload) {
        this.emit(event, payload);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[event] ${event}`, JSON.stringify(payload, null, 2));
        }
    }
}

export const eventBus = new BubbleEventBus();

export const EVENTS = {
    SUBMISSION_COMPLETED: 'submission.completed',
    LESSON_STARTED: 'lesson.started',
    LESSON_COMPLETED: 'lesson.completed',
    QUIZ_ANSWERED: 'quiz.answered',
    PLAYGROUND_RUN: 'playground.run',
    STREAK_UPDATED: 'streak.updated',
    STREAK_LOST: 'streak.lost',
    XP_AWARDED: 'xp.awarded',
    LEVEL_UP: 'level.up',
    BADGE_EARNED: 'badge.earned',
    CAREER_STAGE_REACHED: 'career.stage_reached',
    HINT_REQUESTED: 'hint.requested',
    USER_REGISTERED: 'user.registered',
    LEARNER_STATE_CHANGED: 'learnerState.changed',
};