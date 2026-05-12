import { launchConfetti } from '../utils/confetti.js';
import { floatXP } from '../utils/animations.js';
import { clientBus, CLIENT_EVENTS } from '../utils/eventBus.js';
import { showToast } from '../components/Toast/index.js';

export const celebrate = ({ type, level = 'subtle', xpEarned, message, anchorEl }) => {
    if (level === 'big' || level === 'medium') {
        launchConfetti(level);
    }

    if (xpEarned && anchorEl) {
        floatXP(xpEarned, anchorEl);
    }

    if (message) {
        clientBus.emit(CLIENT_EVENTS.LILIBET_MESSAGE, { message });
    }

    if (type === 'level_up') {
        showToast({ message: `Level up! You've reached a new level.`, type: 'success' });
    }

    if (type === 'badge_earned') {
        showToast({ message: `You earned a new badge.`, type: 'success' });
    }
};

export const handleSubmissionResult = ({ isCorrect, xpEarned, lilibetMessage, badges, levelUp, anchorEl }) => {
    if (isCorrect) {
        celebrate({
            type: 'lesson_complete',
            level: levelUp ? 'big' : 'medium',
            xpEarned,
            message: lilibetMessage,
            anchorEl,
        });

        if (levelUp) {
            celebrate({ type: 'level_up', level: 'big', anchorEl });
        }

        badges?.forEach((badge) => {
            celebrate({ type: 'badge_earned', level: 'subtle', anchorEl });
        });
    }
};