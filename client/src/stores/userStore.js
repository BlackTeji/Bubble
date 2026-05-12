import { storage, USER_KEY } from '../utils/storage.js';

let state = {
    user: storage.get(USER_KEY),
    isLoading: false,
    error: null,
};

const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn({ ...state }));

export const userStore = {
    get() {
        return { ...state };
    },

    set(patch) {
        state = { ...state, ...patch };
        if (patch.user) storage.set(USER_KEY, patch.user);
        notify();
    },

    subscribe(fn) {
        listeners.add(fn);
        fn({ ...state });
        return () => listeners.delete(fn);
    },

    clear() {
        state = { user: null, isLoading: false, error: null };
        notify();
    },
};