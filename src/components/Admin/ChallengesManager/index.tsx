import { useEffect, useState } from 'react';
import { Button, Loader, Message, Modal, SelectPicker, useToaster } from 'rsuite';
import {
    getChallenges, createChallenge, updateChallenge, deleteChallenge, setWinner,
    type AdminChallenge,
} from '../service';
import { logger } from '../../../utils/logger';
import styles from './ChallengesManager.module.css';

const EVENT_ID = import.meta.env.VITE_EVENT_ID as string;

const isExpired = (endDate: string) => new Date(endDate).getTime() <= Date.now();

const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const EMPTY_FORM = { title: '', description: '', topic: '', endDate: '' };

const ChallengesManager = () => {
    const toaster = useToaster();
    const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<AdminChallenge | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [winnerModal, setWinnerModal] = useState<AdminChallenge | null>(null);
    const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        getChallenges(EVENT_ID)
            .then(setChallenges)
            .catch((err: unknown) => logger.error('load challenges failed', err))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };

    const openEdit = (c: AdminChallenge) => {
        setEditing(c);
        setForm({
            title: c.title,
            description: c.description ?? '',
            topic: c.topic ?? '',
            endDate: c.endDate ? c.endDate.slice(0, 16) : '',
        });
        setModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const promise = editing
            ? updateChallenge(editing._id, { ...form, endDate: new Date(form.endDate).toISOString() })
            : createChallenge({ ...form, endDate: new Date(form.endDate).toISOString(), eventId: EVENT_ID });
        promise
            .then(updated => {
                setChallenges(prev =>
                    editing
                        ? prev.map(c => c._id === updated._id ? updated : c)
                        : [updated, ...prev]
                );
                setModalOpen(false);
                toaster.push(<Message type="success" showIcon closable>{editing ? 'Reto actualizado' : 'Reto creado'}</Message>, { placement: 'topEnd' });
            })
            .catch((err: unknown) => {
                logger.error('save challenge failed', err);
                toaster.push(<Message type="error" showIcon closable>Error al guardar</Message>, { placement: 'topEnd' });
            })
            .finally(() => setSaving(false));
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('¿Eliminar este reto?')) return;
        deleteChallenge(id)
            .then(() => setChallenges(prev => prev.filter(c => c._id !== id)))
            .catch((err: unknown) => {
                logger.error('delete challenge failed', err);
                toaster.push(<Message type="error" showIcon closable>Error al eliminar</Message>, { placement: 'topEnd' });
            });
    };

    const handleSetWinner = () => {
        if (!winnerModal || !selectedWinner) return;
        setSaving(true);
        setWinner(winnerModal._id, selectedWinner)
            .then(updated => {
                setChallenges(prev => prev.map(c => c._id === updated._id ? updated : c));
                setWinnerModal(null);
                setSelectedWinner(null);
                toaster.push(<Message type="success" showIcon closable>Ganador asignado</Message>, { placement: 'topEnd' });
            })
            .catch((err: unknown) => {
                logger.error('set winner failed', err);
                toaster.push(<Message type="error" showIcon closable>Error al asignar ganador</Message>, { placement: 'topEnd' });
            })
            .finally(() => setSaving(false));
    };

    if (loading) return <Loader center content="Cargando retos..." />;

    return (
        <div>
            <div className={styles.toolbar}>
                <h2 className={styles.title}>Retos fotográficos</h2>
                <Button appearance="primary" size="sm" onClick={openCreate}>+ Nuevo reto</Button>
            </div>

            {challenges.length === 0 && <p className={styles.empty}>No hay retos todavía.</p>}

            <div className={styles.list}>
                {challenges.map(c => {
                    const expired = isExpired(c.endDate);
                    return (
                        <div key={c._id} className={styles.row}>
                            <div className={styles.rowInfo}>
                                <span className={styles.rowTitle}>{c.title}</span>
                                {c.topic && <span className={styles.chip}>{c.topic}</span>}
                                <span className={`${styles.chip} ${expired ? styles.chipExpired : styles.chipActive}`}>
                                    {expired ? 'Expirado' : 'Activo'}
                                </span>
                                <span className={styles.meta}>{formatDate(c.endDate)} · {c.participants.length} participantes</span>
                                {c.winner && <span className={styles.winner}>🥇 {c.winner.name}</span>}
                            </div>
                            <div className={styles.rowActions}>
                                {expired && !c.winner && c.participants.length > 0 && (
                                    <Button size="xs" appearance="ghost" onClick={() => { setWinnerModal(c); setSelectedWinner(null); }}>
                                        Ganador
                                    </Button>
                                )}
                                <Button size="xs" appearance="subtle" onClick={() => openEdit(c)}>Editar</Button>
                                <Button size="xs" appearance="subtle" color="red" onClick={() => handleDelete(c._id)}>Eliminar</Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create / Edit modal */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="sm">
                <Modal.Header>
                    <Modal.Title>{editing ? 'Editar reto' : 'Nuevo reto'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form id="challenge-form" className={styles.form} onSubmit={handleSave}>
                        <label className={styles.label}>
                            Título *
                            <input className={styles.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                        </label>
                        <label className={styles.label}>
                            Descripción
                            <textarea className={styles.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                        </label>
                        <label className={styles.label}>
                            Tema
                            <input className={styles.input} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
                        </label>
                        <label className={styles.label}>
                            Fecha límite *
                            <input type="datetime-local" className={styles.input} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
                        </label>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" type="submit" form="challenge-form" loading={saving}>Guardar</Button>
                    <Button appearance="subtle" onClick={() => setModalOpen(false)}>Cancelar</Button>
                </Modal.Footer>
            </Modal>

            {/* Winner modal */}
            <Modal open={!!winnerModal} onClose={() => setWinnerModal(null)} size="xs">
                <Modal.Header><Modal.Title>Asignar ganador</Modal.Title></Modal.Header>
                <Modal.Body>
                    <SelectPicker
                        data={(winnerModal?.participants ?? []).map(p => ({
                            label: p.user.name || p.user.email,
                            value: p.user._id,
                        }))}
                        value={selectedWinner}
                        onChange={setSelectedWinner}
                        placeholder="Selecciona un participante"
                        block
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" onClick={handleSetWinner} loading={saving} disabled={!selectedWinner}>Asignar</Button>
                    <Button appearance="subtle" onClick={() => setWinnerModal(null)}>Cancelar</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export { ChallengesManager };
