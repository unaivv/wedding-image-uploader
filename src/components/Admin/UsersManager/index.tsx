import { useEffect, useState } from 'react';
import { Image, Loader, Message, Toggle, useToaster } from 'rsuite';
import { getUsers, toggleAdmin, type AdminUser } from '../service';
import { auth } from '../../../utils/auth';
import { logger } from '../../../utils/logger';
import styles from './UsersManager.module.css';

const UsersManager = () => {
    const toaster = useToaster();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = auth.getUserId();

    useEffect(() => {
        getUsers()
            .then(setUsers)
            .catch((err: unknown) => logger.error('load users failed', err))
            .finally(() => setLoading(false));
    }, []);

    const handleToggleAdmin = (user: AdminUser) => {
        const next = !user.isAdmin;
        toggleAdmin(user._id, next)
            .then(updated => {
                setUsers(prev => prev.map(u => u._id === updated._id ? { ...u, isAdmin: updated.isAdmin } : u));
                toaster.push(
                    <Message type="success" showIcon closable>
                        {updated.name} {next ? 'es ahora admin' : 'ya no es admin'}
                    </Message>,
                    { placement: 'topEnd' }
                );
            })
            .catch((err: unknown) => {
                logger.error('toggle admin failed', err);
                toaster.push(<Message type="error" showIcon closable>Error al actualizar</Message>, { placement: 'topEnd' });
            });
    };

    if (loading) return <Loader center content="Cargando usuarios..." />;

    return (
        <div>
            <h2 className={styles.title}>Usuarios ({users.length})</h2>
            <div className={styles.table}>
                <div className={styles.thead}>
                    <span>Usuario</span>
                    <span>Email</span>
                    <span>Fotos</span>
                    <span>Admin</span>
                </div>
                {users.map(user => (
                    <div key={user._id} className={styles.row}>
                        <div className={styles.userCell}>
                            <Image src={user.picture} alt={user.name} circle style={{ width: 30, height: 30, flexShrink: 0 }} />
                            <span className={styles.name}>{user.name || user.fullName}</span>
                            {user._id === currentUserId && <span className={styles.youBadge}>tú</span>}
                        </div>
                        <span className={styles.email}>{user.email}</span>
                        <span className={styles.count}>{user.photoCount ?? 0}</span>
                        <Toggle
                            size="sm"
                            checked={user.isAdmin ?? false}
                            disabled={user._id === currentUserId}
                            onChange={() => handleToggleAdmin(user)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export { UsersManager };
