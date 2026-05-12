import { xpStore } from '../../stores/xpStore.js';
import { pulseElement } from '../../utils/animations.js';

export const renderXPBar = ({ level, progressXP, neededXP, percentage }) => `
  <div class="xp-bar-wrap" role="region" aria-label="Experience points progress">
    <div class="xp-bar-meta">
      <span class="xp-bar-level">Level ${level}</span>
      <span class="xp-bar-count text-muted">${progressXP} / ${neededXP} XP</span>
    </div>
    <div class="xp-bar-track" role="progressbar"
         aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"
         aria-label="${percentage}% to next level">
      <div class="xp-bar-fill" style="width: ${percentage}%"></div>
    </div>
  </div>
`;

export const mountXPBar = (container) => {
    if (!container) return;

    const render = (state) => {
        container.innerHTML = renderXPBar(state);
    };

    const unsubscribe = xpStore.subscribe((state) => {
        const prevPercentage = parseFloat(container.querySelector('.xp-bar-fill')?.style.width ?? '0');
        render(state);
        if (state.percentage > prevPercentage) {
            const fill = container.querySelector('.xp-bar-fill');
            if (fill) pulseElement(fill, 600);
        }
    });

    return unsubscribe;
};