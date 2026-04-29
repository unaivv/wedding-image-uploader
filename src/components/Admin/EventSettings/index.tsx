import { useEffect, useState } from 'react';
import { Button, Loader, Message, useToaster } from 'rsuite';
import { getEvent, updateEvent, type AdminEvent } from '../service';
import { logger } from '../../../utils/logger';
import styles from './EventSettings.module.css';

const EventSettings = () => {
    const toaster = useToaster();
    const eventId = import.meta.env.VITE_EVENT_ID as string;
    const [event, setEvent] = useState<AdminEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', date: '', location: '', description: '' });

    useEffect(() => {
        getEvent(eventId)
            .then(e => {
                setEvent(e);
                setForm({
                    name: e.name,
                    date: e.date ? e.date.slice(0, 10) : '',
                    location: e.location,
                    description: e.description ?? '',
                });
            })
            .catch((err: unknown) => logger.error('load event failed', err))
            .finally(() => setLoading(false));
    }, [eventId]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        updateEvent(eventId, { ...form, date: new Date(form.date).toISOString() })
            .then(updated => {
                setEvent(updated);
                toaster.push(<Message type="success" showIcon closable>Evento actualizado</Message>, { placement: 'topEnd' });
            })
            .catch((err: unknown) => {
                logger.error('update event failed', err);
                toaster.push(<Message type="error" showIcon closable>Error al guardar</Message>, { placement: 'topEnd' });
            })
            .finally(() => setSaving(false));
    };

    if (loading) return <Loader center content="Cargando evento..." />;
    if (!event) return <p>No se encontró el evento.</p>;

    return (
        <form className={styles.form} onSubmit={handleSave}>
            <h2 className={styles.title}>Configuración del evento</h2>
            <label className={styles.label}>
                Nombre
                <input
                    className={styles.input}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                />
            </label>
            <label className={styles.label}>
                Fecha
                <input
                    type="date"
                    className={styles.input}
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                />
            </label>
            <label className={styles.label}>
                Lugar
                <input
                    className={styles.input}
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    required
                />
            </label>
            <label className={styles.label}>
                Descripción
                <textarea
                    className={styles.textarea}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                />
            </label>
            <Button appearance="primary" type="submit" loading={saving}>Guardar cambios</Button>
        </form>
    );
};

export { EventSettings };
