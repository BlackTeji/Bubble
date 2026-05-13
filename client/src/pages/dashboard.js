import { requireAuth, getMe, navigate } from '../services/authService.js';
import { mountNav } from '../components/Nav/index.js';
import { mountMobileNav } from '../components/MobileNav/index.js';
import { mountToastSystem, toast } from '../components/Toast/index.js';
import { userStore } from '../stores/userStore.js';
import { xpStore } from '../stores/xpStore.js';
import { http } from '../services/http.js';
import { getMessage } from '../../shared/lilibet/index.js';
import { skeletonDashboard } from '../utils/skeletons.js';
import { renderDashboardError, ERROR_STATE_CSS } from '../utils/errorStates.js';

if (!requireAuth()) throw new Error('Redirecting');

mountToastSystem();
mountNav(document.getElementById('nav-root'));
mountMobileNav();

const root = document.getElementById('page-root');

const getGreetingEvent = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'dashboard_greeting_morning' : 'dashboard_greeting_returning';
};

const renderDashboard = ({ user, gamification, courses }) => {
    const greeting = getMessage(getGreetingEvent(), {});
    const xp = gamification?.xpProgress;
    const streak = gamification?.streak;
    const careerStage = gamification?.careerStage;

    root.innerHTML = `
    <div class="dashboard-page content-container">

      <section class="dashboard-hero animate-fade-in-up">
        <div class="lilibet-message">
          <div class="lilibet-avatar"><img src="/assets/icons/lilibet-avatar.svg" alt="Lilibet" width="52" height="52"></div>
          <div class="lilibet-body">
            <span class="lilibet-name">Lilibet</span>
            <p class="lilibet-text">${greeting}</p>
          </div>
        </div>

        <div class="dashboard-stats">
          <div class="stat-card card">
            <span class="stat-label">Career stage</span>
            <span class="stat-value">${careerStage?.slug ? formatStage(careerStage.slug) : 'Curious Beginner'}</span>
          </div>
          <div class="stat-card card">
            <span class="stat-label">Streak</span>
            <span class="stat-value">${streak?.current_streak ?? 0} <span class="text-accent">days</span></span>
          </div>
          <div class="stat-card card">
            <span class="stat-label">Total XP</span>
            <span class="stat-value">${gamification?.xp ?? 0} <span class="text-brand">XP</span></span>
          </div>
        </div>
      </section>

      <section class="dashboard-courses animate-fade-in-up" style="animation-delay: 100ms">
        <h2 class="dashboard-section-title">Your learning path</h2>
        ${courses?.length
            ? courses.map(renderCourseCard).join('')
            : `<p class="text-muted">No courses available yet.</p>`
        }
      </section>

    </div>
  `;
};

const formatStage = (slug) =>
    slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const renderCourseCard = (course) => `
  <a href="/lesson.html?course=${course.slug}" class="course-card card">
    <div class="course-card-header">
      <span class="badge badge-brand">${course.difficulty}</span>
    </div>
    <h3 class="course-card-title">${course.title}</h3>
    <p class="course-card-desc text-secondary">${course.description}</p>
    <span class="course-card-cta btn btn-ghost">Continue learning →</span>
  </a>
`;

const addDashboardStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .dashboard-page {
      padding: var(--space-8) var(--space-6);
      max-width: var(--layout-max);
    }
    .dashboard-hero { margin-bottom: var(--space-10); }
    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--space-4);
      margin-top: var(--space-6);
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-5);
    }
    .stat-label {
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: var(--text-2xl);
      font-weight: var(--weight-bold);
      color: var(--color-text-primary);
    }
    .dashboard-section-title {
      font-size: var(--text-xl);
      margin-bottom: var(--space-5);
    }
    .dashboard-courses {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .course-card {
      display: block;
      transition: all var(--duration-base) var(--ease-smooth);
    }
    .course-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .course-card-header { margin-bottom: var(--space-3); }
    .course-card-title {
      font-size: var(--text-lg);
      margin-bottom: var(--space-2);
    }
    .course-card-desc {
      font-size: var(--text-sm);
      margin-bottom: var(--space-4);
    }
    .course-card-cta {
      display: inline-flex;
      font-size: var(--text-sm);
    }
    ${ERROR_STATE_CSS}
  `;
    document.head.appendChild(style);
};

const loadDashboard = async () => {
    root.innerHTML = skeletonDashboard();

    try {
        const [user, gamResult, coursesResult] = await Promise.all([
            getMe(),
            http.get('/gamification/summary'),
            http.get('/courses'),
        ]);

        if (!user.onboarding_done) {
            navigate('/onboarding.html');
            return;
        }

        userStore.set({ user });
        xpStore.setFromXP(user.current_xp ?? 0);

        const gamification = gamResult.data;
        const courses = coursesResult.data.courses;

        renderDashboard({ user, gamification, courses });
    } catch (err) {
        root.innerHTML = renderDashboardError();
    }
};

addDashboardStyles();
loadDashboard();