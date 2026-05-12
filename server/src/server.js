import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { loadContent } from './services/contentLoader.js';
import './events/handlers/xpHandler.js';
import './events/handlers/badgeHandler.js';
import './events/handlers/streakHandler.js';
import './events/handlers/analyticsHandler.js';
import './events/handlers/learnerStateHandler.js';
import './events/handlers/celebrationHandler.js';
import './events/handlers/lilibetHandler.js';

const start = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('[db] Connected to PostgreSQL');

        await loadContent();

        const app = createApp();

        app.listen(env.port, () => {
            console.log(`[server] Bubble running on port ${env.port} (${env.nodeEnv})`);
        });
    } catch (err) {
        console.error('[server] Failed to start:', err.message);
        process.exit(1);
    }
};

start();