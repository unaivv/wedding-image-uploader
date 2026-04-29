import { Button, Toggle } from 'rsuite';
import { Link, useLocation } from 'react-router-dom';
import { useThemeContext } from '../../context/ThemeContext';
import { auth } from '../../utils/auth';
import ExitIcon from '@rsuite/icons/Exit';
import styles from './Header.module.css';

const Header = () => {
    const { theme, toggleTheme } = useThemeContext();
    const { pathname } = useLocation();
    const isAdmin = auth.isAdmin();
    const inAdmin = pathname.startsWith('/admin');

    return (
        <header className={styles.header}>
            <div className={styles.titleGroup}>
                <span className={styles.title}>Unai & Marifeli 💍</span>
                <span className={styles.subtitle}>Álbum de nuestra boda</span>
            </div>
            <div className={styles.controls}>
                {inAdmin && (
                    <Link to="/"><Button size="sm" appearance="subtle">← Inicio</Button></Link>
                )}
                {isAdmin && !inAdmin && (
                    <Link to="/admin"><Button size="sm" appearance="subtle">Admin</Button></Link>
                )}
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
