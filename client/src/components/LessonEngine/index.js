import { http } from '../../services/http.js';
import { lessonStore } from '../../stores/lessonStore.js';
import { progressStore } from '../../stores/progressStore.js';
import { xpStore } from '../../stores/xpStore.js';
import { clientBus, CLIENT_EVENTS } from '../../utils/eventBus.js';
import { getMessage } from '../../../../shared/lilibet/index.js';
import { slideUp, floatXP } from '../../utils/animations.js';
import { handleSubmissionResult } from '../../services/celebrationService.js';
import { showToast } from '../Toast/index.js';
import { navigateTo } from '../../utils/transitions.js';

const BLOCK_RENDERERS = {
    text: renderTextBlock,
    callout: renderCalloutBlock,
    code: renderCodeBlock,
    quiz: renderQuizBlock,
    fill: renderFillBlock,
    list: renderListBlock,
    table: renderTableBlock,
    comparison: renderComparisonBlock,
    divider: () => `<hr class="lesson-divider" aria-hidden="true">`,
};

function renderTextBlock({ content }) {
    return `<p class="lesson-text">${content}</p>`;
}

function renderCalloutBlock({ content, variant = 'tip' }) {
    const labels = { tip: 'Tip', insight: 'Insight', warning: 'Note' };
    return `
    <div class="callout callout--${variant}" role="note">
      <span class="callout-label">${labels[variant] ?? 'Note'}</span>
      <p class="callout-text">${content}</p>
    </div>
  `;
}

function renderCodeBlock({ code, lang = 'sql', label = '' }) {
    return `
    <div class="code-block">
      ${label ? `<span class="code-block-label">${label}</span>` : ''}
      <pre class="code-block-pre"><code class="code-block-code language-${lang}">${escapeHtml(code)}</code></pre>
    </div>
  `;
}

function renderListBlock({ items }) {
    return `
    <ul class="lesson-list" role="list">
      ${items.map(({ label, detail }) => `
        <li class="lesson-list-item">
          <span class="lesson-list-label">${label}</span>
          ${detail ? `<span class="lesson-list-detail text-secondary">${detail}</span>` : ''}
        </li>
      `).join('')}
    </ul>
  `;
}

