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
import { navigateTo } from '../utils/transitions.js';

if (!requireAuth()) throw new Error('Redirecting');

mountToastSystem();
mountNav(document.getElementById('nav-root'));
mountMobileNav();

const root = document.getElementById('page-root');
const params = new URLSearchParams(window.location.search);
const lessonId = params.get('id');
const courseSlug = params.get('course') ?? 'data-analytics';

const lessonUrl = (id) => `/lesson.html?id=${id}&course=${courseSlug}`;

// ─── Styles ───────────────────────────────────────────────────────────────────
// Mobile-first: every base rule works at 320px.
// min-width queries add layout complexity for wider screens.

const addLessonStyles = () => {
    const style = document.createElement('style');
    style.textContent = `

    /* ── Page layout ──────────────────────────────────────────────────────── */

    .lesson-page {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - var(--nav-height));
    }

    /* Sidebar is hidden at base — responsive.css reveals it at 1024px */
    .lesson-sidebar {
      width: 280px;
      flex-shrink: 0;
      border-right: 1px solid var(--color-border);
      padding: var(--space-6) var(--space-4);
      overflow-y: auto;
      position: sticky;
      top: var(--nav-height);
      height: calc(100vh - var(--nav-height));
      display: none;
    }

    @media (min-width: 1024px) {
      .lesson-page    { flex-direction: row; }
      .lesson-sidebar { display: block; }
    }

    .lesson-sidebar-title {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted);
      margin-bottom: var(--space-4);
    }

    .lesson-main {
      flex: 1;
      padding: var(--space-5) var(--space-4);
      width: 100%;
    }

    @media (min-width: 640px) {
      .lesson-main { padding: var(--space-8) var(--space-6); }
    }

    @media (min-width: 1024px) {
      .lesson-main { max-width: 740px; margin: 0 auto; }
    }


    /* ── Header ───────────────────────────────────────────────────────────── */

    .lesson-header { margin-bottom: var(--space-6); }

    @media (min-width: 640px) {
      .lesson-header { margin-bottom: var(--space-8); }
    }

    .lesson-header-meta {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      margin-bottom: var(--space-3);
      flex-wrap: wrap;
    }

    .lesson-type-badge { font-size: var(--text-xs); }

    .lesson-title {
      font-size: var(--text-2xl);
      letter-spacing: -0.02em;
    }

    @media (min-width: 640px) {
      .lesson-title { font-size: var(--text-3xl); }
    }


    /* ── Progress indicator ───────────────────────────────────────────────── */

    .lesson-progress-bar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
      padding-bottom: var(--space-5);
      border-bottom: 1px solid var(--color-border);
    }

    @media (min-width: 640px) {
      .lesson-progress-bar { margin-bottom: var(--space-6); padding-bottom: var(--space-6); }
    }

    .lesson-progress-track {
      flex: 1;
      height: 4px;
      background: var(--color-surface-3);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .lesson-progress-fill {
      height: 100%;
      background: var(--color-brand);
      border-radius: var(--radius-full);
      transition: width var(--duration-slow) var(--ease-spring);
    }

    .lesson-progress-label {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }


    /* ── Lesson content blocks ────────────────────────────────────────────── */

    .lesson-intro { margin-bottom: var(--space-6); }

    @media (min-width: 640px) {
      .lesson-intro { margin-bottom: var(--space-8); }
    }

    .lesson-intro-text {
      font-size: var(--text-base);
      color: var(--color-text-secondary);
      line-height: var(--leading-relaxed);
      margin-top: var(--space-4);
    }

    @media (min-width: 640px) {
      .lesson-intro-text { font-size: var(--text-lg); }
    }

    .lesson-block { margin-bottom: var(--space-6); }

    @media (min-width: 640px) {
      .lesson-block { margin-bottom: var(--space-7); }
    }

    .lesson-text {
      font-size: var(--text-base);
      line-height: var(--leading-relaxed);
      color: var(--color-text-primary);
    }

    .lesson-divider {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: var(--space-6) 0;
    }


    /* ── Callouts ─────────────────────────────────────────────────────────── */

    .callout {
      padding: var(--space-4) var(--space-4);
      border-radius: var(--radius-lg);
      border-left: 3px solid;
      margin: var(--space-2) 0;
    }

    @media (min-width: 640px) {
      .callout { padding: var(--space-4) var(--space-5); }
    }

    .callout--tip     { background: var(--color-brand-light);   border-color: var(--color-brand); }
    .callout--insight { background: var(--color-success-light); border-color: var(--color-success); }
    .callout--warning { background: var(--color-warning-light); border-color: var(--color-warning); }

    .callout-label {
      display: block;
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-1);
      color: var(--color-text-muted);
    }

    .callout-text { font-size: var(--text-sm); line-height: var(--leading-relaxed); }


    /* ── Code blocks ──────────────────────────────────────────────────────── */

    .code-block {
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .code-block-label {
      display: block;
      padding: var(--space-3) var(--space-4);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
    }

    .code-block-pre { margin: 0; padding: var(--space-4); overflow-x: auto; }

    @media (min-width: 640px) {
      .code-block-pre { padding: var(--space-5); }
    }

    .code-block-code { font-size: var(--text-sm); line-height: 1.7; color: var(--color-text-primary); }


    /* ── Lists ────────────────────────────────────────────────────────────── */

    .lesson-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .lesson-list-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface-2);
      border-radius: var(--radius-md);
    }

    .lesson-list-label  { font-weight: var(--weight-semibold); font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-brand); }
    .lesson-list-detail { font-size: var(--text-sm); }


    /* ── Tables ───────────────────────────────────────────────────────────── */

    .lesson-table-wrap {
      overflow-x: auto;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      -webkit-overflow-scrolling: touch;
    }

    .lesson-table        { width: 100%; border-collapse: collapse; font-size: var(--text-xs); }
    .lesson-table th     { background: var(--color-surface-2); font-weight: var(--weight-semibold); padding: var(--space-3) var(--space-3); text-align: left; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
    .lesson-table td     { padding: var(--space-3) var(--space-3); border-bottom: 1px solid var(--color-border); }
    .lesson-table tr:last-child td { border-bottom: none; }
    .lesson-table-caption { padding: var(--space-2) var(--space-3); font-size: var(--text-xs); color: var(--color-text-muted); caption-side: bottom; }

    @media (min-width: 640px) {
      .lesson-table     { font-size: var(--text-sm); }
      .lesson-table th  { padding: var(--space-3) var(--space-4); }
      .lesson-table td  { padding: var(--space-3) var(--space-4); }
    }


    /* ── Comparison ───────────────────────────────────────────────────────── */

    /* Base: stacked vertically on phones — responsive.css handles the grid */
    .comparison-block { display: grid; grid-template-columns: 1fr; gap: var(--space-4); align-items: start; }
    .comparison-vs    { display: none; }

    @media (min-width: 640px) {
      .comparison-block { grid-template-columns: 1fr auto 1fr; }
      .comparison-vs    { display: block; font-size: var(--text-xs); font-weight: var(--weight-bold); color: var(--color-text-muted); align-self: center; }
    }

    .comparison-side {
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    @media (min-width: 640px) {
      .comparison-side { padding: var(--space-5); }
    }

    .comparison-label  { font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-2); }
    .comparison-desc   { font-size: var(--text-sm); margin-bottom: var(--space-3); }
    .comparison-examples { display: flex; flex-direction: column; gap: var(--space-2); }
    .comparison-example  { font-size: var(--text-xs); font-family: var(--font-mono); color: var(--color-brand); background: var(--color-brand-light); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); }


    /* ── Quiz ─────────────────────────────────────────────────────────────── */

    .quiz-block {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
    }

    @media (min-width: 640px) {
      .quiz-block { padding: var(--space-6); }
    }

    .quiz-question {
      font-size: var(--text-base);
      font-weight: var(--weight-medium);
      line-height: var(--leading-snug);
      margin-bottom: var(--space-5);
    }

    .quiz-options { display: flex; flex-direction: column; gap: var(--space-3); }

    .quiz-option {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      border: 1.5px solid var(--color-border);
      text-align: left;
      transition: all var(--duration-fast) var(--ease-smooth);
      cursor: pointer;
      background: var(--color-surface);
      min-height: 44px;
      width: 100%;
    }

    @media (min-width: 640px) {
      .quiz-option { padding: var(--space-4); }
    }

    .quiz-option:hover:not(:disabled) { border-color: var(--color-brand); background: var(--color-brand-light); }
    .quiz-option:disabled              { cursor: default; }
    .quiz-option--correct { border-color: var(--color-success) !important; background: var(--color-success-light) !important; }
    .quiz-option--wrong   { border-color: var(--color-accent)  !important; background: var(--color-accent-light)  !important; }

    .quiz-option-marker {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border-radius: var(--radius-full);
      background: var(--color-surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      font-weight: var(--weight-bold);
      flex-shrink: 0;
    }

    .quiz-option-text { font-size: var(--text-sm); line-height: var(--leading-snug); }
    .quiz-feedback    { margin-top: var(--space-4); font-size: var(--text-sm); font-weight: var(--weight-medium); }

    .quiz-explanation {
      margin-top: var(--space-3);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      line-height: var(--leading-relaxed);
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface-2);
      border-radius: var(--radius-md);
    }


    /* ── Fill in the blanks ───────────────────────────────────────────────── */

    .fill-block {
      background: var(--color-surface-2);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
    }

    @media (min-width: 640px) {
      .fill-block { padding: var(--space-6); }
    }

    .fill-instruction { font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4); }

    .fill-template {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      white-space: pre-wrap;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      line-height: 1.8;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    @media (min-width: 640px) {
      .fill-template { padding: var(--space-5); font-size: var(--text-sm); }
    }

    .fill-input {
      display: inline-block;
      width: 90px;
      border: none;
      border-bottom: 2px solid var(--color-brand);
      background: transparent;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-brand);
      padding: 0 var(--space-1);
      outline: none;
      text-align: center;
      transition: border-color var(--duration-fast);
      /* Prevent mobile zoom on focus — keep font at 16px equivalent */
      font-size: max(16px, var(--text-xs));
    }

    @media (min-width: 640px) {
      .fill-input { width: 120px; font-size: var(--text-sm); }
    }

    .fill-input--correct { border-color: var(--color-success); color: var(--color-success); }
    .fill-input--wrong   { border-color: var(--color-accent);  color: var(--color-accent);  }
    .fill-hint     { font-size: var(--text-xs); margin-top: var(--space-3); }
    .fill-submit   { margin-top: var(--space-5); }
    .fill-feedback { margin-top: var(--space-3); font-size: var(--text-sm); font-weight: var(--weight-medium); }

    .feedback--correct { color: var(--color-success); }
    .feedback--wrong   { color: var(--color-accent); }


    /* ── Actions (complete button, nav) ───────────────────────────────────── */

    .lesson-actions {
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    @media (min-width: 640px) {
      .lesson-actions { margin-top: var(--space-10); padding-top: var(--space-8); }
    }

    .lesson-lilibet-feedback { margin-bottom: var(--space-5); min-height: 0; }

    .lesson-complete-btn {
      width: 100%;
      padding: var(--space-4);
      font-size: var(--text-base);
      margin-bottom: var(--space-4);
    }

    .lesson-complete-btn:disabled { opacity: 0.4; }


    /* ── Prev / next navigation ───────────────────────────────────────────── */
    /* Base: stacked vertically on phones — easier to tap, avoids cramped layout */

    .lesson-nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    @media (min-width: 640px) {
      .lesson-nav { flex-direction: row; }
    }

    .lesson-nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: var(--space-4) var(--space-5);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-lg);
      transition: all var(--duration-fast) var(--ease-smooth);
      text-align: left;
      color: var(--color-text-primary);
      background: var(--color-surface);
      min-height: 64px; /* generously tappable */
      width: 100%;
    }

    .lesson-nav-btn:hover:not(:disabled) {
      border-color: var(--color-brand);
      background: var(--color-brand-light);
    }

    .lesson-nav-btn:disabled { opacity: 0.35; cursor: default; }

    /* Next button: left-aligned on mobile (stacked), right-aligned on desktop (side by side) */
    .lesson-nav-btn--next { text-align: left; }

    @media (min-width: 640px) {
      .lesson-nav-btn--next { text-align: right; }
    }

    .lesson-nav-direction {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      font-weight: var(--weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-1);
    }

    .lesson-nav-title {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      line-height: var(--leading-snug);
    }

    .lesson-nav-path {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: 2px;
    }


    /* ── Next-lesson prompt (appears after completion) ────────────────────── */

    .lesson-next-prompt {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      background: var(--color-success-light);
      border: 1.5px solid var(--color-success);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
      animation: fadeInUp var(--duration-slow) var(--ease-spring) both;
    }

    @media (min-width: 640px) {
      .lesson-next-prompt {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .lesson-next-prompt-text {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-success-dark);
    }

    .lesson-next-prompt-btn {
      flex-shrink: 0;
      font-size: var(--text-sm);
      padding: var(--space-3) var(--space-5);
      background: var(--color-success);
      color: #fff;
      border-radius: var(--radius-full);
      font-weight: var(--weight-semibold);
      transition: all var(--duration-fast) var(--ease-smooth);
      text-align: center;
      min-height: 44px;
      width: 100%;
    }

    @media (min-width: 640px) {
      .lesson-next-prompt-btn { width: auto; margin-left: var(--space-4); }
    }

    .lesson-next-prompt-btn:hover { background: var(--color-success-dark); }


    /* ── Sidebar lesson cards ─────────────────────────────────────────────── */

    .lesson-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      transition: all var(--duration-fast) var(--ease-smooth);
      color: var(--color-text-primary);
      margin-bottom: var(--space-2);
      min-height: 44px;
    }

    .lesson-card:hover                      { background: var(--color-surface-2); }
    .lesson-card--completed .lesson-card-title { color: var(--color-text-muted); }
    .lesson-card--in-progress               { background: var(--color-brand-light); }

    .lesson-card-icon   { font-size: var(--text-lg); flex-shrink: 0; }
    .lesson-card-body   { flex: 1; min-width: 0; }
    .lesson-card-title  { display: block; font-size: var(--text-sm); font-weight: var(--weight-medium); }
    .lesson-card-meta   { display: block; font-size: var(--text-xs); margin-top: var(--space-1); }
    .lesson-card-status { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); white-space: nowrap; }
    .lesson-card-status--done { color: var(--color-success); }


    /* ── XP bar (sidebar) ─────────────────────────────────────────────────── */

    .xp-bar-wrap { display: flex; flex-direction: column; gap: var(--space-2); }
    .xp-bar-meta { display: flex; justify-content: space-between; font-size: var(--text-xs); }
    .xp-bar-level { font-weight: var(--weight-semibold); color: var(--color-brand); }
    .xp-bar-track { height: 8px; background: var(--color-surface-3); border-radius: var(--radius-full); overflow: hidden; }
    .xp-bar-fill  { height: 100%; background: var(--color-brand); border-radius: var(--radius-full); transition: width var(--duration-slow) var(--ease-spring); }


    ${ERROR_STATE_CSS}
  `;
    document.head.appendChild(style);
};

