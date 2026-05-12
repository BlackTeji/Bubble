import { query } from '../db/pool.js';
import * as authService from '../services/authService.js';
import { eventBus, EVENTS } from '../events/eventBus.js';
import { success, created, failure } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

export const register = async (req, res, next) => {
    try {
        const { email, username, displayName, password } = req.body;

        const existing = await query(
            `SELECT id FROM users WHERE email = $1 OR username = $2`,
            [email.toLowerCase(), username.toLowerCase()]
        );

        if (existing.rows.length > 0) {
            return failure(res, 'ALREADY_EXISTS', 'An account with that email or username already exists.');
        }

        const passwordHash = await authService.hashPassword(password);

        const { rows } = await query(
            `INSERT INTO users (email, username, display_name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, display_name, current_xp, level, onboarding_done, created_at`,
            [email.toLowerCase(), username.toLowerCase(), displayName ?? username, passwordHash]
        );

        const user = rows[0];

        await query(
            `INSERT INTO streaks (user_id) VALUES ($1)`,
            [user.id]
        );

        await query(
            `INSERT INTO learner_state (user_id) VALUES ($1)`,
            [user.id]
        );

        eventBus.publish(EVENTS.USER_REGISTERED, { userId: user.id, email: user.email });

        const accessToken = authService.signAccessToken(user);
        const refreshToken = authService.signRefreshToken();
        await authService.storeRefreshToken(user.id, refreshToken);
        authService.setRefreshCookie(res, refreshToken);

        return created(res, { user: sanitizeUser(user), accessToken }, 'Account created successfully.');
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const { rows } = await query(
            `SELECT id, email, username, display_name, password_hash, current_xp, level,
              onboarding_done, avatar_url, last_active_at
       FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        const user = rows[0];

        if (!user) {
            return failure(res, 'INVALID_CREDENTIALS', 'Incorrect email or password.', 401);
        }

        const passwordValid = await authService.verifyPassword(password, user.password_hash);

        if (!passwordValid) {
            return failure(res, 'INVALID_CREDENTIALS', 'Incorrect email or password.', 401);
        }

        await query(
            `UPDATE users SET last_active_at = NOW() WHERE id = $1`,
            [user.id]
        );

        const accessToken = authService.signAccessToken(user);
        const refreshToken = authService.signRefreshToken();
        await authService.storeRefreshToken(user.id, refreshToken);
        authService.setRefreshCookie(res, refreshToken);

        return success(res, { user: sanitizeUser(user), accessToken }, 'Welcome back.');
    } catch (err) {
        next(err);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const rawToken = req.cookies?.refreshToken;

        if (!rawToken) {
            return failure(res, 'NO_TOKEN', 'No refresh token provided.', 401);
        }

        const { rows } = await query(
            `SELECT u.id, u.email, u.username, u.display_name, u.current_xp, u.level,
              u.onboarding_done, u.avatar_url
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = encode(sha256($1::bytea), 'hex')
         AND rt.expires_at > NOW()`,
            [rawToken]
        );

        if (rows.length === 0) {
            authService.clearRefreshCookie(res);
            return failure(res, 'INVALID_TOKEN', 'Session expired. Please log in again.', 401);
        }

        const user = rows[0];
        const newRefreshToken = await authService.rotateRefreshToken(user.id, rawToken);

        if (!newRefreshToken) {
            authService.clearRefreshCookie(res);
            return failure(res, 'INVALID_TOKEN', 'Session expired. Please log in again.', 401);
        }

        const accessToken = authService.signAccessToken(user);
        authService.setRefreshCookie(res, newRefreshToken);

        return success(res, { user: sanitizeUser(user), accessToken });
    } catch (err) {
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        if (req.user?.id) {
            await authService.revokeAllTokens(req.user.id);
        }
        authService.clearRefreshCookie(res);
        return success(res, null, 'Logged out successfully.');
    } catch (err) {
        next(err);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const { rows } = await query(
            `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
              u.current_xp, u.level, u.onboarding_done, u.learning_goal, u.skill_level,
              u.last_active_at, u.created_at,
              s.current_streak, s.longest_streak, s.last_activity,
              ls.state AS learner_state, ls.confidence_score
       FROM users u
       LEFT JOIN streaks s ON s.user_id = u.id
       LEFT JOIN learner_state ls ON ls.user_id = u.id
       WHERE u.id = $1`,
            [req.user.id]
        );

        if (rows.length === 0) {
            throw new AppError('User not found', 404, 'NOT_FOUND');
        }

        return success(res, { user: rows[0] });
    } catch (err) {
        next(err);
    }
};

export const updateMe = async (req, res, next) => {
    try {
        const { displayName, learningGoal, skillLevel, onboardingDone } = req.body;

        const { rows } = await query(
            `UPDATE users
       SET display_name    = COALESCE($1, display_name),
           learning_goal   = COALESCE($2, learning_goal),
           skill_level     = COALESCE($3, skill_level),
           onboarding_done = CASE WHEN $4 IS NOT NULL THEN $4 ELSE onboarding_done END,
           updated_at      = NOW()
       WHERE id = $5
       RETURNING id, email, username, display_name, avatar_url, current_xp, level, onboarding_done`,
            [displayName ?? null, learningGoal ?? null, skillLevel ?? null,
            onboardingDone !== undefined ? onboardingDone : null, req.user.id]
        );

        return success(res, { user: rows[0] }, 'Profile updated.');
    } catch (err) {
        next(err);
    }
};

const sanitizeUser = (user) => {
    const { password_hash, ...safe } = user;
    return safe;
};