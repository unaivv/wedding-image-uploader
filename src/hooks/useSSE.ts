import { useEffect } from 'react';

type SSEHandler = (data: unknown) => void;

export const useSSE = (eventId: string, handlers: Record<string, SSEHandler>): void => {
    useEffect(() => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/events/stream?eventId=${eventId}`;
        const source = new EventSource(url);

        const listeners: Array<[string, EventListener]> = Object.entries(handlers).map(([event, handler]) => {
            const listener = (e: Event) => {
                const raw = (e as MessageEvent).data;
                if (typeof raw === 'string') handler(JSON.parse(raw));
            };
            source.addEventListener(event, listener);
            return [event, listener];
        });

        return () => {
            listeners.forEach(([event, listener]) => source.removeEventListener(event, listener));
            source.close();
        };
    }, [eventId]);
};
