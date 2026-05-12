import { Router } from 'express';
import cookieParser from 'cookie-parser';
import * as authController from '../controllers/authController.js';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate, optionalAuth } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(cookieParser());

router.post('/register', authRateLimiter, validate(schemas.register), authController.register);
router.post('/login', authRateLimiter, validate(schemas.login), authController.login);
router.post('/refresh', authRateLimiter, authController.refresh);
router.post('/logout', optionalAuth, authController.logout);

router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validate(schemas.updateProfile), authController.updateMe);

export default router;