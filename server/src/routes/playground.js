import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { success, failure } from '../utils/response.js';
import { executeQuery } from '../services/sqlEngine.js';
import { eventBus, EVENTS } from '../events/eventBus.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/run', authenticate, rateLimiter, async (req, res, next) => {
    try {
        const { sql, dataset = 'ecommerce', lessonId } = req.body;

        if (!sql || typeof sql !== 'string') {
            return failure(res, 'VALIDATION_ERROR', 'sql is required.');
        }

        const result = await executeQuery(sql.trim(), dataset);

        if (lessonId) {
            eventBus.publish(EVENTS.PLAYGROUND_RUN, { userId: req.user.id, lessonId });
        }

        return success(res, result);
    } catch (err) {
        next(err);
    }
});

router.get('/dataset/:slug', authenticate, async (req, res, next) => {
    try {
        const { readFile } = await import('fs/promises');
        const { join, dirname } = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const path = join(__dirname, '../../../content/datasets', `${req.params.slug}.json`);

        const raw = await readFile(path, 'utf8');
        const dataset = JSON.parse(raw);

        const schema = {};
        for (const [tableName, table] of Object.entries(dataset.tables)) {
            schema[tableName] = { description: table.description, columns: table.columns };
        }

        return success(res, { name: dataset.name, description: dataset.description, schema });
    } catch {
        return failure(res, 'NOT_FOUND', 'Dataset not found.', 404);
    }
});

export default router;