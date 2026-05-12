import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate, schemas } from '../middleware/validate.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { success, failure } from '../utils/response.js';
import { query } from '../db/pool.js';
import * as aiService from '../services/aiService.js';

const router = Router();

router.post('/hint', authenticate, aiRateLimiter, validate(schemas.aiHint), async (req, res, next) => {
    try {
        const { lessonId, userCode, question, hintNumber = 1, errorMessage } = req.body;
        const userId = req.user.id;

        const { rows: lessonRows } = await query(
            `SELECT id, title, type, estimated_mins, content_json FROM lessons WHERE id = $1`,
            [lessonId]
        );

        if (!lessonRows[0]) {
            return failure(res, 'NOT_FOUND', 'Lesson not found.', 404);
        }

        const lesson = lessonRows[0];

        const hintResult = await aiService.getHint(userId, lesson, {
            userCode,
            question,
            errorMessage,
            hintNumber: Math.min(Math.max(parseInt(hintNumber, 10), 1), 3),
        });

        if (hintResult.limitReached) {
            return failure(res, 'HINT_LIMIT', hintResult.message, 429);
        }

        return success(res, hintResult);
    } catch (err) {
        next(err);
    }
});

router.post('/explain', authenticate, aiRateLimiter, async (req, res, next) => {
    try {
        const { lessonId, concept } = req.body;
        const userId = req.user.id;

        if (!concept || typeof concept !== 'string' || concept.length > 200) {
            return failure(res, 'VALIDATION_ERROR', 'concept is required and must be under 200 characters.');
        }

        const { rows: lessonRows } = await query(
            `SELECT id, title, type, estimated_mins FROM lessons WHERE id = $1`,
            [lessonId]
        );

        const lesson = lessonRows[0] ?? { id: lessonId, title: 'General', type: 'concept', estimated_mins: 5 };

        const result = await aiService.getExplanation(userId, lesson, concept);
        return success(res, result);
    } catch (err) {
        next(err);
    }
});

export default router;