// ─── Navigation rendering ─────────────────────────────────────────────────────

const renderLessonNav = (nav, nextEnabled) => {
    const { prev, next } = nav;

    const prevBtn = prev
        ? `<button class="lesson-nav-btn" id="nav-prev-btn" type="button"
               aria-label="Previous lesson: ${prev.title}">
         <span class="lesson-nav-direction">← Previous</span>
         <span class="lesson-nav-title">${prev.title}</span>
         ${prev.pathTitle ? `<span class="lesson-nav-path">${prev.pathTitle}</span>` : ''}
       </button>`
        : `<button class="lesson-nav-btn" disabled type="button" aria-label="No previous lesson">
         <span class="lesson-nav-direction">← Previous</span>
         <span class="lesson-nav-title text-muted">First lesson</span>
       </button>`;

    const nextBtn = next
        ? `<button class="lesson-nav-btn lesson-nav-btn--next" id="nav-next-btn" type="button"
               ${!nextEnabled ? 'disabled' : ''}
               aria-label="Next lesson: ${next.title}"
               aria-disabled="${!nextEnabled}">
         <span class="lesson-nav-direction">Next →</span>
         <span class="lesson-nav-title">${next.title}</span>
         ${next.pathTitle ? `<span class="lesson-nav-path">${next.pathTitle}</span>` : ''}
       </button>`
        : `<button class="lesson-nav-btn lesson-nav-btn--next" disabled type="button"
               aria-label="You have reached the last lesson">
         <span class="lesson-nav-direction">Next →</span>
         <span class="lesson-nav-title text-muted">Last lesson</span>
       </button>`;

    return `<nav class="lesson-nav" aria-label="Lesson navigation">${prevBtn}${nextBtn}</nav>`;
};

