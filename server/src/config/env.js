import 'dotenv/config';

const required = (key) => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
};

const optional = (key, fallback) => process.env[key] ?? fallback;

export const env = {
    nodeEnv: optional('NODE_ENV', 'development'),
    port: parseInt(optional('PORT', '3000'), 10),
    isDev: optional('NODE_ENV', 'development') === 'development',
    isProd: optional('NODE_ENV', 'development') === 'production',

    databaseUrl: required('DATABASE_URL'),

    jwt: {
        secret: required('JWT_SECRET'),
        accessExpires: optional('JWT_ACCESS_EXPIRES', '15m'),
        refreshExpires: optional('JWT_REFRESH_EXPIRES', '7d'),
    },

    openai: {
        apiKey: optional('OPENAI_API_KEY', ''),
    },

    clientUrl: optional('CLIENT_URL', 'http://localhost:3000'),

    email: {
        resendApiKey: optional('RESEND_API_KEY', ''),
        from: optional('FROM_EMAIL', 'noreply@bubble.app'),
    },
};