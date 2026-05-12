export const success = (res, data = null, message = null, statusCode = 200) => {
    const body = { success: true };
    if (message) body.message = message;
    if (data !== null) body.data = data;
    return res.status(statusCode).json(body);
};

export const created = (res, data = null, message = null) =>
    success(res, data, message, 201);

export const failure = (res, code, message, statusCode = 400) =>
    res.status(statusCode).json({
        success: false,
        error: { code, message },
    });