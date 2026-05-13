import { requireAuth, navigate } from '../services/authService.js';
import { mountToastSystem, toast } from '../components/Toast/index.js';
import { http } from '../services/http.js';
import { getMessage } from '../../shared/lilibet/index.js';
import { slideUp } from '../utils/animations.js';

if (!requireAuth()) throw new Error('Redirecting');

mountToastSystem();

const root = document.getElementById('page-root');

const STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to Bubble.',
        lilibet: getMessage('onboarding_welcome', {}),
        content: renderWelcomeStep,
    },
    {
        id: 'goal',
        title: 'What brings you here?',
        lilibet: 'Knowing your goal helps me guide you toward what matters most.',
        content: renderGoalStep,
    },
    {
        id: 'level',
        title: 'Where are you starting from?',
        lilibet: 'There is no wrong answer. This just helps me set the right pace.',
        content: renderLevelStep,
    },
];

let currentStep = 0;
const answers = {};

function renderWelcomeStep() {
    return `
    <div class="onboarding-welcome">
      <p class="onboarding-body">
        Bubble teaches data analytics through real practice — not passive videos.
        You will write real queries, analyse real data, and build real understanding.
      </p>
      <p class="onboarding-body">
        I am Lilibet, your learning guide. I will be with you throughout.
      </p>
    </div>
  `;
}

function renderGoalStep() {
    const goals = [
        { value: 'career-change', label: 'Transition into data', icon: '🚀' },
        { value: 'upskill', label: 'Level up at my current job', icon: '📈' },
        { value: 'personal-project', label: 'Analyse my own data', icon: '🔍' },
        { value: 'curiosity', label: 'Just curious', icon: '✨' },
    ];

    return `
    <div class="onboarding-options" role="radiogroup" aria-label="Learning goal">
      ${goals.map(({ value, label, icon }) => `
        <button class="onboarding-option" data-value="${value}" role="radio" aria-checked="false" type="button">
          <span class="onboarding-option-icon" aria-hidden="true">${icon}</span>
          <span class="onboarding-option-label">${label}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderLevelStep() {
    const levels = [
        { value: 'beginner', label: 'Complete beginner', detail: 'I\'ve never worked with data before.' },
        { value: 'intermediate', label: 'Some experience', detail: 'I\'ve used spreadsheets and basic tools.' },
        { value: 'advanced', label: 'Technical background', detail: 'I can write code and want to specialise.' },
    ];

    return `
    <div class="onboarding-options" role="radiogroup" aria-label="Skill level">
      ${levels.map(({ value, label, detail }) => `
        <button class="onboarding-option onboarding-option--wide" data-value="${value}" role="radio" aria-checked="false" type="button">
          <span class="onboarding-option-label">${label}</span>
          <span class="onboarding-option-detail text-muted">${detail}</span>
        </button>
      `).join('')}
    </div>
  `;
}

const render = () => {
    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    root.innerHTML = `
    <div class="onboarding-page">
      <div class="onboarding-card card animate-fade-in-up">

        <div class="onboarding-progress" aria-label="Step ${currentStep + 1} of ${STEPS.length}">
          ${STEPS.map((_, i) => `<div class="onboarding-dot ${i === currentStep ? 'onboarding-dot--active' : i < currentStep ? 'onboarding-dot--done' : ''}"></div>`).join('')}
        </div>

        <div class="lilibet-message onboarding-lilibet">
          <div class="lilibet-avatar"><img src="/assets/icons/lilibet-avatar.svg" alt="Lilibet" width="52" height="52"></div>
          <div class="lilibet-body">
            <span class="lilibet-name">Lilibet</span>
            <p class="lilibet-text">${step.lilibet}</p>
          </div>
        </div>

        <h1 class="onboarding-title">${step.title}</h1>

        <div class="onboarding-step-content" id="step-content">
          ${step.content()}
        </div>

        <div class="onboarding-actions">
          ${currentStep > 0 ? `<button class="btn btn-subtle" id="back-btn" type="button">Back</button>` : '<span></span>'}
          <button class="btn btn-primary" id="next-btn" type="button" ${currentStep > 0 && !answers[step.id] ? 'disabled' : ''}>
            ${isLast ? 'Start learning' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  `;

    bindStepEvents();
};

const bindStepEvents = () => {
    document.querySelectorAll('.onboarding-option').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.onboarding-option').forEach((b) => {
                b.classList.remove('onboarding-option--selected');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('onboarding-option--selected');
            btn.setAttribute('aria-checked', 'true');
            answers[STEPS[currentStep].id] = btn.dataset.value;
            const nextBtn = document.getElementById('next-btn');
            if (nextBtn) nextBtn.disabled = false;
        });
    });

    document.getElementById('next-btn')?.addEventListener('click', async () => {
        if (currentStep === 0 || answers[STEPS[currentStep].id]) {
            if (currentStep === STEPS.length - 1) {
                await completeOnboarding();
            } else {
                currentStep++;
                render();
                slideUp(root.querySelector('.onboarding-card'));
            }
        }
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
        if (currentStep > 0) { currentStep--; render(); }
    });
};

const completeOnboarding = async () => {
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = 'Setting up…'; }

    try {
        await http.patch('/auth/me', {
            learningGoal: answers.goal,
            skillLevel: answers.level ?? 'beginner',
            onboardingDone: true,
        });

        navigate('/dashboard.html');
    } catch (err) {
        toast.error('Something went wrong. Please try again.');
        if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = 'Start learning'; }
    }
};

const addOnboardingStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .onboarding-page {
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      padding: var(--space-6); background: var(--color-bg);
    }
    .onboarding-card { width: 100%; max-width: 480px; }
    .onboarding-progress { display: flex; gap: var(--space-2); margin-bottom: var(--space-6); }
    .onboarding-dot { height: 4px; flex: 1; background: var(--color-surface-3); border-radius: var(--radius-full); transition: background var(--duration-base); }
    .onboarding-dot--active { background: var(--color-brand); }
    .onboarding-dot--done   { background: var(--color-success); }
    .onboarding-lilibet { margin-bottom: var(--space-5); }
    .onboarding-title { font-size: var(--text-2xl); margin-bottom: var(--space-6); }
    .onboarding-body  { font-size: var(--text-base); line-height: var(--leading-relaxed); color: var(--color-text-secondary); margin-bottom: var(--space-4); }
    .onboarding-step-content { margin-bottom: var(--space-8); }
    .onboarding-options { display: flex; flex-direction: column; gap: var(--space-3); }
    .onboarding-option {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border: 1.5px solid var(--color-border); border-radius: var(--radius-lg);
      text-align: left; transition: all var(--duration-fast) var(--ease-smooth);
      background: var(--color-surface);
    }
    .onboarding-option:hover  { border-color: var(--color-brand); background: var(--color-brand-light); }
    .onboarding-option--selected { border-color: var(--color-brand); background: var(--color-brand-light); }
    .onboarding-option--wide { flex-direction: column; align-items: flex-start; gap: var(--space-1); }
    .onboarding-option-icon  { font-size: var(--text-xl); }
    .onboarding-option-label { font-size: var(--text-sm); font-weight: var(--weight-semibold); }
    .onboarding-option-detail{ font-size: var(--text-xs); }
    .onboarding-actions { display: flex; justify-content: space-between; align-items: center; }
  `;
    document.head.appendChild(style);
};

addOnboardingStyles();
render();