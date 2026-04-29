import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { addSSEClient, removeSSEClient } from '../services/sseEmitter';

const router = Router();

router.get('/stream', (req: Request, res: Response) => {
    const { eventId } = req.query;
    if (!eventId || typeof eventId !== 'string') {
        res.status(400).json({ error: 'Missing eventId' });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const clientId = randomUUID();
    addSSEClient(clientId, res, eventId);

    const keepAlive = setInterval(() => {
        res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
        clearInterval(keepAlive);
        removeSSEClient(clientId);
    });
});

export { router };
