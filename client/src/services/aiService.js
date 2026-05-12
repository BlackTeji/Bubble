import { http, HttpError } from './http.js';

const hintState = new Map();

const getHintNumber = (lessonId) => (hintState.get(lessonId) ?? 0) + 1;
const incrementHint = (lessonId) => hintState.set(lessonId, getHintNumber(lessonId));
const resetHints = (lessonId) => hintState.delete(lessonId);

export const requestHint = async ({ lessonId, userCode, question, errorMessage }) => {
    const hintNumber = getHintNumber(lessonId);

    const result = await http.post('/ai/hint', {
        lessonId,
        userCode,
        question,
        errorMessage,
        hintNumber,
    });

    incrementHint(lessonId);
    return result.data;
};

export const requestExplanation = async ({ lessonId, concept }) => {
    const result = await http.post('/ai/explain', { lessonId, concept });
    return result.data;
};

export const resetHintCount = (lessonId) => resetHints(lessonId);

export const getHintCount = (lessonId) => hintState.get(lessonId) ?? 0;