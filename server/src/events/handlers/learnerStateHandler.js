import { eventBus, EVENTS } from '../eventBus.js';
import { query } from '../../db/pool.js';

const STRUGGLE_THRESHOLD = 3;
const CONFIDENT_STREAK = 5;

const updateState = async (userId, statePatch) => {
    await query(
        `UPDATE learner_state
     SET state            = COALESCE($1, state),
         confidence_score = COALESCE($2, confidence_score),
         struggle_count   = COALESCE($3, struggle_count),
         updated_at       = NOW()
     WHERE user_id = $4`,
        [statePatch.state ?? null, statePatch.confidenceScore ?? null, statePatch.struggleCount ?? null, userId]
    );
};

eventBus.on(EVENTS.SUBMISSION_COMPLETED, async ({ userId, isCorrect, isFirstAttempt }) => {
    try {
        const { rows } = await query(
            `SELECT state, confidence_score, struggle_count FROM learner_state WHERE user_id = $1`,
            [userId]
        );

        if (!rows[0]) return;
        const current = rows[0];

        if (!isCorrect) {
            const newStruggleCount = current.struggle_count + 1;
            const newConfidence = Math.max(0, current.confidence_score - 5);
            const newState = newStruggleCount >= STRUGGLE_THRESHOLD ? 'struggling' : current.state;

            await updateState(userId, {
                state: newState,
                confidenceScore: newConfidence,
                struggleCount: newStruggleCount,
            });

            if (newState === 'struggling') {
                eventBus.publish(EVENTS.LEARNER_STATE_CHANGED, { userId, state: 'struggling' });
            }
        } else {
            const confidenceGain = isFirstAttempt ? 8 : 3;
            const newConfidence = Math.min(100, current.confidence_score + confidenceGain);
            const newState = newConfidence >= 75 ? 'confident' : 'progressing';

            await updateState(userId, {
                state: newState,
                confidenceScore: newConfidence,
                struggleCount: 0,
            });
        }
    } catch (err) {
        console.error('[learnerStateHandler] Error:', err.message);
    }
});

eventBus.on(EVENTS.STREAK_LOST, async ({ userId }) => {
    try {
        await updateState(userId, { state: 'inactive' });
    } catch (err) {
        console.error('[learnerStateHandler] streak.lost error:', err.message);
    }
});