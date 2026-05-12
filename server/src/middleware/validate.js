import Joi from 'joi';

export const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const messages = error.details.map((d) => d.message).join('. ');
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: messages },
        });
    }

    req.body = value;
    next();
};

export const schemas = {
    register: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address.',
            'any.required': 'Email is required.',
        }),
        username: Joi.string().alphanum().min(3).max(30).required().messages({
            'string.alphanum': 'Username can only contain letters and numbers.',
            'string.min': 'Username must be at least 3 characters.',
            'string.max': 'Username cannot exceed 30 characters.',
            'any.required': 'Username is required.',
        }),
        displayName: Joi.string().min(2).max(50).optional(),
        password: Joi.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters.',
            'any.required': 'Password is required.',
        }),
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    updateProfile: Joi.object({
        displayName: Joi.string().min(2).max(50).optional(),
        learningGoal: Joi.string().max(255).optional(),
        skillLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
        onboardingDone: Joi.boolean().optional(),
    }),

    submission: Joi.object({
        lessonId: Joi.string().uuid().required(),
        type: Joi.string().valid('quiz', 'code', 'playground', 'lesson_complete').required(),
        code: Joi.string().max(10000).optional(),
        answerJson: Joi.object().optional(),
        timeTakenS: Joi.number().integer().min(0).optional(),
    }),

    aiHint: Joi.object({
        lessonId: Joi.string().uuid().required(),
        userCode: Joi.string().max(5000).optional(),
        question: Joi.string().max(500).optional(),
        hintNumber: Joi.number().integer().min(1).max(3).default(1),
        errorMessage: Joi.string().max(500).optional(),
    }),
};