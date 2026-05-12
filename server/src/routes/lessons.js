import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { success } from '../utils/response.js';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
    try {
        const { pathId } = req.query;
        if (!pathId) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'pathId is required.' } });

        const { rows } = await query(
            `SELECT id, slug, title, type, xp_reward, estimated_mins, order_index
       FROM lessons WHERE path_id = $1 ORDER BY order_index`,
            [pathId]
        );
        return success(res, { lessons: rows });
    } catch (err) {
        next(err);
    }
});

router.get('/:lessonId', authenticate, async (req, res, next) => {
    try {
        const { rows } = await query(
            `SELECT l.*, lp.title AS path_title, c.slug AS course_slug
       FROM lessons l
       JOIN learning_paths lp ON lp.id = l.path_id
       JOIN courses c ON c.id = lp.course_id
       WHERE l.id = $1`,
            [req.params.lessonId]
        );

        if (!rows[0]) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson not found.' } });
        return success(res, { lesson: rows[0] });
    } catch (err) {
        next(err);
    }
});

export default router;