const bindNavButtons = (container, nav) => {
    container.querySelector('#nav-prev-btn')?.addEventListener('click', () => {
        navigateTo(lessonUrl(nav.prev.id));
    });
    container.querySelector('#nav-next-btn')?.addEventListener('click', () => {
        navigateTo(lessonUrl(nav.next.id));
    });
};

// Called by the lesson engine after the learner marks a lesson complete.
const onLessonCompleted = (actionsEl, nav) => {
    if (!actionsEl || !nav) return;

    // Unlock the Next button
    const nextBtn = actionsEl.querySelector('#nav-next-btn');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.setAttribute('aria-disabled', 'false');
    }

    // Show the continue prompt above the nav
    if (nav.next && !actionsEl.querySelector('.lesson-next-prompt')) {
        const prompt = document.createElement('div');
        prompt.className = 'lesson-next-prompt';
        prompt.innerHTML = `
      <span class="lesson-next-prompt-text">Up next: ${nav.next.title}</span>
      <button class="lesson-next-prompt-btn" type="button" id="nav-next-prompt-btn">
        Continue →
      </button>
    `;
        actionsEl.querySelector('.lesson-nav')?.before(prompt);
        prompt.querySelector('#nav-next-prompt-btn')?.addEventListener('click', () => {
            navigateTo(lessonUrl(nav.next.id));
        });
    }
};

