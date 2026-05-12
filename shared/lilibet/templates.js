export const templates = {

    quiz_correct: {
        celebration: [
            "Exactly. You're beginning to think like an analyst.",
            "That's right. The pattern is becoming clear to you.",
            "Correct — and notice how quickly that came to you.",
            "Yes. That's the kind of thinking that gets results.",
        ],
        encouragement: [
            "You got there. The process of working it out matters more than the shortcut.",
            "There it is. A little persistence goes a long way.",
            "Correct. You found your way through — that counts.",
        ],
    },

    quiz_wrong: {
        guidance: [
            "Not quite yet. Let's walk through it together.",
            "Close, but something's off. Let's look at it from a different angle.",
            "That's not it — but you're asking the right question.",
            "Not this time. Think about what the data is actually telling you.",
        ],
        reassurance: [
            "Three attempts is not failure — it's thoroughness. Let's find the gap together.",
            "This is exactly where learning happens. Let's slow down and look at this carefully.",
            "You're not stuck. You're close. Here's what to look for.",
        ],
    },

    lesson_complete: {
        celebration: [
            "You just crossed one of the most important boundaries in analytics.",
            "Lesson complete. You've earned this.",
            "Well done. Take a moment — then let's keep going.",
        ],
        reflection: [
            "Another piece in place. You're building something real.",
            "Each lesson is a layer. You've added one more today.",
            "Progress. Quiet, steady, meaningful.",
        ],
    },

    lesson_start: {
        encouragement: [
            "Let's begin. You already know more than you think.",
            "A new lesson. Another chance to think differently about data.",
            "Ready when you are.",
            "This one builds on what you already know.",
        ],
        challenge: [
            "This is a step up. You're ready for it.",
            "This lesson will stretch you in a good way.",
        ],
    },

    streak_maintained: {
        encouragement: [
            "Consistency is the most underrated skill in analytics. You have it.",
            "Showing up every day. That's how this works.",
            "Your streak continues. It's worth more than you think.",
        ],
        celebration: [
            "Seven days. That's not luck — that's commitment.",
            "A week straight. You're building a real habit now.",
        ],
    },

    streak_lost: {
        recovery: [
            "One missed day doesn't erase your progress. Let's continue.",
            "Streaks break sometimes. What matters is starting again.",
            "You haven't lost anything except a number. Let's keep going.",
            "It happens. The only wrong move is stopping entirely.",
        ],
    },

    level_up: {
        celebration: [
            "A new level. You've earned this one.",
            "Level up. Notice how far you've come.",
            "This is real progress. You're not the same learner you were.",
        ],
    },

    badge_earned: {
        celebration: [
            "You've earned something today.",
            "A new badge — and it means something.",
            "Recognition for real progress.",
        ],
    },

    hint_requested: {
        guidance: [
            "Let me show you where to look.",
            "Here's a way to think about this.",
            "A hint — use it as a bridge, not a shortcut.",
            "Let's narrow this down together.",
        ],
        reassurance: [
            "Asking for help is part of the process. Here's what to focus on.",
            "You're not supposed to know this yet. That's what hints are for.",
        ],
    },

    playground_first_run: {
        celebration: [
            "You just ran your first query. That's not nothing.",
            "There it is. Real data, real result, your work.",
            "Your first query. The first of many.",
        ],
    },

    onboarding_welcome: {
        encouragement: [
            "Welcome. You've just made a very good decision.",
            "Let's begin. Data analytics is a skill anyone can learn — including you.",
            "Every analyst you've ever admired started exactly where you are right now.",
        ],
    },

    dashboard_greeting_morning: {
        encouragement: [
            "Good morning. Ready to think in data today?",
            "A new day. A new lesson waiting for you.",
            "Morning. Let's make today count.",
        ],
    },

    dashboard_greeting_returning: {
        encouragement: [
            "Welcome back. You were in the middle of something.",
            "Good to see you again. Shall we continue?",
            "You left off right where things were getting interesting.",
        ],
    },

    struggling_detected: {
        reassurance: [
            "This part trips a lot of people up. It's not you — it's the concept.",
            "You're not behind. You're at exactly the right point of difficulty.",
            "Let's slow down. Understanding is more valuable than speed.",
        ],
    },

    career_stage_reached: {
        celebration: [
            "A new stage. You've genuinely grown.",
            "This title is yours because you've earned it.",
            "You've reached a new level of understanding — and it shows.",
        ],
    },

};

export const fallbacks = [
    "Keep going. You're doing better than you think.",
    "One step at a time.",
    "Progress.",
];