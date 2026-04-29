import { Toggle } from 'rsuite';
import { useThemeContext } from '../../context/ThemeContext';
import styles from './Header.module.css';

const Header = () => {
    const { theme, toggleTheme } = useThemeContext();
    return (
        <header className={styles.header}>
            <div className={styles.titleGroup}>
                <span className={styles.title}>Unai & Marifeli 💍</span>
                <span className={styles.subtitle}>Álbum de nuestra boda</span>
            </div>
            <div className={styles.controls}>
                <Toggle
                    checked={theme === 'light'}
                    onChange={toggleTheme}
                    checkedChildren="☀️"
                    unCheckedChildren="🌙"
                    size="sm"
                />
            </div>
        </header>
    );
};

export { Header };
