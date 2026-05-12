export const TONES = {
    ENCOURAGEMENT: 'encouragement',
    CELEBRATION: 'celebration',
    REASSURANCE: 'reassurance',
    GUIDANCE: 'guidance',
    REFLECTION: 'reflection',
    CHALLENGE: 'challenge',
    RECOVERY: 'recovery',
};

export const resolveTone = (event, ctx = {}) => {
    const { attempts = 1, isCorrect, streakLost, levelUp, isFirst, state } = ctx;

    if (levelUp) return TONES.CELEBRATION;
    if (streakLost) return TONES.RECOVERY;
    if (isCorrect && attempts === 1) return TONES.CELEBRATION;
    if (isCorrect && attempts > 1) return TONES.ENCOURAGEMENT;
    if (!isCorrect && attempts >= 3) return TONES.REASSURANCE;
    if (!isCorrect && attempts === 2) return TONES.GUIDANCE;
    if (!isCorrect) return TONES.GUIDANCE;
    if (state === 'struggling') return TONES.REASSURANCE;
    if (state === 'confident' && isFirst) return TONES.CHALLENGE;
    if (event.endsWith('_complete') && isFirst) return TONES.CELEBRATION;
    if (event.endsWith('_complete')) return TONES.REFLECTION;
    if (event.endsWith('_start')) return TONES.ENCOURAGEMENT;

    return TONES.ENCOURAGEMENT;
};