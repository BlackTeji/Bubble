import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { success } from '../utils/response.js';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
    try {
        const { rows } = await query(
            `SELECT up.lesson_id, up.status, up.score, up.attempts, up.completed_at
       FROM user_progress up
       WHERE up.user_id = $1`,
            [req.user.id]
        );
        return success(res, { progress: rows });
    } catch (err) {
        next(err);
    }
});

export default router;