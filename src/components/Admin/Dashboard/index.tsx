import { useEffect, useState } from 'react';
import { Loader } from 'rsuite';
import { getStats, type AdminStats } from '../service';
import { logger } from '../../../utils/logger';
import styles from './Dashboard.module.css';

const CARDS = [
    { key: 'totalPhotos',         label: 'Fotos',                 icon: '📷' },
    { key: 'totalUsers',          label: 'Usuarios',              icon: '👥' },
    { key: 'totalComments',       label: 'Comentarios',           icon: '💬' },
    { key: 'totalParticipations', label: 'Participaciones retos', icon: '🏆' },
    { key: 'photosToday',         label: 'Fotos hoy',             icon: '🕐' },
] as const;

const Dashboard = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStats()
            .then(setStats)
            .catch((err: unknown) => logger.error('dashboard stats failed', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader center content="Cargando estadísticas..." />;

    return (
        <div className={styles.grid}>
            {CARDS.map(({ key, label, icon }) => (
                <div key={key} className={styles.card}>
                    <span className={styles.icon}>{icon}</span>
                    <span className={styles.value}>{stats?.[key] ?? 0}</span>
                    <span className={styles.label}>{label}</span>
                </div>
            ))}
        </div>
    );
};

export { Dashboard };
