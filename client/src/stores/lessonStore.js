let state = {
    lesson: null,
    currentBlockIndex: 0,
    isLoading: false,
    error: null,
};

const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn({ ...state }));

export const lessonStore = {
    get() {
        return { ...state };
    },

    setLesson(lesson) {
        state = { lesson, currentBlockIndex: 0, isLoading: false, error: null };
        notify();
    },

    setLoading(isLoading) {
        state = { ...state, isLoading };
        notify();
    },

    setError(error) {
        state = { ...state, error, isLoading: false };
        notify();
    },

    advanceBlock() {
        const maxIndex = (state.lesson?.content_json?.blocks?.length ?? 1) - 1;
        if (state.currentBlockIndex < maxIndex) {
            state = { ...state, currentBlockIndex: state.currentBlockIndex + 1 };
            notify();
        }
    },

    reset() {
        state = { lesson: null, currentBlockIndex: 0, isLoading: false, error: null };
        notify();
    },

    subscribe(fn) {
        listeners.add(fn);
        fn({ ...state });
        return () => listeners.delete(fn);
    },
};