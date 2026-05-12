import { http } from './http.js';
import { storage, ACCESS_TOKEN_KEY, USER_KEY } from '../utils/storage.js';
import { clientBus, CLIENT_EVENTS } from '../utils/eventBus.js';

export const register = async ({ email, username, displayName, password }) => {
    const result = await http.post('/auth/register', { email, username, displayName, password });
    storage.set(ACCESS_TOKEN_KEY, result.data.accessToken);
    storage.set(USER_KEY, result.data.user);
    clientBus.emit(CLIENT_EVENTS.USER_LOADED, { user: result.data.user });
    return result.data;
};

export const login = async ({ email, password }) => {
    const result = await http.post('/auth/login', { email, password });
    storage.set(ACCESS_TOKEN_KEY, result.data.accessToken);
    storage.set(USER_KEY, result.data.user);
    clientBus.emit(CLIENT_EVENTS.USER_LOADED, { user: result.data.user });
    return result.data;
};

export const logout = async () => {
    try {
        await http.post('/auth/logout', {});
    } finally {
        storage.clear();
        clientBus.emit(CLIENT_EVENTS.USER_LOGGED_OUT, {});
        navigate('/');
    }
};

export const getMe = async () => {
    const result = await http.get('/auth/me');
    storage.set(USER_KEY, result.data.user);
    return result.data.user;
};

export const isAuthenticated = () => {
    return !!storage.get(ACCESS_TOKEN_KEY);
};

export const requireAuth = () => {
    if (!isAuthenticated()) {
        navigate('/');
        return false;
    }
    return true;
};

export const navigate = (path) => {
    if (document.startViewTransition) {
        document.startViewTransition(() => { window.location.href = path; });
    } else {
        window.location.href = path;
    }
};