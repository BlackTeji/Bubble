const LEVEL_BASE = 100;
const LEVEL_EXPONENT = 1.6;

const STREAK_MULTIPLIERS = {
    0: 1.0,
    1: 1.0,
    3: 1.2,
    7: 1.5,
    14: 1.8,
    30: 2.0,
};

const getStreakMultiplier = (streakDays) => {
    const thresholds = Object.keys(STREAK_MULTIPLIERS).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
        if (streakDays >= threshold) return STREAK_MULTIPLIERS[threshold];
    }
    return 1.0;
};

export const calculateXP = ({ base, streakDays = 0, isFirstAttempt = false, lessonType = 'concept' }) => {
    const streakMultiplier = getStreakMultiplier(streakDays);
    const typeBonus = lessonType === 'challenge' ? 1.3 : lessonType === 'scenario' ? 1.5 : 1.0;
    const firstAttemptBonus = isFirstAttempt ? 1.2 : 1.0;

    return Math.round(base * streakMultiplier * typeBonus * firstAttemptBonus);
};

export const xpForLevel = (level) => Math.round(LEVEL_BASE * Math.pow(LEVEL_EXPONENT, level - 1));

export const totalXPForLevel = (level) => {
    let total = 0;
    for (let i = 1; i < level; i++) total += xpForLevel(i);
    return total;
};

export const getLevelFromXP = (totalXP) => {
    let level = 1;
    let accumulated = 0;
    while (accumulated + xpForLevel(level) <= totalXP) {
        accumulated += xpForLevel(level);
        level++;
    }
    return level;
};

export const getXPProgress = (totalXP) => {
    const level = getLevelFromXP(totalXP);
    const xpForCurrentLevel = totalXPForLevel(level);
    const xpForNextLevel = totalXPForLevel(level + 1);
    const progressXP = totalXP - xpForCurrentLevel;
    const neededXP = xpForNextLevel - xpForCurrentLevel;

    return {
        level,
        progressXP,
        neededXP,
        percentage: Math.round((progressXP / neededXP) * 100),
    };
};

export const CAREER_STAGE_THRESHOLDS = [
    { slug: 'curious-beginner', xp: 0 },
    { slug: 'data-explorer', xp: 150 },
    { slug: 'junior-analyst', xp: 400 },
    { slug: 'insight-hunter', xp: 900 },
    { slug: 'dashboard-architect', xp: 1800 },
    { slug: 'analytics-strategist', xp: 3500 },
];

export const getCareerStage = (totalXP) => {
    const stages = [...CAREER_STAGE_THRESHOLDS].reverse();
    return stages.find(s => totalXP >= s.xp) ?? CAREER_STAGE_THRESHOLDS[0];
};