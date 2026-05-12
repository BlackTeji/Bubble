export const renderStreakBadge = ({ currentStreak = 0, longestStreak = 0 }) => {
    const isActive = currentStreak > 0;
    const isRecord = currentStreak > 0 && currentStreak >= longestStreak;

    return `
    <div class="streak-badge ${isActive ? 'streak-badge--active' : ''}" aria-label="${currentStreak} day streak${isRecord ? ', personal best' : ''}">
      <span class="streak-badge-flame" aria-hidden="true">${isActive ? '🔥' : '○'}</span>
      <div class="streak-badge-info">
        <span class="streak-badge-count">${currentStreak} <span class="streak-badge-unit">day${currentStreak !== 1 ? 's' : ''}</span></span>
        ${isRecord && currentStreak > 1 ? `<span class="streak-badge-best badge badge-brand">Best</span>` : ''}
      </div>
    </div>
  `;
};