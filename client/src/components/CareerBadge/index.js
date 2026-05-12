const STAGE_COLORS = {
    'curious-beginner': 'var(--color-text-muted)',
    'data-explorer': 'var(--color-brand)',
    'junior-analyst': 'var(--color-success)',
    'insight-hunter': '#F59E0B',
    'dashboard-architect': '#8B5CF6',
    'analytics-strategist': '#EC4899',
};

const formatStageTitle = (slug) =>
    (slug ?? 'curious-beginner')
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

export const renderCareerBadge = ({ slug, lilibetNote }) => {
    const color = STAGE_COLORS[slug] ?? STAGE_COLORS['curious-beginner'];
    const title = formatStageTitle(slug);

    return `
    <div class="career-badge" aria-label="Career stage: ${title}">
      <span class="career-badge-dot" style="background: ${color}" aria-hidden="true"></span>
      <div class="career-badge-content">
        <span class="career-badge-title" style="color: ${color}">${title}</span>
        ${lilibetNote ? `<p class="career-badge-note lilibet-text">${lilibetNote}</p>` : ''}
      </div>
    </div>
  `;
};