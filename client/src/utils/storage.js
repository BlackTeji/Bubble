const PREFIX = 'bubble:';

export const storage = {
    get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch {
            console.warn('[storage] Could not write to localStorage');
        }
    },

    remove(key) {
        localStorage.removeItem(PREFIX + key);
    },

    clear() {
        Object.keys(localStorage)
            .filter((k) => k.startsWith(PREFIX))
            .forEach((k) => localStorage.removeItem(k));
    },
};

export const ACCESS_TOKEN_KEY = 'accessToken';
export const USER_KEY = 'user';