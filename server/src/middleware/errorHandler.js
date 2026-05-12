import { env } from '../config/env.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('error');

export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

export const notFound = (msg = 'Not found') => new AppError(msg, 404, 'NOT_FOUND');
export const unauthorized = (msg = 'Unauthorized') => new AppError(msg, 401, 'UNAUTHORIZED');
export const forbidden = (msg = 'Forbidden') => new AppError(msg, 403, 'FORBIDDEN');
export const badRequest = (msg) => new AppError(msg, 400, 'BAD_REQUEST');

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode ?? 500;
    const code = err.code ?? 'INTERNAL_ERROR';

    if (statusCode >= 500) {
        log.error(`${req.method} ${req.path}`, {
            message: err.message,
            code,
            stack: err.stack,
            user_id: req.user?.id ?? null,
        });
    } else if (statusCode >= 400 && statusCode !== 401) {
        log.warn(`${req.method} ${req.path} ${statusCode}`, {
            message: err.message,
            code,
        });
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message: err.isOperational
                ? err.message
                : 'An unexpected error occurred. Please try again.',
            ...(env.isDev && !err.isOperational && { detail: err.stack }),
        },
    });
};