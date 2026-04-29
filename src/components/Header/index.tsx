import { Toggle } from 'rsuite';
import { useThemeContext } from '../../context/ThemeContext';
import styles from './Header.module.css';

const Header = () => {
    const { theme, toggleTheme } = useThemeContext();
    return (
        <header className={styles.header}>
            <span className={styles.title}>Unai & Marifeli 💍</span>
            <Toggle
                checked={theme === 'light'}
                onChange={toggleTheme}
                checkedChildren="☀️"
                unCheckedChildren="🌙"
                size="sm"
            />
        </header>
    );
};

export { Header };
