import { useEffect, useRef } from 'react';

type SSEHandler = (data: unknown) => void;

export const useSSE = (eventId: string, handlers: Record<string, SSEHandler>): void => {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        let source: EventSource;
        let retryDelay = 1_000;
        let retryTimeout: ReturnType<typeof setTimeout>;
        let cancelled = false;

        const connect = () => {
            if (cancelled) return;

            const url = `${import.meta.env.VITE_BACKEND_URL}/events/stream?eventId=${eventId}`;
            source = new EventSource(url);

            Object.keys(handlersRef.current).forEach(event => {
                source.addEventListener(event, (e: Event) => {
                    const raw = (e as MessageEvent).data;
                    if (typeof raw === 'string') handlersRef.current[event]?.(JSON.parse(raw));
                });
            });

            source.onopen = () => {
                retryDelay = 1_000;
            };

            source.onerror = () => {
                source.close();
                if (!cancelled) {
                    retryTimeout = setTimeout(() => {
                        retryDelay = Math.min(retryDelay * 2, 30_000);
                        connect();
                    }, retryDelay);
                }
            };
        };

        connect();

        return () => {
            cancelled = true;
            clearTimeout(retryTimeout);
            source?.close();
        };
    }, [eventId]);
};
