import { useState } from 'react';
import { Header } from '../components/Header';
import { cn } from '../utils/cn';
import { Dashboard } from '../components/Admin/Dashboard';
import { EventSettings } from '../components/Admin/EventSettings';
import { ChallengesManager } from '../components/Admin/ChallengesManager';
import { PhotosManager } from '../components/Admin/PhotosManager';
import { UsersManager } from '../components/Admin/UsersManager';
import styles from './Admin.module.css';

type Section = 'dashboard' | 'event' | 'challenges' | 'photos' | 'users';

const NAV: { key: Section; label: string; icon: string }[] = [
    { key: 'dashboard',  label: 'Dashboard',  icon: '📊' },
    { key: 'event',      label: 'Evento',      icon: '🎉' },
    { key: 'challenges', label: 'Retos',       icon: '🏆' },
    { key: 'photos',     label: 'Fotos',       icon: '📷' },
    { key: 'users',      label: 'Usuarios',    icon: '👥' },
];

const SECTIONS: Record<Section, React.ReactNode> = {
    dashboard:  <Dashboard />,
    event:      <EventSettings />,
    challenges: <ChallengesManager />,
    photos:     <PhotosManager />,
    users:      <UsersManager />,
};

const AdminPage = () => {
    const [active, setActive] = useState<Section>('dashboard');

    return (
        <>
            <Header />
            <div className={styles.layout}>
                <nav className={styles.sidebar}>
                    {NAV.map(({ key, label, icon }) => (
                        <button
                            key={key}
                            type="button"
                            className={cn(styles.navItem, active === key && styles.navItemActive)}
                            onClick={() => setActive(key)}
                        >
                            <span className={styles.navIcon}>{icon}</span>
                            <span className={styles.navLabel}>{label}</span>
                        </button>
                    ))}
                </nav>
                <main className={styles.content}>
                    {SECTIONS[active]}
                </main>
            </div>
        </>
    );
};

export { AdminPage };
