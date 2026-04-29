import { useState } from 'react';

const THEME_KEY = 'ui-theme';

export const useTheme = () => {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const stored = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null;
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem(THEME_KEY, next);
            return next;
        });
    };

    return { theme, toggleTheme };
};
