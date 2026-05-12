import { resolveTone } from './tones.js';
import { templates, fallbacks } from './templates.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const getMessage = (event, ctx = {}) => {
    const tone = resolveTone(event, ctx);
    const eventTemplates = templates[event];

    if (!eventTemplates) return pick(fallbacks);

    const toneVariants = eventTemplates[tone] ?? Object.values(eventTemplates)[0];

    if (!toneVariants || toneVariants.length === 0) return pick(fallbacks);

    return pick(toneVariants);
};

export const getMessageWithTone = (event, ctx = {}) => {
    const tone = resolveTone(event, ctx);
    return { message: getMessage(event, ctx), tone };
};

export { TONES } from './tones.js';