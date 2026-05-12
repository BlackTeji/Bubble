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

router.get('/:lessonId/navigation', authenticate, async (req, res, next) => {
    try {
        const { rows: currentRows } = await query(
            `SELECT l.id, l.path_id, l.order_index, l.slug,
              lp.order_index AS path_order, lp.course_id
       FROM lessons l
       JOIN learning_paths lp ON lp.id = l.path_id
       WHERE l.id = $1`,
            [req.params.lessonId]
        );

        if (!currentRows[0]) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson not found.' } });
        }

        const current = currentRows[0];

        const { rows: allLessons } = await query(
            `SELECT l.id, l.title, l.type, l.slug, l.order_index, l.estimated_mins, l.xp_reward,
              lp.id AS path_id, lp.title AS path_title, lp.order_index AS path_order
       FROM lessons l
       JOIN learning_paths lp ON lp.id = l.path_id
       WHERE lp.course_id = $1
       ORDER BY lp.order_index, l.order_index`,
            [current.course_id]
        );

        const currentIndex = allLessons.findIndex((l) => l.id === current.id);

        const prev = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
        const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

        const lessonsInPath = allLessons.filter((l) => l.path_id === current.path_id);
        const positionInPath = lessonsInPath.findIndex((l) => l.id === current.id) + 1;

        return success(res, {
            prev: prev ? { id: prev.id, title: prev.title, type: prev.type, pathTitle: prev.path_title } : null,
            next: next ? { id: next.id, title: next.title, type: next.type, pathTitle: next.path_title } : null,
            position: {
                current: positionInPath,
                total: lessonsInPath.length,
                pathTitle: lessonsInPath[0]?.path_title ?? '',
                courseIndex: currentIndex + 1,
                courseTotal: allLessons.length,
            },
        });
    } catch (err) {
        next(err);
    }
});

export default router;