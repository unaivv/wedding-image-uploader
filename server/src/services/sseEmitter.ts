import { Response } from 'express';

interface SSEClient {
    res: Response;
    eventId: string;
}

const clients = new Map<string, SSEClient>();

export const addSSEClient = (id: string, res: Response, eventId: string): void => {
    clients.set(id, { res, eventId });
};

export const removeSSEClient = (id: string): void => {
    clients.delete(id);
};

export const emitToEvent = (eventId: string, event: string, data: unknown): void => {
    for (const [, client] of clients) {
        if (client.eventId === eventId) {
            client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
    }
};
