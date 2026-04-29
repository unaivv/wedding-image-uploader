import { Button, Toggle } from 'rsuite';
import { useThemeContext } from '../../context/ThemeContext';
import { auth } from '../../utils/auth';
import ExitIcon from '@rsuite/icons/Exit';
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
                    size="lg"
                />
                <Button size="sm" appearance="subtle" onClick={() => auth.logout()} startIcon={<ExitIcon />}>
                    Salir
                </Button>
            </div>
        </header>
    );
};

export { Header };
