import { createLogger } from '../utils/logger.js';

const log = createLogger('http');

export const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, path } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

        log[level](`${method} ${path} ${status}`, {
            duration_ms: duration,
            user_id: req.user?.id ?? null,
        });
    });

    next();
};