import { requireAuth } from '../services/authService.js';
import { mountNav } from '../components/Nav/index.js';
import { mountToastSystem, toast } from '../components/Toast/index.js';
import { http } from '../services/http.js';
import { xpStore } from '../stores/xpStore.js';
import { renderProgressRing } from '../components/ProgressRing/index.js';
import { renderXPBar } from '../components/XPBar/index.js';

if (!requireAuth()) throw new Error('Redirecting');

mountToastSystem();
mountNav(document.getElementById('nav-root'));

const root = document.getElementById('page-root');

const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatStage = (slug) =>
    (slug ?? 'curious-beginner').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const renderProfile = ({ user, gamification }) => {
    const xp = gamification?.xpProgress;
    const streak = gamification?.streak;
    const badges = gamification?.badges ?? [];
    const careerStage = gamification?.careerStage;

    root.innerHTML = `
    <div class="profile-page content-container">

      <section class="profile-header card animate-fade-in-up">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar" aria-hidden="true">
            ${(user?.display_name ?? user?.username ?? '?').charAt(0).toUpperCase()}
          </div>
        </div>
        <div class="profile-identity">
          <h1 class="profile-name">${user?.display_name ?? user?.username}</h1>
          <p class="profile-stage badge badge-brand">${formatStage(careerStage?.slug)}</p>
          <p class="text-muted" style="font-size: var(--text-sm); margin-top: var(--space-1)">Member since ${formatDate(user?.created_at)}</p>
        </div>
      </section>

      <div class="profile-grid">

        <section class="profile-section card animate-fade-in-up" style="animation-delay: 100ms">
          <h2 class="profile-section-title">Progress</h2>
          ${xp ? renderXPBar(xp) : '<p class="text-muted">No XP yet.</p>'}
          <div class="profile-stats" style="margin-top: var(--space-6)">
            <div class="profile-stat">
              ${renderProgressRing({ percentage: Math.min(100, (streak?.current_streak ?? 0) * 10), size: 56, label: String(streak?.current_streak ?? 0) })}
              <span class="profile-stat-label">Day streak</span>
            </div>
            <div class="profile-stat">
              ${renderProgressRing({ percentage: xp?.percentage ?? 0, size: 56, label: String(xp?.level ?? 1) })}
              <span class="profile-stat-label">Level</span>
            </div>
            <div class="profile-stat">
              ${renderProgressRing({ percentage: Math.min(100, badges.length * 20), size: 56, color: 'var(--color-success)', label: String(badges.length) })}
              <span class="profile-stat-label">Badges</span>
            </div>
          </div>
        </section>

        <section class="profile-section card animate-fade-in-up" style="animation-delay: 200ms">
          <h2 class="profile-section-title">Badges</h2>
          ${badges.length > 0
            ? `<div class="badge-grid">${badges.map(renderBadge).join('')}</div>`
            : `<p class="text-muted text-sm">Complete lessons to earn your first badge.</p>`
        }
        </section>

      </div>
    </div>
  `;
};

const renderBadge = (badge) => `
  <div class="earned-badge" title="${badge.description}">
    <span class="earned-badge-icon" aria-hidden="true">⭐</span>
    <span class="earned-badge-title">${badge.title}</span>
    <span class="earned-badge-date text-muted">${formatDate(badge.earned_at)}</span>
  </div>
`;

const addProfileStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .profile-page { padding: var(--space-8) var(--space-6); max-width: 800px; }
    .profile-header { display: flex; gap: var(--space-6); align-items: center; margin-bottom: var(--space-6); }
    .profile-avatar {
      width: 72px; height: 72px; border-radius: var(--radius-full);
      background: var(--color-brand-light); color: var(--color-brand);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--text-3xl); font-weight: var(--weight-bold); flex-shrink: 0;
    }
    .profile-name  { font-size: var(--text-2xl); }
    .profile-stage { margin-top: var(--space-2); }
    .profile-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
    .profile-section { }
    .profile-section-title { font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-5); }
    .profile-stats { display: flex; gap: var(--space-6); justify-content: space-around; }
    .profile-stat  { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
    .profile-stat-label { font-size: var(--text-xs); color: var(--color-text-muted); }
    .badge-grid { display: flex; flex-direction: column; gap: var(--space-3); }
    .earned-badge { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--color-surface-2); border-radius: var(--radius-md); }
    .earned-badge-icon  { font-size: var(--text-xl); }
    .earned-badge-title { font-size: var(--text-sm); font-weight: var(--weight-medium); flex: 1; }
    .earned-badge-date  { font-size: var(--text-xs); }
    @media (max-width: 640px) {
      .profile-header { flex-direction: column; text-align: center; }
      .profile-grid   { grid-template-columns: 1fr; }
    }
  `;
    document.head.appendChild(style);
};

const loadProfile = async () => {
    addProfileStyles();
    root.innerHTML = `<div class="content-container" style="padding: var(--space-8)"><p class="text-muted">Loading…</p></div>`;

    try {
        const [meResult, gamResult] = await Promise.all([
            http.get('/auth/me'),
            http.get('/gamification/summary'),
        ]);

        const user = meResult.data.user;
        const gamification = gamResult.data;

        xpStore.setFromXP(user.current_xp ?? 0);
        renderProfile({ user, gamification });
    } catch (err) {
        toast.error('Could not load your profile.');
        console.error('[profile]', err);
    }
};

loadProfile();