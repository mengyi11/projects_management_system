export class AppError extends Error {
    constructor(message, status = 500, details = null) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

export const throwError = (message, status = 500, details = null) => {
    throw new AppError(message, status, details);
};

export const handleError = (err) => {
    //used for throwErrors
    if (err instanceof AppError) {
        console.log("err instanceof AppErro:"+`[${err.status}] ${err.message}`, err.details || '')
        console.error(`[${err.status}] ${err.message}`, err.details || '');
        return new Response(
            JSON.stringify({ ok: false, message: err.message, details: err.details }),
            { status: err.status, headers: { 'Content-Type': 'application/json' } }
        );
    }
    //used for Internal Server Error
    console.error('[500] Unexpected Error:', err);
    throw new Response(
        JSON.stringify({ ok: false, message: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
};