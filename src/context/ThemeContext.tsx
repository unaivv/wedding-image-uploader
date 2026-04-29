import { createContext, useContext } from 'react';

export interface ThemeContextValue {
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    toggleTheme: () => undefined,
});

export const useThemeContext = () => useContext(ThemeContext);
