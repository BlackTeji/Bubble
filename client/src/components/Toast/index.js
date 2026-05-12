import { clientBus, CLIENT_EVENTS } from '../../utils/eventBus.js';

const AUTO_DISMISS_MS = 4000;

const createToastEl = ({ message, type = 'info' }) => {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
    <p class="toast-message">${message}</p>
    <button class="toast-dismiss" aria-label="Dismiss notification">×</button>
  `;

    el.querySelector('.toast-dismiss').addEventListener('click', () => dismissToast(el));

    return el;
};

const dismissToast = (el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(8px)';
    el.style.transition = `opacity 200ms ease, transform 200ms ease`;
    setTimeout(() => el.remove(), 200);
};

export const showToast = ({ message, type = 'info', duration = AUTO_DISMISS_MS }) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = createToastEl({ message, type });
    container.appendChild(el);

    if (duration > 0) {
        setTimeout(() => {
            if (el.isConnected) dismissToast(el);
        }, duration);
    }
};

export const mountToastSystem = () => {
    clientBus.on(CLIENT_EVENTS.TOAST_SHOW, ({ message, type, duration }) => {
        showToast({ message, type, duration });
    });
};

export const toast = {
    success: (message) => showToast({ message, type: 'success' }),
    error: (message) => showToast({ message, type: 'error' }),
    info: (message) => showToast({ message, type: 'info' }),
};