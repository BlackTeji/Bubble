import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { success } from '../utils/response.js';
import { query } from '../db/pool.js';
import { getXPProgress, getCareerStage } from '../../../shared/xpCalculator.js';

const router = Router();

router.get('/summary', authenticate, async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { rows: userRows } = await query(
            `SELECT current_xp, level FROM users WHERE id = $1`,
            [userId]
        );

        const { rows: streakRows } = await query(
            `SELECT current_streak, longest_streak, last_activity FROM streaks WHERE user_id = $1`,
            [userId]
        );

        const { rows: badgeRows } = await query(
            `SELECT b.slug, b.title, b.description, b.icon, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
            [userId]
        );

        const user = userRows[0];
        const xpProgress = getXPProgress(user.current_xp);
        const careerStage = getCareerStage(user.current_xp);

        return success(res, {
            xp: user.current_xp,
            level: xpProgress.level,
            xpProgress,
            careerStage,
            streak: streakRows[0] ?? { current_streak: 0, longest_streak: 0 },
            badges: badgeRows,
        });
    } catch (err) {
        next(err);
    }
});

export default router;