// ─── Page loader ──────────────────────────────────────────────────────────────

const loadLesson = async () => {
    addLessonStyles();

    if (!lessonId) {
        root.innerHTML = skeletonLesson();
        root.innerHTML = await renderCourseLessonList(courseSlug);
        return;
    }

    root.innerHTML = skeletonLesson();

    try {
        // Lesson is critical. Navigation, progress, XP are non-critical.
        const [lessonResult, progressResult, gamResult, navResult] = await Promise.allSettled([
            http.get(`/lessons/${lessonId}`),
            http.get('/progress'),
            http.get('/gamification/summary'),
            http.get(`/lessons/${lessonId}/navigation`),
        ]);

        if (lessonResult.status === 'rejected') throw lessonResult.reason;

        const lesson = lessonResult.value.data.lesson;
        const nav = navResult.status === 'fulfilled' ? navResult.value.data : null;
        const pos = nav?.position ?? null;

        if (progressResult.status === 'fulfilled') {
            progressStore.setAll(progressResult.value.data.progress);
        }
        if (gamResult.status === 'fulfilled') {
            xpStore.setFromXP(gamResult.value.data.xp ?? 0);
        }

        lessonStore.setLesson(lesson);

        const alreadyCompleted = ['completed', 'mastered'].includes(
            progressStore.getLesson(lesson.id).status
        );

        root.innerHTML = `
      <div class="lesson-page">
        <aside class="lesson-sidebar" aria-label="Lesson navigation">
          <p class="lesson-sidebar-title">${lesson.path_title ?? 'Lessons'}</p>
          <div id="sidebar-lessons">Loading…</div>
          <div id="sidebar-xpbar" class="xp-bar-wrap" style="margin-top: var(--space-6)"></div>
        </aside>

        <div class="lesson-main">
          <header class="lesson-header">
            <div class="lesson-header-meta">
              <span class="badge badge-brand lesson-type-badge">${lesson.type}</span>
              <span class="text-muted" style="font-size: var(--text-xs)">
                ${lesson.estimated_mins} min · +${lesson.xp_reward} XP
              </span>
            </div>
            ${pos ? `
              <div class="lesson-progress-bar"
                   role="progressbar"
                   aria-valuenow="${pos.current}"
                   aria-valuemin="1"
                   aria-valuemax="${pos.total}"
                   aria-label="Lesson ${pos.current} of ${pos.total} in ${pos.pathTitle}">
                <div class="lesson-progress-track">
                  <div class="lesson-progress-fill"
                       style="width: ${Math.round((pos.current / pos.total) * 100)}%">
                  </div>
                </div>
                <span class="lesson-progress-label">${pos.current} / ${pos.total}</span>
              </div>
            ` : ''}
            <h1 class="lesson-title">${lesson.title}</h1>
          </header>

          <div id="lesson-engine-root"></div>

          <div class="lesson-actions" id="lesson-actions">
            <div class="lesson-lilibet-feedback" id="lesson-lilibet-feedback"></div>
            ${alreadyCompleted
                ? /* Already done — no complete button, show next-prompt immediately if there's a next lesson */
                (nav?.next ? `
                  <div class="lesson-next-prompt">
                    <span class="lesson-next-prompt-text">Up next: ${nav.next.title}</span>
                    <button class="lesson-next-prompt-btn" type="button" id="nav-next-prompt-btn">
                      Continue →
                    </button>
                  </div>` : '')
                : /* Not yet completed — show the gated complete button */
                `<button class="btn btn-primary lesson-complete-btn"
                         id="lesson-complete-btn"
                         type="button"
                         disabled>
                   Mark as complete
                 </button>`
            }
            ${nav ? renderLessonNav(nav, alreadyCompleted) : ''}
          </div>
        </div>
      </div>
    `;

        const actionsEl = document.getElementById('lesson-actions');

        mountLessonEngine(document.getElementById('lesson-engine-root'), lesson, {
            alreadyCompleted,
            onCompleted: () => onLessonCompleted(actionsEl, nav),
        });

        // If already completed, wire up the next-prompt button that was rendered above
        if (alreadyCompleted && nav?.next) {
            actionsEl.querySelector('#nav-next-prompt-btn')?.addEventListener('click', () => {
                navigateTo(lessonUrl(nav.next.id));
            });
        }

        if (nav) bindNavButtons(actionsEl, nav);

        const { mountXPBar } = await import('../components/XPBar/index.js');
        mountXPBar(document.getElementById('sidebar-xpbar'));

        loadSidebarLessons(lesson.path_id, lesson.id);
    } catch {
        root.innerHTML = renderLessonError();
    }
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const loadSidebarLessons = async (pathId, currentLessonId) => {
    const sidebar = document.getElementById('sidebar-lessons');
    if (!sidebar || !pathId) return;

    try {
        const result = await http.get(`/lessons?pathId=${pathId}`);
        const lessons = result.data?.lessons ?? [];

        if (lessons.length === 0) {
            sidebar.innerHTML = '<p class="text-muted" style="font-size:var(--text-xs)">No lessons yet.</p>';
            return;
        }

        sidebar.innerHTML = lessons.map((l) => {
            const progress = progressStore.getLesson(l.id);
            const isCurrent = l.id === currentLessonId;
            const isDone = progress.status === 'completed' || progress.status === 'mastered';
            return `
        <a href="${lessonUrl(l.id)}"
           class="lesson-card ${isCurrent ? 'lesson-card--in-progress' : ''} ${isDone ? 'lesson-card--completed' : ''}"
           aria-current="${isCurrent ? 'page' : 'false'}">
          <span class="lesson-card-icon" aria-hidden="true">
            ${isDone ? '✓' : isCurrent ? '▶' : '○'}
          </span>
          <span class="lesson-card-body">
            <span class="lesson-card-title">${l.title}</span>
            <span class="lesson-card-meta text-muted">${l.estimated_mins} min</span>
          </span>
        </a>
      `;
        }).join('');
    } catch {
        sidebar.innerHTML = '';
    }
};

// ─── Course overview (no lesson ID in URL) ────────────────────────────────────

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
      <div class="content-container" style="padding: var(--space-6) var(--space-4); max-width: 740px; margin: 0 auto;">
        <h1 style="margin-bottom: var(--space-8)">${course.title}</h1>
        ${pathsWithLessons.map((path) => `
          <section style="margin-bottom: var(--space-10)">
            <h2 style="font-size: var(--text-lg); margin-bottom: var(--space-4); color: var(--color-text-secondary)">
              ${path.title}
            </h2>
            <div>
              ${path.lessons.length
                ? path.lessons.map((l) => {
                    const progress = progressStore.getLesson(l.id);
                    const isDone = progress.status === 'completed' || progress.status === 'mastered';
                    return `
                      <a href="/lesson.html?id=${l.id}&course=${slug}"
                         class="lesson-card ${isDone ? 'lesson-card--completed' : ''}">
                        <span class="lesson-card-icon" aria-hidden="true">${isDone ? '✓' : '○'}</span>
                        <span class="lesson-card-body">
                          <span class="lesson-card-title">${l.title}</span>
                          <span class="lesson-card-meta text-muted">
                            ${l.estimated_mins ?? 5} min · +${l.xp_reward ?? 10} XP
                          </span>
                        </span>
                        <span class="lesson-card-status ${isDone ? 'lesson-card-status--done' : ''}">
                          ${isDone ? 'Done' : 'Start'}
                        </span>
                      </a>
                    `;
                }).join('')
                : '<p class="text-muted" style="font-size: var(--text-sm)">No lessons yet.</p>'
            }
            </div>
          </section>
        `).join('')}
      </div>
    `;
    } catch {
        return `
      <div class="content-container" style="padding: var(--space-8) var(--space-4)">
        <p class="text-muted">Course not found.</p>
        <a href="/dashboard.html" class="btn btn-ghost" style="margin-top: var(--space-4)">
          Back to dashboard
        </a>
      </div>
    `;
    }
};

const loadLessonWithRetry = async () => {
    try {
        await loadLesson();
    } catch {
        await new Promise((resolve) => setTimeout(resolve, 600));
        await loadLesson();
    }
};

loadLessonWithRetry();