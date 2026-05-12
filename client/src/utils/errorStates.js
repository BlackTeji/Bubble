// Every error state should:
// 1. Explain what happened in plain language
// 2. Preserve the learner's trust
// 3. Offer a clear next action
// Never: "Something went wrong." — that helps no one.

export const renderErrorState = ({
    heading = 'This page couldn\'t load',
    detail = 'It\'s not your connection — something on our end went wrong.',
    action = null,  // { label: string, href?: string, onClick?: fn }
    isRetryable = true,
} = {}) => `
  <div class="error-state" role="alert" aria-live="assertive">
    <div class="error-state-inner">
      <p class="error-state-icon" aria-hidden="true">○</p>
      <h2 class="error-state-heading">${heading}</h2>
      <p class="error-state-detail">${detail}</p>
      ${action ? `
        <${action.href ? `a href="${action.href}"` : 'button type="button" class="error-state-btn"'}
          class="btn btn-ghost"
          ${action.onClick ? `onclick="${action.onClick}"` : ''}>
          ${action.label}
        </${action.href ? 'a' : 'button'}>
      ` : ''}
      ${isRetryable ? `
        <button class="btn btn-subtle" type="button" onclick="window.location.reload()" style="margin-top:var(--space-3)">
          Try again
        </button>
      ` : ''}
    </div>
  </div>
`;

export const renderLessonError = () => renderErrorState({
    heading: 'This lesson couldn\'t load',
    detail: 'Your progress is saved. Try refreshing — if the problem persists, come back in a few minutes.',
    action: { label: 'Return to dashboard', href: '/dashboard.html' },
});

export const renderDashboardError = () => renderErrorState({
    heading: 'Your dashboard is taking a moment',
    detail: 'We\'re having trouble connecting. Your progress and XP are safe.',
    isRetryable: true,
});

export const ERROR_STATE_CSS = `
  .error-state {
    display: flex; align-items: center; justify-content: center;
    min-height: 40vh; padding: var(--space-8) var(--space-6);
  }
  .error-state-inner {
    text-align: center; max-width: 400px;
  }
  .error-state-icon {
    font-size: 2.5rem; color: var(--color-text-muted);
    margin-bottom: var(--space-4); line-height: 1;
  }
  .error-state-heading {
    font-size: var(--text-xl); font-weight: var(--weight-semibold);
    margin-bottom: var(--space-3);
  }
  .error-state-detail {
    color: var(--color-text-secondary); font-size: var(--text-sm);
    line-height: var(--leading-relaxed); margin-bottom: var(--space-6);
  }
`;