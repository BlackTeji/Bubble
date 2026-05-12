import { storage, ACCESS_TOKEN_KEY } from '../utils/storage.js';
import { clientBus, CLIENT_EVENTS } from '../utils/eventBus.js';

const BASE_URL = '/api';
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (accessToken) => {
    refreshQueue.forEach((resolve) => resolve(accessToken));
    refreshQueue = [];
};

const attemptTokenRefresh = async () => {
    if (isRefreshing) {
        return new Promise((resolve) => refreshQueue.push(resolve));
    }

    isRefreshing = true;

    try {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            storage.remove(ACCESS_TOKEN_KEY);
            clientBus.emit(CLIENT_EVENTS.USER_LOGGED_OUT, {});
            throw new Error('Session expired');
        }

        const { data } = await response.json();
        const newToken = data.accessToken;
        storage.set(ACCESS_TOKEN_KEY, newToken);
        processQueue(newToken);
        return newToken;
    } finally {
        isRefreshing = false;
    }
};

const request = async (path, options = {}, retry = true) => {
    const token = storage.get(ACCESS_TOKEN_KEY);

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (response.status === 401 && retry) {
        try {
            const newToken = await attemptTokenRefresh();
            return request(path, options, false);
        } catch {
            throw new HttpError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
        }
    }

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage = body?.error?.message ?? 'Something went wrong.';
        const errorCode = body?.error?.code ?? 'UNKNOWN_ERROR';
        throw new HttpError(errorMessage, response.status, errorCode);
    }

    return body;
};

export class HttpError extends Error {
    constructor(message, status, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export const http = {
    get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
    patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};