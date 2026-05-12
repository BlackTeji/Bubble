let state = {
    progressMap: {},
    isLoaded: false,
};

const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn({ ...state }));

export const progressStore = {
    get() {
        return { ...state };
    },

    setAll(progressArray) {
        const progressMap = {};
        progressArray.forEach(({ lesson_id, status, score, attempts }) => {
            progressMap[lesson_id] = { status, score, attempts };
        });
        state = { progressMap, isLoaded: true };
        notify();
    },

    updateLesson(lessonId, patch) {
        state = {
            ...state,
            progressMap: {
                ...state.progressMap,
                [lessonId]: { ...(state.progressMap[lessonId] ?? {}), ...patch },
            },
        };
        notify();
    },

    getLesson(lessonId) {
        return state.progressMap[lessonId] ?? { status: 'not_started', score: null, attempts: 0 };
    },

    subscribe(fn) {
        listeners.add(fn);
        fn({ ...state });
        return () => listeners.delete(fn);
    },
};