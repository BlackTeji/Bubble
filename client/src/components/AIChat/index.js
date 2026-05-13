import { requestHint } from '../../services/aiService.js';
import { slideUp } from '../../utils/animations.js';
import { showToast } from '../Toast/index.js';
import { HttpError } from '../../services/http.js';

const HINT_PROMPTS = [
    'Give me a nudge',
    'I need more help',
    'Walk me through it',
];

export const renderHintButton = (lessonId, hintCount = 0) => {
    const label = HINT_PROMPTS[Math.min(hintCount, 2)];
    const remaining = 3 - hintCount;

    return `
    <div class="hint-panel">
      <button class="hint-btn btn btn-subtle" id="hint-request-btn" data-lesson-id="${lessonId}" type="button" ${hintCount >= 3 ? 'disabled' : ''}>
        <span class="hint-btn-icon" aria-hidden="true">💡</span>
        ${label}
        ${hintCount > 0 && remaining > 0 ? `<span class="hint-count text-muted">(${remaining} left)</span>` : ''}
      </button>
      <div class="hint-response" id="hint-response" aria-live="polite"></div>
    </div>
  `;
};

export const mountHintPanel = (container, { lessonId, getUserCode }) => {
    if (!container) return;

    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('#hint-request-btn');
        if (!btn || btn.disabled) return;

        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="hint-btn-icon" aria-hidden="true">💡</span> Thinking…`;

        const responseEl = container.querySelector('#hint-response');

        try {
            const userCode = getUserCode?.() ?? '';
            const result = await requestHint({ lessonId, userCode });

            if (responseEl) {
                responseEl.innerHTML = `
          <div class="hint-message lilibet-message animate-fade-in-up">
            <div class="lilibet-avatar"><img src="/assets/icons/lilibet-avatar.png" alt="Lilibet" width="52" height="52"></div>
            <p class="lilibet-text">${result.hint}</p>
          </div>
        `;
                slideUp(responseEl.firstElementChild);
            }

            const newCount = result.hintsUsed ?? 1;
            const remaining = result.hintsRemaining ?? (3 - newCount);
            const nextLabel = HINT_PROMPTS[Math.min(newCount, 2)];

            btn.disabled = remaining <= 0;
            btn.innerHTML = `
        <span class="hint-btn-icon" aria-hidden="true">💡</span>
        ${remaining > 0 ? nextLabel : 'No more hints'}
        ${remaining > 0 && remaining < 3 ? `<span class="hint-count text-muted">(${remaining} left)</span>` : ''}
      `;
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = originalText;

            const message = err instanceof HttpError
                ? err.message
                : 'Could not get a hint right now. Try again.';

            showToast({ message, type: 'error' });
        }
    });
};