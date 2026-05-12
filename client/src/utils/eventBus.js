const listeners = new Map();

export const clientBus = {
    on(event, handler) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(handler);
        return () => listeners.get(event)?.delete(handler);
    },

    emit(event, payload) {
        listeners.get(event)?.forEach((handler) => {
            try {
                handler(payload);
            } catch (err) {
                console.error(`[clientBus] Error in handler for "${event}":`, err);
            }
        });
    },

    off(event, handler) {
        listeners.get(event)?.delete(handler);
    },
};

export const CLIENT_EVENTS = {
    USER_LOADED: 'user:loaded',
    USER_LOGGED_OUT: 'user:loggedOut',
    XP_UPDATED: 'xp:updated',
    STREAK_UPDATED: 'streak:updated',
    BADGE_EARNED: 'badge:earned',
    LESSON_COMPLETED: 'lesson:completed',
    CELEBRATION_TRIGGER: 'celebration:trigger',
    TOAST_SHOW: 'toast:show',
    LILIBET_MESSAGE: 'lilibet:message',
};