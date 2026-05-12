import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 12;

export const hashPassword = (password) =>
    bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyPassword = (password, hash) =>
    bcrypt.compare(password, hash);

export const signAccessToken = (user) =>
    jwt.sign(
        { sub: user.id, email: user.email },
        env.jwt.secret,
        { expiresIn: env.jwt.accessExpires }
    );

export const signRefreshToken = () =>
    crypto.randomBytes(40).toString('hex');

export const storeRefreshToken = async (userId, rawToken) => {
    const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
    );
};

export const rotateRefreshToken = async (userId, rawToken) => {
    const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

    const { rows } = await query(
        `SELECT id FROM refresh_tokens
     WHERE user_id = $1
       AND token_hash = $2
       AND expires_at > NOW()`,
        [userId, tokenHash]
    );

    if (rows.length === 0) return null;

    await query(
        `DELETE FROM refresh_tokens WHERE token_hash = $1`,
        [tokenHash]
    );

    const newRawToken = signRefreshToken();
    await storeRefreshToken(userId, newRawToken);
    return newRawToken;
};

export const revokeAllTokens = async (userId) => {
    await query(
        `DELETE FROM refresh_tokens WHERE user_id = $1`,
        [userId]
    );
};

export const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: env.isProd,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
    });
};

export const clearRefreshCookie = (res) => {
    res.clearCookie('refreshToken', { path: '/api/auth' });
};