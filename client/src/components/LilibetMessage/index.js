import { slideUp } from '../../utils/animations.js';

export const renderLilibetMessage = (message, tone = 'encouragement') => `
  <div class="lilibet-message lilibet-message--${tone}" role="status" aria-live="polite">
    <div class="lilibet-avatar" aria-hidden="true">L</div>
    <p class="lilibet-text">${message}</p>
  </div>
`;

export const showLilibetMessage = (container, message, tone) => {
    if (!container || !message) return;
    container.innerHTML = renderLilibetMessage(message, tone);
    slideUp(container.firstElementChild);
};

export const mountLilibetListener = (container) => {
    import('../../utils/eventBus.js').then(({ clientBus, CLIENT_EVENTS }) => {
        clientBus.on(CLIENT_EVENTS.LILIBET_MESSAGE, ({ message, tone }) => {
            showLilibetMessage(container, message, tone);
        });
    });
};