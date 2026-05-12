import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from './errorHandler.js';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next(unauthorized('No token provided'));
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, env.jwt.secret);
        req.user = { id: payload.sub, email: payload.email };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(unauthorized('Token expired'));
        }
        next(unauthorized('Invalid token'));
    }
};

export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    try {
        const payload = jwt.verify(authHeader.slice(7), env.jwt.secret);
        req.user = { id: payload.sub, email: payload.email };
    } catch {

    }
    next();
};