function renderTableBlock({ headers, rows, caption }) {
    return `
    <div class="lesson-table-wrap" role="region" aria-label="${caption ?? 'Data table'}" tabindex="0">
      <table class="lesson-table">
        ${caption ? `<caption class="lesson-table-caption">${caption}</caption>` : ''}
        <thead>
          <tr>${headers.map((h) => `<th scope="col">${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderComparisonBlock({ left, right }) {
    const renderSide = (side) => `
    <div class="comparison-side">
      <h4 class="comparison-label">${side.label}</h4>
      <p class="comparison-desc text-secondary">${side.description}</p>
      <ul class="comparison-examples" role="list">
        ${side.examples.map((ex) => `<li class="comparison-example">${ex}</li>`).join('')}
      </ul>
    </div>
  `;
    return `
    <div class="comparison-block" role="region" aria-label="Comparison: ${left.label} vs ${right.label}">
      ${renderSide(left)}
      <span class="comparison-vs" aria-hidden="true">vs</span>
      ${renderSide(right)}
    </div>
  `;
}

function renderQuizBlock({ question, options, correct, explanation }, blockIndex) {
    return `
    <div class="quiz-block" data-block-index="${blockIndex}" data-correct="${correct}" role="group" aria-labelledby="quiz-q-${blockIndex}">
      <p class="quiz-question" id="quiz-q-${blockIndex}">${question}</p>
      <div class="quiz-options" role="radiogroup" aria-labelledby="quiz-q-${blockIndex}">
        ${options.map((opt, i) => `
          <button
            class="quiz-option"
            data-index="${i}"
            role="radio"
            aria-checked="false"
            type="button"
          >
            <span class="quiz-option-marker" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
            <span class="quiz-option-text">${opt}</span>
          </button>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback-${blockIndex}" aria-live="polite" hidden></div>
      <div class="quiz-explanation" id="quiz-explanation-${blockIndex}" hidden>
        <p>${explanation ?? ''}</p>
      </div>
    </div>
  `;
}

function renderFillBlock({ instruction, template, blanks, hint }, blockIndex) {
    let inputIndex = 0;
    const withInputs = template.replace(/___/g, () => {
        const idx = inputIndex++;
        return `<input
      class="fill-input"
      type="text"
      data-blank-index="${idx}"
      data-correct="${blanks[idx]}"
      aria-label="Fill in blank ${idx + 1}"
      autocomplete="off"
      spellcheck="false"
    >`;
    });

    return `
    <div class="fill-block" data-block-index="${blockIndex}" role="group" aria-label="Fill in the blanks exercise">
      <p class="fill-instruction">${instruction}</p>
      <pre class="fill-template"><code>${withInputs}</code></pre>
      ${hint ? `<p class="fill-hint text-muted">Hint: ${hint}</p>` : ''}
      <button class="btn btn-primary fill-submit" type="button" data-block-index="${blockIndex}">
        Check answer
      </button>
      <div class="fill-feedback" aria-live="polite"></div>
    </div>
  `;
}

export const renderBlocks = (blocks) => {
    return blocks.map((block, i) => {
        const renderer = BLOCK_RENDERERS[block.type];
        if (!renderer) return `<div class="lesson-unknown-block">Unknown block type: ${block.type}</div>`;
        return `<div class="lesson-block lesson-block--${block.type} animate-fade-in-up" style="animation-delay: ${i * 40}ms">${renderer(block, i)}</div>`;
    }).join('');
};

export const mountLessonEngine = (container, lesson) => {
    const content = lesson.content_json;
    if (!content) return;

    container.innerHTML = `
    <article class="lesson-content" aria-label="${lesson.title}">
      ${content.intro ? `
        <div class="lesson-intro">
          <div class="lilibet-message">
            <div class="lilibet-avatar" aria-hidden="true">L</div>
            <p class="lilibet-text">${getMessage('lesson_start', {})}</p>
          </div>
          <p class="lesson-intro-text">${content.intro}</p>
        </div>
      ` : ''}

      <div class="lesson-blocks">
        ${renderBlocks(content.blocks ?? [])}
      </div>

      <div class="lesson-actions">
        <div class="lesson-lilibet-feedback" id="lesson-lilibet-feedback"></div>
        <button class="btn btn-primary lesson-complete-btn" id="lesson-complete-btn" type="button" disabled>
          Mark as complete
        </button>
      </div>
    </article>
  `;

    bindLessonInteractions(container, lesson);
};

const bindLessonInteractions = (container, lesson) => {
    let quizzesAnswered = 0;
    let fillsSubmitted = 0;
    const quizBlocks = container.querySelectorAll('.quiz-block');
    const fillBlocks = container.querySelectorAll('.fill-block');
    const totalInteractives = quizBlocks.length + fillBlocks.length;

    const checkCompletion = () => {
        if (quizzesAnswered + fillsSubmitted >= totalInteractives) {
            const btn = container.querySelector('#lesson-complete-btn');
            if (btn) { btn.disabled = false; btn.classList.add('animate-bounce-in'); }
        }
    };

    quizBlocks.forEach((quizEl) => {
        let answered = false;

        quizEl.querySelectorAll('.quiz-option').forEach((optBtn) => {
            optBtn.addEventListener('click', async () => {
                if (answered) return;
                answered = true;

                const selectedIndex = parseInt(optBtn.dataset.index, 10);
                const correctIndex = parseInt(quizEl.dataset.correct, 10);
                const blockIndex = quizEl.dataset.blockIndex;
                const isCorrect = selectedIndex === correctIndex;

                quizEl.querySelectorAll('.quiz-option').forEach((btn, i) => {
                    btn.setAttribute('aria-checked', String(i === selectedIndex));
                    btn.classList.add(i === correctIndex ? 'quiz-option--correct' : (i === selectedIndex ? 'quiz-option--wrong' : ''));
                    btn.disabled = true;
                });

                const feedbackEl = container.querySelector(`#quiz-feedback-${blockIndex}`);
                const explanationEl = container.querySelector(`#quiz-explanation-${blockIndex}`);
                const lilibetEl = container.querySelector('#lesson-lilibet-feedback');

                const message = getMessage(isCorrect ? 'quiz_correct' : 'quiz_wrong', {
                    isCorrect,
                    attempts: 1,
                });

                if (feedbackEl) {
                    feedbackEl.hidden = false;
                    feedbackEl.innerHTML = `<span class="${isCorrect ? 'feedback--correct' : 'feedback--wrong'}">${isCorrect ? '✓ Correct' : '✗ Not quite'}</span>`;
                    slideUp(feedbackEl);
                }

                if (explanationEl) {
                    explanationEl.hidden = false;
                    slideUp(explanationEl);
                }

                if (lilibetEl) {
                    lilibetEl.innerHTML = `
            <div class="lilibet-message animate-fade-in-up">
              <div class="lilibet-avatar" aria-hidden="true">L</div>
              <p class="lilibet-text">${message}</p>
            </div>
          `;
                }

                quizzesAnswered++;
                checkCompletion();
            });
        });
    });

    fillBlocks.forEach((fillEl) => {
        const submitBtn = fillEl.querySelector('.fill-submit');
        const feedbackEl = fillEl.querySelector('.fill-feedback');
        let submitted = false;

        submitBtn?.addEventListener('click', () => {
            if (submitted) return;

            const inputs = fillEl.querySelectorAll('.fill-input');
            let allCorrect = true;

            inputs.forEach((input) => {
                const correct = input.dataset.correct.toLowerCase().trim();
                const given = input.value.toLowerCase().trim();
                const isRight = given === correct;
                input.classList.toggle('fill-input--correct', isRight);
                input.classList.toggle('fill-input--wrong', !isRight);
                if (!isRight) allCorrect = false;
            });

            if (allCorrect) {
                submitted = true;
                submitBtn.disabled = true;
                if (feedbackEl) {
                    feedbackEl.innerHTML = `<span class="feedback--correct">✓ Perfect.</span>`;
                    slideUp(feedbackEl);
                }
                fillsSubmitted++;
                checkCompletion();
            } else {
                if (feedbackEl) {
                    feedbackEl.innerHTML = `<span class="feedback--wrong">Not quite — check the highlighted blanks.</span>`;
                }
            }
        });
    });

    const completeBtn = container.querySelector('#lesson-complete-btn');
    completeBtn?.addEventListener('click', () => submitLessonCompletion(lesson, completeBtn));
};

