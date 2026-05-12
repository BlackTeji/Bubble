import { isAuthenticated, login, register, navigate } from '../services/authService.js';
import { mountToastSystem, toast } from '../components/Toast/index.js';
import { HttpError } from '../services/http.js';

mountToastSystem();

if (isAuthenticated()) {
    navigate('/dashboard.html');
}

const root = document.getElementById('page-root');

let activeForm = 'login';

const renderPage = () => {
    root.innerHTML = `
    <div class="auth-page">
      <div class="auth-card card animate-fade-in-up">

        <div class="auth-brand">
          <span class="auth-brand-dot" aria-hidden="true">●</span>
          <span class="auth-brand-name">Bubble</span>
        </div>

        <div class="auth-lilibet lilibet-message">
          <div class="lilibet-avatar" aria-hidden="true">L</div>
          <p class="lilibet-text">
            ${activeForm === 'login'
            ? 'Welcome back. You were in the middle of something.'
            : 'Every analyst you\'ve ever admired started exactly where you are right now.'}
          </p>
        </div>

        <div class="auth-tabs" role="tablist">
          <button class="auth-tab ${activeForm === 'login' ? 'auth-tab--active' : ''}"
                  role="tab" aria-selected="${activeForm === 'login'}" id="tab-login" data-form="login">
            Sign in
          </button>
          <button class="auth-tab ${activeForm === 'register' ? 'auth-tab--active' : ''}"
                  role="tab" aria-selected="${activeForm === 'register'}" id="tab-register" data-form="register">
            Get started
          </button>
        </div>

        ${activeForm === 'login' ? renderLoginForm() : renderRegisterForm()}
      </div>
    </div>
  `;

    bindFormEvents();
};

const renderLoginForm = () => `
  <form id="auth-form" novalidate>
    <div class="form-group">
      <label class="form-label" for="email">Email</label>
      <input class="form-input" type="email" id="email" name="email"
             autocomplete="email" placeholder="you@example.com" required>
    </div>
    <div class="form-group">
      <label class="form-label" for="password">Password</label>
      <input class="form-input" type="password" id="password" name="password"
             autocomplete="current-password" placeholder="••••••••" required>
    </div>
    <button type="submit" class="btn btn-primary auth-submit">Sign in</button>
  </form>
`;

const renderRegisterForm = () => `
  <form id="auth-form" novalidate>
    <div class="form-group">
      <label class="form-label" for="displayName">Your name</label>
      <input class="form-input" type="text" id="displayName" name="displayName"
             autocomplete="name" placeholder="Alex Chen">
    </div>
    <div class="form-group">
      <label class="form-label" for="email">Email</label>
      <input class="form-input" type="email" id="email" name="email"
             autocomplete="email" placeholder="you@example.com" required>
    </div>
    <div class="form-group">
      <label class="form-label" for="username">Username</label>
      <input class="form-input" type="text" id="username" name="username"
             autocomplete="username" placeholder="alex_chen" required>
    </div>
    <div class="form-group">
      <label class="form-label" for="password">Password</label>
      <input class="form-input" type="password" id="password" name="password"
             autocomplete="new-password" placeholder="At least 8 characters" required>
    </div>
    <button type="submit" class="btn btn-primary auth-submit">Create account</button>
  </form>
`;

const bindFormEvents = () => {
    document.querySelectorAll('.auth-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            activeForm = tab.dataset.form;
            renderPage();
        });
    });

    const form = document.getElementById('auth-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.auth-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Just a moment…';

        const data = Object.fromEntries(new FormData(form));

        try {
            if (activeForm === 'login') {
                await login({ email: data.email, password: data.password });
            } else {
                await register({
                    email: data.email,
                    username: data.username,
                    displayName: data.displayName,
                    password: data.password,
                });
            }

            navigate('/dashboard.html');
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = activeForm === 'login' ? 'Sign in' : 'Create account';

            const message = err instanceof HttpError ? err.message : 'Something went wrong. Please try again.';
            toast.error(message);
        }
    });
};

const addAuthStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-6);
      background: var(--color-bg);
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
    }
    .auth-brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--weight-bold);
      font-size: var(--text-xl);
      margin-bottom: var(--space-6);
    }
    .auth-brand-dot { color: var(--color-brand); }
    .auth-lilibet { margin-bottom: var(--space-6); }
    .auth-tabs {
      display: flex;
      gap: var(--space-1);
      margin-bottom: var(--space-6);
      background: var(--color-surface-2);
      padding: var(--space-1);
      border-radius: var(--radius-md);
    }
    .auth-tab {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      border-radius: calc(var(--radius-md) - 2px);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-text-secondary);
      transition: all var(--duration-fast) var(--ease-smooth);
    }
    .auth-tab--active {
      background: var(--color-surface);
      color: var(--color-text-primary);
      box-shadow: var(--shadow-sm);
    }
    .form-group { margin-bottom: var(--space-5); }
    .form-label {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-2);
    }
    .form-input {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface-2);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
      color: var(--color-text-primary);
      transition: border-color var(--duration-fast) var(--ease-smooth);
    }
    .form-input::placeholder { color: var(--color-text-muted); }
    .form-input:focus {
      outline: none;
      border-color: var(--color-brand);
      box-shadow: var(--shadow-glow);
    }
    .auth-submit {
      width: 100%;
      margin-top: var(--space-2);
      padding: var(--space-4);
    }
  `;
    document.head.appendChild(style);
};

addAuthStyles();
renderPage();