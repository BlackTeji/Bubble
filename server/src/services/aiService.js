import OpenAI from 'openai';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { buildAIContext } from './aiContextBuilder.js';
import { eventBus, EVENTS } from '../events/eventBus.js';

const MAX_HINTS_PER_DAY = 10;

let openaiClient = null;
const getClient = () => {
    if (!openaiClient && env.openai.apiKey) {
        openaiClient = new OpenAI({ apiKey: env.openai.apiKey });
    }
    return openaiClient;
};

export const checkHintAllowance = async (userId) => {
    // Count today's hints from analytics_events — resets automatically each day
    // without requiring a scheduled job or additional column
    const { rows } = await query(
        `SELECT COUNT(*) AS hints_today
     FROM analytics_events
     WHERE user_id = $1
       AND event_name = 'hint_requested'
       AND created_at >= CURRENT_DATE`,
        [userId]
    );
    const used = parseInt(rows[0]?.hints_today ?? 0, 10);
    return { allowed: used < MAX_HINTS_PER_DAY, used, max: MAX_HINTS_PER_DAY };
};

export const recordHintUsed = async (userId) => {
    // The analytics event logged by analyticsHandler (via HINT_REQUESTED event) serves
    // as the hint usage record. We update learner_state for real-time context only.
    await query(
        `UPDATE learner_state
     SET last_hint_at = NOW(),
         updated_at   = NOW()
     WHERE user_id = $1`,
        [userId]
    );
};

export const getHint = async (userId, lesson, session) => {
    const client = getClient();
    if (!client) {
        return {
            message: 'AI hints are not configured. Check your OPENAI_API_KEY environment variable.',
            isConfigured: false,
        };
    }

    const allowance = await checkHintAllowance(userId);
    if (!allowance.allowed) {
        return {
            message: `You've used all ${allowance.max} hints for today. Come back tomorrow — or try working through it yourself first.`,
            limitReached: true,
        };
    }

    const { systemPrompt, context } = await buildAIContext(userId, lesson, session);

    const userMessage = session.question
        ? session.question
        : session.userCode
            ? `Here is my code so far. Can you give me a hint?\n\`\`\`\n${session.userCode}\n\`\`\``
            : 'I need a hint to get started.';

    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 350,
        temperature: 0.7,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
    });

    const responseText = completion.choices[0]?.message?.content ?? 'I had trouble generating a hint. Please try again.';

    await recordHintUsed(userId);

    eventBus.publish(EVENTS.HINT_REQUESTED, {
        userId,
        lessonId: lesson.id,
        hintNumber: session.hintNumber ?? 1,
    });

    return {
        hint: responseText,
        hintsUsed: allowance.used + 1,
        hintsRemaining: allowance.max - allowance.used - 1,
        isConfigured: true,
    };
};

export const getExplanation = async (userId, lesson, concept, session = {}) => {
    const client = getClient();
    if (!client) return { message: 'AI not configured.', isConfigured: false };

    const { systemPrompt } = await buildAIContext(userId, lesson, {
        ...session,
        blockContext: `Learner asked about: "${concept}"`,
    });

    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.65,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Can you explain "${concept}" in a simple, practical way?` },
        ],
    });

    return {
        explanation: completion.choices[0]?.message?.content ?? 'I had trouble generating an explanation.',
        isConfigured: true,
    };
};