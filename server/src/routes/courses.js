import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { success } from '../utils/response.js';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
    try {
        const { rows } = await query(
            `SELECT id, slug, title, description, difficulty, order_index
       FROM courses WHERE is_published = true ORDER BY order_index`
        );
        return success(res, { courses: rows });
    } catch (err) {
        next(err);
    }
});

router.get('/:slug', authenticate, async (req, res, next) => {
    try {
        const { rows } = await query(
            `SELECT c.*, 
        json_agg(
          json_build_object('id', lp.id, 'slug', lp.slug, 'title', lp.title, 'order_index', lp.order_index)
          ORDER BY lp.order_index
        ) AS paths
       FROM courses c
       LEFT JOIN learning_paths lp ON lp.course_id = c.id
       WHERE c.slug = $1 AND c.is_published = true
       GROUP BY c.id`,
            [req.params.slug]
        );

        if (!rows[0]) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
        return success(res, { course: rows[0] });
    } catch (err) {
        next(err);
    }
});

export default router;