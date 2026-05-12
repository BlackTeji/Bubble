import { progressStore } from '../../stores/progressStore.js';

const TYPE_ICONS = {
    concept: '📖',
    quiz: '✏️',
    challenge: '⚡',
    playground: '💻',
    scenario: '🔍',
    project: '🏗️',
};

const STATUS_LABELS = {
    not_started: { label: 'Start', className: '' },
    in_progress: { label: 'Continue', className: 'lesson-card--in-progress' },
    completed: { label: 'Completed', className: 'lesson-card--completed' },
    mastered: { label: 'Mastered', className: 'lesson-card--mastered' },
};

export const renderLessonCard = (lesson) => {
    const progress = progressStore.getLesson(lesson.id);
    const status = STATUS_LABELS[progress.status] ?? STATUS_LABELS.not_started;
    const icon = TYPE_ICONS[lesson.type] ?? '📄';

    return `
    <a
      href="/lesson.html?id=${lesson.id}"
      class="lesson-card ${status.className}"
      aria-label="${lesson.title} — ${status.label}"
    >
      <span class="lesson-card-icon" aria-hidden="true">${icon}</span>
      <div class="lesson-card-body">
        <span class="lesson-card-title">${lesson.title}</span>
        <span class="lesson-card-meta text-muted">
          ${lesson.estimated_mins} min · +${lesson.xp_reward} XP
        </span>
      </div>
      <span class="lesson-card-status ${progress.status === 'completed' ? 'lesson-card-status--done' : ''}">
        ${progress.status === 'completed' ? '✓' : status.label}
      </span>
    </a>
  `;
};