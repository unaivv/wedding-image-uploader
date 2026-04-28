const timestamp = () => new Date().toISOString();

export const logger = {
    error: (message: string, detail?: unknown) => {
        process.stderr.write(`[${timestamp()}] ERROR ${message}${detail !== undefined ? ` — ${String(detail)}` : ''}\n`);
    },
};
