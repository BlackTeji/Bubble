const NAV_ITEMS = [
    {
        label: 'Home',
        href: '/dashboard.html',
        match: 'dashboard',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    },
    {
        label: 'Learn',
        href: '/lesson.html',
        match: 'lesson',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    },
    {
        label: 'SQL',
        href: '/playground.html',
        match: 'playground',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    },
    {
        label: 'Profile',
        href: '/profile.html',
        match: 'profile',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    },
];

export const mountMobileNav = () => {
    if (window.matchMedia('(min-width: 769px)').matches) return;

    const current = window.location.pathname.split('/').pop().replace('.html', '');

    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');

    nav.innerHTML = NAV_ITEMS.map(({ label, href, match, icon }) => {
        const isActive = current === match || (current === '' && match === 'dashboard');
        return `
      <a href="${href}"
         class="mobile-nav-link ${isActive ? 'mobile-nav-link--active' : ''}"
         aria-current="${isActive ? 'page' : 'false'}"
         aria-label="${label}">
        ${icon}
        <span>${label}</span>
      </a>
    `;
    }).join('');

    document.body.appendChild(nav);
};