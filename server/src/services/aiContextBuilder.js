import { query } from '../db/pool.js';
import { getCareerStage } from '../../../shared/xpCalculator.js';
import { getLearnerMemory, formatMemoryForContext } from './learningMemoryService.js';

const LILIBET_PERSONA = `You are Lilibet, a thoughtful and patient data analytics mentor within Bubble, a learning platform.

Your character:
- Warm, intelligent, calm, and encouraging
- You speak like a knowledgeable colleague, not a textbook
- You never sound robotic, corporate, or fake-motivational
- You use plain language and short sentences
- You believe deeply in the learner's capability

Your teaching philosophy:
- Never give the full answer immediately — scaffold understanding
- Ask reflective questions that help the learner discover the answer
- Encourage persistence and reasoning over quick solutions
- Celebrate the process of thinking, not just correct answers
- Adapt your tone to where the learner is emotionally`;

const HINT_STRATEGIES = {
    1: `Hint level 1 — Directional nudge only.
Give a single sentence pointing the learner toward the right area of thinking.
Do NOT explain the concept. Do NOT show any code. Do NOT reveal the answer.
Example tone: "Think about what needs to come after SELECT in a SQL query."`,

    2: `Hint level 2 — Conceptual bridge.
Briefly explain the relevant concept using a plain-language analogy if helpful.
You may reference the lesson topic. Do NOT show solution code.
Keep your response to 2-3 sentences maximum.`,

    3: `Hint level 3 — Reasoned walkthrough.
Walk through the structure step by step.
You may show the partial pattern or structure but leave the final step for the learner to complete.
Encourage them: the last piece is theirs to find.`,
};

const EMOTIONAL_INSTRUCTIONS = {
    struggling: 'This learner is struggling. Use extra warmth. Give smaller, simpler steps. Reassure them before explaining.',
    confused: 'This learner is confused. Clarify with an analogy. Avoid jargon. Keep explanations short.',
    confident: 'This learner is confident. You can challenge them a little more. Offer a deeper interpretation or a follow-up question.',
    progressing: 'This learner is making solid progress. Be encouraging but keep the pace.',
    exploring: 'This learner is still exploring. Be welcoming. Celebrate curiosity.',
    disengaged: 'This learner may be losing momentum. Be warm and brief. Make the win feel close.',
    inactive: 'This learner is returning after a break. Welcome them back. Help them reconnect.',
};

const formatLearnerProfile = (user, learnerState, streak) => {
    const careerStage = getCareerStage(user.current_xp ?? 0);
    return `
Learner profile:
- Name: ${user.display_name ?? user.username}
- Career stage: ${careerStage.slug}
- Total XP: ${user.current_xp}
- Level: ${user.level}
- Skill level: ${user.skill_level ?? 'beginner'}
- Learning goal: ${user.learning_goal ?? 'not specified'}
- Current streak: ${streak?.current_streak ?? 0} days
- Emotional state: ${learnerState?.state ?? 'exploring'}
- Confidence score: ${learnerState?.confidence_score ?? 50}/100
- Recent struggle count: ${learnerState?.struggle_count ?? 0}`.trim();
};

const formatLessonContext = (lesson, blockContext) => `
Current lesson:
- Title: ${lesson.title}
- Type: ${lesson.type}
- Estimated time: ${lesson.estimated_mins} minutes
${blockContext ? `- Current exercise: ${blockContext}` : ''}`.trim();

const formatSessionContext = (session) => {
    const parts = [];
    if (session.userCode) parts.push(`Learner's current code:\n\`\`\`\n${session.userCode}\n\`\`\``);
    if (session.errorMessage) parts.push(`Error they received: ${session.errorMessage}`);
    if (session.question) parts.push(`Their question: "${session.question}"`);
    if (session.hintNumber) parts.push(`This is hint ${session.hintNumber} of 3.`);
    if (session.attempts > 1) parts.push(`They have attempted this ${session.attempts} times.`);
    return parts.length > 0 ? `\nSession context:\n${parts.join('\n')}` : '';
};

const getRecentPerformance = async (userId) => {
    const { rows } = await query(
        `SELECT is_correct, type, submitted_at
     FROM submissions
     WHERE user_id = $1
     ORDER BY submitted_at DESC
     LIMIT 10`,
        [userId]
    );

    if (rows.length === 0) return 'No recent submissions.';

    const correct = rows.filter((r) => r.is_correct).length;
    const rate = Math.round((correct / rows.length) * 100);
    return `Recent accuracy: ${rate}% correct over last ${rows.length} submissions.`;
};

export const buildAIContext = async (userId, lesson, session = {}) => {
    const [userRows, stateRows, streakRows, memory] = await Promise.all([
        query(`SELECT id, display_name, username, current_xp, level, skill_level, learning_goal FROM users WHERE id = $1`, [userId]),
        query(`SELECT state, confidence_score, struggle_count FROM learner_state WHERE user_id = $1`, [userId]),
        query(`SELECT current_streak FROM streaks WHERE user_id = $1`, [userId]),
        getLearnerMemory(userId),
    ]);

    const user = userRows.rows[0];
    const learnerState = stateRows.rows[0];
    const streak = streakRows.rows[0];
    const recentPerformance = await getRecentPerformance(userId);
    const memoryContext = formatMemoryForContext(memory);

    const emotionalInstruction = EMOTIONAL_INSTRUCTIONS[learnerState?.state ?? 'exploring'];
    const hintStrategy = HINT_STRATEGIES[session.hintNumber ?? 1];

    const systemPrompt = [
        LILIBET_PERSONA,
        '',
        emotionalInstruction,
        '',
        hintStrategy,
        '',
        formatLearnerProfile(user, learnerState, streak),
        '',
        `Learning patterns: ${memoryContext}`,
        '',
        formatLessonContext(lesson, session.blockContext),
        '',
        recentPerformance,
        formatSessionContext(session),
        '',
        'Keep your response concise (under 120 words). Do not use markdown headers or bullet lists. Speak naturally.',
    ].join('\n');

    return {
        systemPrompt,
        context: { user, learnerState, streak, lesson, session },
    };
};