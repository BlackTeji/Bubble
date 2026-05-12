import { userStore } from '../../stores/userStore.js';
import { xpStore } from '../../stores/xpStore.js';
import { logout, navigate } from '../../services/authService.js';

const NAV_LINKS = [
    { label: 'Dashboard', href: '/dashboard.html', icon: 'home' },
    { label: 'Learn', href: '/lesson.html', icon: 'book' },
    { label: 'Profile', href: '/profile.html', icon: 'user' },
];

const getCurrentPage = () => window.location.pathname.split('/').pop() || 'index.html';

const renderXPBar = ({ percentage, level }) => `
  <div class="nav-xp">
    <span class="nav-xp-level">Lv ${level}</span>
    <div class="nav-xp-track" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="XP progress">
      <div class="nav-xp-fill" style="width: ${percentage}%"></div>
    </div>
  </div>
`;

const renderLinks = (currentPage) =>
    NAV_LINKS.map(({ label, href, icon }) => {
        const isActive = href.includes(currentPage);
        return `
      <a href="${href}" class="nav-link ${isActive ? 'nav-link--active' : ''}" aria-current="${isActive ? 'page' : 'false'}">
        <span class="nav-link-icon" aria-hidden="true">${getIcon(icon)}</span>
        <span class="nav-link-label">${label}</span>
      </a>
    `;
    }).join('');

const getIcon = (name) => {
    const icons = {
        home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
        user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    };
    return icons[name] ?? '';
};

const renderNav = ({ user, xp }) => `
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <div class="nav-inner">
      <a href="/dashboard.html" class="nav-brand" aria-label="Bubble home">
        <span class="nav-brand-dot" aria-hidden="true">●</span>
        <span class="nav-brand-name">Bubble</span>
      </a>

      <div class="nav-links" role="list">
        ${renderLinks(getCurrentPage())}
      </div>

      <div class="nav-right">
        ${xp ? renderXPBar(xp) : ''}
        <button class="nav-avatar btn-subtle" id="nav-user-btn" aria-label="User menu" aria-expanded="false">
          <span class="nav-avatar-initials" aria-hidden="true">
            ${(user?.display_name ?? user?.username ?? '?').charAt(0).toUpperCase()}
          </span>
        </button>
      </div>
    </div>
  </nav>

  <div class="nav-user-menu" id="nav-user-menu" role="menu" aria-hidden="true">
    <div class="nav-user-menu-header">
      <span class="font-medium">${user?.display_name ?? user?.username ?? ''}</span>
      <span class="text-muted text-sm">${user?.email ?? ''}</span>
    </div>
    <hr style="border-color: var(--color-border); margin: var(--space-2) 0;">
    <button class="nav-menu-item" role="menuitem" id="nav-logout-btn">Sign out</button>
  </div>
`;

export const mountNav = (container) => {
    if (!container) return;

    let currentUser = userStore.get().user;
    let currentXP = xpStore.get();

    const render = () => {
        container.innerHTML = renderNav({ user: currentUser, xp: currentXP });
        bindEvents(container);
    };

    // Single persistent Escape key handler — set up once, survives re-renders
    // because it reads from the DOM at call time rather than closing over stale refs
    const handleEscape = (e) => {
        if (e.key !== 'Escape') return;
        const menu = container.querySelector('#nav-user-menu');
        const btn = container.querySelector('#nav-user-btn');
        if (menu?.classList.contains('nav-user-menu--open')) {
            menu.setAttribute('aria-hidden', 'true');
            btn?.setAttribute('aria-expanded', 'false');
            menu.classList.remove('nav-user-menu--open');
        }
    };
    document.addEventListener('keydown', handleEscape);

    const bindEvents = (el) => {
        const userBtn = el.querySelector('#nav-user-btn');
        const menu = el.querySelector('#nav-user-menu');
        const logoutBtn = el.querySelector('#nav-logout-btn');

        userBtn?.addEventListener('click', () => {
            const isOpen = menu.getAttribute('aria-hidden') === 'false';
            menu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
            userBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
            menu.classList.toggle('nav-user-menu--open', !isOpen);
        });

        logoutBtn?.addEventListener('click', () => logout());
    };

    const unsubUser = userStore.subscribe(({ user }) => {
        currentUser = user;
        render();
    });

    const unsubXP = xpStore.subscribe((xp) => {
        currentXP = xp;
        render();
    });

    render();

    return () => {
        unsubUser();
        unsubXP();
        document.removeEventListener('keydown', handleEscape);
    };
};