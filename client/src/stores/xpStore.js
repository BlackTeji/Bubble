import { getXPProgress, getCareerStage } from '../../shared/xpCalculator.js';

let state = {
    totalXP: 0,
    level: 1,
    progressXP: 0,
    neededXP: 100,
    percentage: 0,
    careerStage: null,
};

const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn({ ...state }));

export const xpStore = {
    get() {
        return { ...state };
    },

    setFromXP(totalXP) {
        const progress = getXPProgress(totalXP);
        const careerStage = getCareerStage(totalXP);
        state = { totalXP, ...progress, careerStage };
        notify();
    },

    subscribe(fn) {
        listeners.add(fn);
        fn({ ...state });
        return () => listeners.delete(fn);
    },
};