import { env } from '../config/env.js';

export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

export const notFound = (message = 'Not found') =>
    new AppError(message, 404, 'NOT_FOUND');

export const unauthorized = (message = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED');

export const forbidden = (message = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN');

export const badRequest = (message) =>
    new AppError(message, 400, 'BAD_REQUEST');

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode ?? 500;
    const code = err.code ?? 'INTERNAL_ERROR';

    if (statusCode >= 500) {
        console.error(`[error] ${req.method} ${req.path}`, err);
    }

    res.status(statusCode).json({
        error: {
            code,
            message: err.isOperational ? err.message : 'Something went wrong',
            ...(env.isDev && !err.isOperational && { stack: err.stack }),
        }
    });
};