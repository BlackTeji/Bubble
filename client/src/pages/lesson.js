import { requireAuth } from '../services/authService.js';
import { mountNav } from '../components/Nav/index.js';
import { mountMobileNav } from '../components/MobileNav/index.js';
import { mountToastSystem, toast } from '../components/Toast/index.js';
import { mountLessonEngine } from '../components/LessonEngine/index.js';
import { userStore } from '../stores/userStore.js';
import { xpStore } from '../stores/xpStore.js';
import { lessonStore } from '../stores/lessonStore.js';
import { http } from '../services/http.js';
import { renderLessonCard } from '../components/LessonCard/index.js';
import { progressStore } from '../stores/progressStore.js';
import { skeletonLesson } from '../utils/skeletons.js';
import { renderLessonError, ERROR_STATE_CSS } from '../utils/errorStates.js';

if (!requireAuth()) throw new Error('Redirecting');

mountToastSystem();
mountNav(document.getElementById('nav-root'));
mountMobileNav();

const root = document.getElementById('page-root');
const params = new URLSearchParams(window.location.search);
const lessonId = params.get('id');
const courseSlug = params.get('course') ?? 'data-analytics';

const addLessonStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .lesson-page { display: flex; min-height: calc(100vh - var(--nav-height)); }

    .lesson-sidebar {
      width: 280px; flex-shrink: 0;
      border-right: 1px solid var(--color-border);
      padding: var(--space-6) var(--space-4);
      overflow-y: auto;
      position: sticky; top: var(--nav-height);
      height: calc(100vh - var(--nav-height));
    }

    .lesson-sidebar-title {
      font-size: var(--text-xs); font-weight: var(--weight-semibold);
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-text-muted); margin-bottom: var(--space-4);
    }

    .lesson-main {
      flex: 1; padding: var(--space-8) var(--space-6);
      max-width: 740px; margin: 0 auto;
    }

    .lesson-header { margin-bottom: var(--space-8); }
    .lesson-header-meta { display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-3); }
    .lesson-type-badge { font-size: var(--text-xs); }
    .lesson-title { font-size: var(--text-3xl); letter-spacing: -0.02em; }

    .lesson-intro { margin-bottom: var(--space-8); }
    .lesson-intro-text { font-size: var(--text-lg); color: var(--color-text-secondary); line-height: var(--leading-relaxed); margin-top: var(--space-4); }

    .lesson-block { margin-bottom: var(--space-7); }
    .lesson-text { font-size: var(--text-base); line-height: var(--leading-relaxed); color: var(--color-text-primary); }
    .lesson-divider { border: none; border-top: 1px solid var(--color-border); margin: var(--space-6) 0; }

    .callout {
      padding: var(--space-4) var(--space-5); border-radius: var(--radius-lg);
      border-left: 3px solid; margin: var(--space-2) 0;
    }
    .callout--tip     { background: var(--color-brand-light);   border-color: var(--color-brand); }
    .callout--insight { background: var(--color-success-light); border-color: var(--color-success); }
    .callout--warning { background: var(--color-warning-light); border-color: var(--color-warning); }
    .callout-label { display: block; font-size: var(--text-xs); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); color: var(--color-text-muted); }
    .callout-text  { font-size: var(--text-sm); line-height: var(--leading-relaxed); }

    .code-block { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
    .code-block-label { display: block; padding: var(--space-3) var(--space-4); font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
    .code-block-pre  { margin: 0; padding: var(--space-5); overflow-x: auto; }
    .code-block-code { font-size: var(--text-sm); line-height: 1.7; color: var(--color-text-primary); }

    .lesson-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .lesson-list-item { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-3) var(--space-4); background: var(--color-surface-2); border-radius: var(--radius-md); }
    .lesson-list-label  { font-weight: var(--weight-semibold); font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-brand); }
    .lesson-list-detail { font-size: var(--text-sm); }

    .lesson-table-wrap { overflow-x: auto; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
    .lesson-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
    .lesson-table th { background: var(--color-surface-2); font-weight: var(--weight-semibold); padding: var(--space-3) var(--space-4); text-align: left; border-bottom: 1px solid var(--color-border); }
    .lesson-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
    .lesson-table tr:last-child td { border-bottom: none; }
    .lesson-table-caption { padding: var(--space-3) var(--space-4); font-size: var(--text-xs); color: var(--color-text-muted); caption-side: bottom; }

    .comparison-block { display: grid; grid-template-columns: 1fr auto 1fr; gap: var(--space-4); align-items: start; }
    .comparison-side { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-5); }
    .comparison-label { font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-2); }
    .comparison-desc  { font-size: var(--text-sm); margin-bottom: var(--space-3); }
    .comparison-examples { display: flex; flex-direction: column; gap: var(--space-2); }
    .comparison-example { font-size: var(--text-xs); font-family: var(--font-mono); color: var(--color-brand); background: var(--color-brand-light); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); }
    .comparison-vs { font-size: var(--text-xs); font-weight: var(--weight-bold); color: var(--color-text-muted); align-self: center; }

    .quiz-block { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-6); }
    .quiz-question { font-size: var(--text-base); font-weight: var(--weight-medium); line-height: var(--leading-snug); margin-bottom: var(--space-5); }
    .quiz-options { display: flex; flex-direction: column; gap: var(--space-3); }
    .quiz-option {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4); border-radius: var(--radius-lg);
      border: 1.5px solid var(--color-border); text-align: left;
      transition: all var(--duration-fast) var(--ease-smooth); cursor: pointer;
      background: var(--color-surface);
    }
    .quiz-option:hover:not(:disabled) { border-color: var(--color-brand); background: var(--color-brand-light); }
    .quiz-option:disabled { cursor: default; }
    .quiz-option--correct { border-color: var(--color-success) !important; background: var(--color-success-light) !important; }
    .quiz-option--wrong   { border-color: var(--color-accent)   !important; background: var(--color-accent-light)   !important; }
    .quiz-option-marker { width: 28px; height: 28px; border-radius: var(--radius-full); background: var(--color-surface-2); display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: var(--weight-bold); flex-shrink: 0; }
    .quiz-option-text { font-size: var(--text-sm); line-height: var(--leading-snug); }
    .quiz-feedback { margin-top: var(--space-4); font-size: var(--text-sm); font-weight: var(--weight-medium); }
    .quiz-explanation { margin-top: var(--space-3); font-size: var(--text-sm); color: var(--color-text-secondary); line-height: var(--leading-relaxed); padding: var(--space-3) var(--space-4); background: var(--color-surface-2); border-radius: var(--radius-md); }

    .fill-block { background: var(--color-surface-2); border-radius: var(--radius-xl); padding: var(--space-6); }
    .fill-instruction { font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4); }
    .fill-template { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-5); white-space: pre-wrap; font-family: var(--font-mono); font-size: var(--text-sm); line-height: 1.8; }
    .fill-input {
      display: inline-block; width: 120px; border: none; border-bottom: 2px solid var(--color-brand);
      background: transparent; font-family: var(--font-mono); font-size: var(--text-sm);
      color: var(--color-brand); padding: 0 var(--space-1); outline: none; text-align: center;
      transition: border-color var(--duration-fast);
    }
    .fill-input--correct { border-color: var(--color-success); color: var(--color-success); }
    .fill-input--wrong   { border-color: var(--color-accent);  color: var(--color-accent);  }
    .fill-hint   { font-size: var(--text-xs); margin-top: var(--space-3); }
    .fill-submit { margin-top: var(--space-5); }
    .fill-feedback { margin-top: var(--space-3); font-size: var(--text-sm); font-weight: var(--weight-medium); }

    .feedback--correct { color: var(--color-success); }
    .feedback--wrong   { color: var(--color-accent); }

    .lesson-actions { margin-top: var(--space-10); padding-top: var(--space-8); border-top: 1px solid var(--color-border); }
    .lesson-lilibet-feedback { margin-bottom: var(--space-6); min-height: 0; }
    .lesson-complete-btn { width: 100%; padding: var(--space-4); font-size: var(--text-base); }
    .lesson-complete-btn:disabled { opacity: 0.4; }

    .lesson-card {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
      transition: all var(--duration-fast) var(--ease-smooth); color: var(--color-text-primary);
      margin-bottom: var(--space-2);
    }
    .lesson-card:hover { background: var(--color-surface-2); }
    .lesson-card--completed .lesson-card-title { color: var(--color-text-muted); }
    .lesson-card--in-progress { background: var(--color-brand-light); }
    .lesson-card-icon  { font-size: var(--text-lg); flex-shrink: 0; }
    .lesson-card-body  { flex: 1; min-width: 0; }
    .lesson-card-title { display: block; font-size: var(--text-sm); font-weight: var(--weight-medium); }
    .lesson-card-meta  { display: block; font-size: var(--text-xs); margin-top: var(--space-1); }
    .lesson-card-status { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); white-space: nowrap; }
    .lesson-card-status--done { color: var(--color-success); }

    .xp-bar-wrap { display: flex; flex-direction: column; gap: var(--space-2); }
    .xp-bar-meta { display: flex; justify-content: space-between; font-size: var(--text-xs); }
    .xp-bar-level { font-weight: var(--weight-semibold); color: var(--color-brand); }
    .xp-bar-track { height: 8px; background: var(--color-surface-3); border-radius: var(--radius-full); overflow: hidden; }
    .xp-bar-fill  { height: 100%; background: var(--color-brand); border-radius: var(--radius-full); transition: width var(--duration-slow) var(--ease-spring); }

    @media (max-width: 768px) {
      .lesson-page { flex-direction: column; }
      .lesson-sidebar { display: none; }
      .comparison-block { grid-template-columns: 1fr; }
      .comparison-vs { display: none; }
    }
    ${ERROR_STATE_CSS}
  `;
    document.head.appendChild(style);
};

const loadLesson = async () => {
    addLessonStyles();

    if (!lessonId) {
        root.innerHTML = await renderCourseLessonList(courseSlug);
        return;
    }

    root.innerHTML = skeletonLesson();

    try {
        const [lessonResult, progressResult, gamResult] = await Promise.all([
            http.get(`/lessons/${lessonId}`),
            http.get('/progress'),
            http.get('/gamification/summary'),
        ]);

        const lesson = lessonResult.data.lesson;
        progressStore.setAll(progressResult.data.progress);
        xpStore.setFromXP(gamResult.data.xp ?? 0);

        lessonStore.setLesson(lesson);

        root.innerHTML = `
      <div class="lesson-page">
        <aside class="lesson-sidebar" aria-label="Lesson navigation">
          <p class="lesson-sidebar-title">Foundations</p>
          <div id="sidebar-lessons">Loading lessons…</div>
          <div class="xp-bar-wrap" style="margin-top: var(--space-6)" id="sidebar-xpbar"></div>
        </aside>

        <div class="lesson-main">
          <header class="lesson-header">
            <div class="lesson-header-meta">
              <span class="badge badge-brand lesson-type-badge">${lesson.type}</span>
              <span class="text-muted" style="font-size: var(--text-xs)">${lesson.estimated_mins} min · +${lesson.xp_reward} XP</span>
            </div>
            <h1 class="lesson-title">${lesson.title}</h1>
          </header>

          <div id="lesson-engine-root"></div>
        </div>
      </div>
    `;

        mountLessonEngine(document.getElementById('lesson-engine-root'), lesson);

        const { mountXPBar } = await import('../components/XPBar/index.js');
        mountXPBar(document.getElementById('sidebar-xpbar'));

        loadSidebarLessons(lesson.path_id);
    } catch (err) {
        root.innerHTML = renderLessonError();
    }
};

const loadSidebarLessons = async (pathId) => {
    const sidebar = document.getElementById('sidebar-lessons');
    if (!sidebar || !pathId) return;

    try {
        const result = await http.get(`/lessons?pathId=${pathId}`);
        const lessons = result.data?.lessons ?? [];
        sidebar.innerHTML = lessons.map(renderLessonCard).join('') || '<p class="text-muted" style="font-size:var(--text-xs)">No lessons found.</p>';
    } catch {
        sidebar.innerHTML = '';
    }
};

const renderCourseLessonList = async (slug) => {
    try {
        const courseResult = await http.get(`/courses/${slug}`);
        const course = courseResult.data.course;
        const paths = course.paths ?? [];

        const pathsWithLessons = await Promise.all(
            paths.map(async (path) => {
                try {
                    const r = await http.get(`/lessons?pathId=${path.id}`);
                    return { ...path, lessons: r.data?.lessons ?? [] };
                } catch {
                    return { ...path, lessons: [] };
                }
            })
        );

        return `
            <div class="content-container" style="padding: var(--space-8) var(--space-6); max-width: 740px; margin: 0 auto;">
                <h1 style="margin-bottom: var(--space-8)">${course.title}</h1>
                ${pathsWithLessons.map((path) => `
                    <section style="margin-bottom: var(--space-10)">
                        <h2 style="font-size: var(--text-lg); margin-bottom: var(--space-4); color: var(--color-text-secondary)">${path.title}</h2>
                        <div>
                            ${path.lessons.length
                ? path.lessons.map((lesson) => `
                                    <a href="/lesson.html?id=${lesson.id}&course=${slug}"
                                       class="lesson-card ${lesson.status === 'completed' ? 'lesson-card--completed' : ''}">
                                        <span class="lesson-card-icon">${lesson.status === 'completed' ? '✓' : '○'}</span>
                                        <span class="lesson-card-body">
                                            <span class="lesson-card-title">${lesson.title}</span>
                                            <span class="lesson-card-meta text-muted">${lesson.estimated_mins ?? 5} min · +${lesson.xp_reward ?? 10} XP</span>
                                        </span>
                                    </a>
                                `).join('')
                : '<p class="text-muted" style="font-size: var(--text-sm)">No lessons yet.</p>'
            }
                        </div>
                    </section>
                `).join('')}
            </div>
        `;
    } catch {
        return `<p class="text-muted" style="padding: var(--space-8)">Course not found.</p>`;
    }
};

loadLesson();