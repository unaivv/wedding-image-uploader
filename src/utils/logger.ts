const timestamp = () => new Date().toISOString();

export const logger = {
    error: (message: string, detail?: unknown): void => {
        console.error(`[${timestamp()}] ERROR ${message}`, detail !== undefined ? detail : '');
    },
};