const submitLessonCompletion = async (lesson, btn) => {
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
        const result = await http.post('/submissions', {
            lessonId: lesson.id,
            type: 'lesson_complete',
        });

        const data = result.data;

        progressStore.updateLesson(lesson.id, { status: 'completed', score: 100 });
        clientBus.emit(CLIENT_EVENTS.LESSON_COMPLETED, { lessonId: lesson.id });

        setTimeout(async () => {
            try {
                const gamResult = await http.get('/gamification/summary');
                if (gamResult?.data?.xp !== undefined) {
                    xpStore.setFromXP(gamResult.data.xp);
                }
            } catch {
            }
        }, 800);

        handleSubmissionResult({
            isCorrect: true,
            xpEarned: data.xpEarned,
            lilibetMessage: data.lilibetMessage,
            badges: data.badges,
            levelUp: data.levelUp,
            anchorEl: btn,
        });

        btn.textContent = '✓ Completed';
        btn.classList.add('btn-success');

        const nextSlug = lesson.content_json?.completion?.nextLessonSlug;
        if (nextSlug) {
            setTimeout(() => {
                showToast({ message: 'Next lesson ready.', type: 'info' });
            }, 1500);
        }
    } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Mark as complete';
        showToast({ message: 'Could not save progress. Please try again.', type: 'error' });
    }
};

const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');