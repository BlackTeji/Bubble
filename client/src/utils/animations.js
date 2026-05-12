const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const fadeIn = (el, durationMs = 250) => {
    if (prefersReducedMotion()) { el.style.opacity = '1'; return; }
    el.style.opacity = '0';
    el.style.transition = `opacity ${durationMs}ms ease`;
    requestAnimationFrame(() => { el.style.opacity = '1'; });
};

export const fadeOut = (el, durationMs = 200) =>
    new Promise((resolve) => {
        if (prefersReducedMotion()) { el.style.opacity = '0'; resolve(); return; }
        el.style.transition = `opacity ${durationMs}ms ease`;
        el.style.opacity = '0';
        setTimeout(resolve, durationMs);
    });

export const slideUp = (el, durationMs = 300) => {
    if (prefersReducedMotion()) { el.style.opacity = '1'; return; }
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = `opacity ${durationMs}ms ease, transform ${durationMs}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });
};

export const floatXP = (amount, anchorEl) => {
    if (prefersReducedMotion()) return;

    const rect = anchorEl?.getBoundingClientRect() ?? { top: 100, left: 100 };
    const el = document.createElement('div');

    el.textContent = `+${amount} XP`;
    el.style.cssText = `
    position: fixed;
    top: ${rect.top - 10}px;
    left: ${rect.left}px;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-brand);
    pointer-events: none;
    z-index: var(--z-toast);
    animation: xpFloat 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  `;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
};

export const pulseElement = (el, durationMs = 400) => {
    if (prefersReducedMotion()) return;
    el.style.transition = `transform ${durationMs}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    el.style.transform = 'scale(1.06)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, durationMs);
};