import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import progressRoutes from './routes/progress.js';
import submissionRoutes from './routes/submissions.js';
import gamificationRoutes from './routes/gamification.js';
import aiRoutes from './routes/ai.js';
import playgroundRoutes from './routes/playground.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = join(__dirname, '../../client');
const SHARED_DIR = join(__dirname, '../../shared');

export const createApp = () => {
    const app = express();

    app.use(helmet({
        contentSecurityPolicy: false,
    }));

    app.use(cors({
        origin: env.clientUrl,
        credentials: true,
    }));

    app.use(express.json({ limit: '50kb' }));
    app.use(express.urlencoded({ extended: true, limit: '50kb' }));

    app.use(requestLogger);

    app.use('/shared', express.static(SHARED_DIR));
    app.use(express.static(CLIENT_DIR));

    app.use('/api', rateLimiter);

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/lessons', lessonRoutes);
    app.use('/api/progress', progressRoutes);
    app.use('/api/submissions', submissionRoutes);
    app.use('/api/gamification', gamificationRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/playground', playgroundRoutes);

    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'Route not found' });
        }
        res.sendFile(join(CLIENT_DIR, 'index.html'));
    });

    app.use(errorHandler);

    return app;
};