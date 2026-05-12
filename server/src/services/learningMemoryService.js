import { query } from '../db/pool.js';

export const getLearnerMemory = async (userId) => {
    const [recentRows, struggleRows, strengthRows, hintRows] = await Promise.all([
        query(
            `SELECT event_name, metadata, created_at
       FROM analytics_events
       WHERE user_id = $1 AND event_name IN ('lesson_completed', 'badge_earned', 'level_up')
       ORDER BY created_at DESC LIMIT 20`,
            [userId]
        ),
        query(
            `SELECT metadata->>'lessonId' AS lesson_id, COUNT(*) AS attempts
       FROM analytics_events
       WHERE user_id = $1 AND event_name = 'submission_completed'
         AND (metadata->>'isCorrect')::boolean = false
       GROUP BY lesson_id
       HAVING COUNT(*) >= 3
       ORDER BY COUNT(*) DESC LIMIT 5`,
            [userId]
        ),
        query(
            `SELECT metadata->>'lessonId' AS lesson_id
       FROM analytics_events
       WHERE user_id = $1 AND event_name = 'submission_completed'
         AND (metadata->>'isFirstAttempt')::boolean = true
       ORDER BY created_at DESC LIMIT 10`,
            [userId]
        ),
        query(
            `SELECT COUNT(*) AS total_hints
       FROM analytics_events
       WHERE user_id = $1 AND event_name = 'hint_requested'
         AND created_at > NOW() - INTERVAL '7 days'`,
            [userId]
        ),
    ]);

    return {
        recentActivity: recentRows.rows,
        struggledLessons: struggleRows.rows,
        firstAttemptWins: strengthRows.rows.length,
        hintsLast7Days: parseInt(hintRows.rows[0]?.total_hints ?? 0, 10),
    };
};

export const formatMemoryForContext = (memory) => {
    const parts = [];

    if (memory.firstAttemptWins > 5) {
        parts.push(`Strong pattern: gets concepts on first attempt frequently (${memory.firstAttemptWins} recent).`);
    }

    if (memory.hintsLast7Days > 15) {
        parts.push(`Has been using hints frequently this week (${memory.hintsLast7Days} hints in 7 days).`);
    } else if (memory.hintsLast7Days === 0) {
        parts.push('Has not used any hints this week — prefers to work independently.');
    }

    if (memory.struggledLessons.length > 0) {
        parts.push(`Has struggled with ${memory.struggledLessons.length} lesson(s) requiring 3+ attempts.`);
    }

    return parts.length > 0 ? parts.join(' ') : 'No significant patterns detected yet.';
};