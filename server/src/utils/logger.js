import { env } from '../config/env.js';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = env.isDev ? LEVELS.debug : LEVELS.info;

const format = (level, namespace, message, meta) => {
    const timestamp = new Date().toISOString();
    if (env.isDev) {
        const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
        return `[${timestamp}] ${level.toUpperCase().padEnd(5)} [${namespace}] ${message}${metaStr}`;
    }
    return JSON.stringify({ timestamp, level, ns: namespace, msg: message, ...meta });
};

const write = (level, namespace, message, meta) => {
    if (LEVELS[level] < MIN_LEVEL) return;
    const line = format(level, namespace, message, meta);
    if (level === 'error' || level === 'warn') {
        process.stderr.write(line + '\n');
    } else {
        process.stdout.write(line + '\n');
    }
};

export const createLogger = (namespace) => ({
    debug: (msg, meta) => write('debug', namespace, msg, meta),
    info: (msg, meta) => write('info', namespace, msg, meta),
    warn: (msg, meta) => write('warn', namespace, msg, meta),
    error: (msg, meta) => write('error', namespace, msg, meta),
});

export const logger = createLogger('app');