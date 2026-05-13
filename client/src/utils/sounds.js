let audioCtx = null;

const getCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
};

const tone = (frequency, type, gainValue, durationSec, delayMs = 0) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setTimeout(() => {
        try {
            const ctx = getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = type;
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);

            gain.gain.setValueAtTime(gainValue, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + durationSec);
        } catch { /* Audio blocked or unavailable — silent fail */ }
    }, delayMs);
};

export const playCorrect = () => {
    tone(523.25, 'sine', 0.12, 0.3);       // C5
    tone(659.25, 'sine', 0.10, 0.4, 120);  // E5 slightly after
};

export const playWrong = () => {
    tone(329.63, 'sine', 0.08, 0.4);       // E4, soft and low
};

export const playComplete = () => {
    tone(523.25, 'sine', 0.10, 0.25);       // C5
    tone(659.25, 'sine', 0.10, 0.25, 180);  // E5
    tone(783.99, 'sine', 0.12, 0.5, 340);  // G5
};

export const playXP = () => {
    tone(880, 'sine', 0.08, 0.15);
    tone(1046.5, 'sine', 0.07, 0.2, 100);
};