import { useEffect, useState } from 'react';
import { Button, Image, Loader, Message, Modal, useToaster } from 'rsuite';
import {
    getChallenges, createChallenge, updateChallenge, deleteChallenge, setWinner,
    type AdminChallenge, type AdminUser,
} from '../service';
import { Lightbox } from '../../Lightbox';
import { ConfirmModal } from '../../ConfirmModal';
import type { IPhoto } from '../../AllPhotos/types';
import { logger } from '../../../utils/logger';
import { cn } from '../../../utils/cn';
import styles from './ChallengesManager.module.css';

const EVENT_ID = import.meta.env.VITE_EVENT_ID as string;

const isExpired = (endDate: string) => new Date(endDate).getTime() <= Date.now();

const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const EMPTY_FORM = { title: '', description: '', topic: '', endDate: '' };

const participantToSlide = (p: AdminChallenge['participants'][number]): IPhoto => ({
    src: (p.file as unknown as { compressedSrc: string }).compressedSrc,
    fullSrc: (p.file as unknown as { fullSrc: string }).fullSrc,
    width: 1500,
    height: 1500,
    id: (p.file as unknown as { _id: string })._id,
    alt: p.user.name || p.user.email,
    user: { _id: p.user._id, name: p.user.name, email: p.user.email, picture: p.user.picture ?? '' },
    likedBy: [],
    caption: p.user.name || p.user.email,
});

const ChallengesManager = () => {
    const toaster = useToaster();
    const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<AdminChallenge | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    // Photos panel
    const [photosChallenge, setPhotosChallenge] = useState<AdminChallenge | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [pendingWinner, setPendingWinner] = useState<AdminUser | null>(null);
    const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

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
        setConfirm({
            message: '¿Eliminar este reto? Esta acción no se puede deshacer.',
            onConfirm: () => {
                setConfirm(null);
                deleteChallenge(id)
                    .then(() => setChallenges(prev => prev.filter(c => c._id !== id)))
                    .catch((err: unknown) => {
                        logger.error('delete challenge failed', err);
                        toaster.push(<Message type="error" showIcon closable>Error al eliminar</Message>, { placement: 'topEnd' });
                    });
            },
        });
    };

    const handleSetWinner = (challengeId: string, user: AdminUser) => {
        setConfirm({
            message: `¿Asignar a ${user.name || user.email} como ganador? Esta acción no se puede deshacer.`,
            onConfirm: () => {
                setConfirm(null);
                setSaving(true);
                setWinner(challengeId, user._id)
                    .then(updated => {
                        setChallenges(prev => prev.map(c => c._id === updated._id ? updated : c));
                        setPhotosChallenge(updated);
                        setPendingWinner(null);
                        toaster.push(<Message type="success" showIcon closable>🥇 Ganador asignado</Message>, { placement: 'topEnd' });
                    })
                    .catch((err: unknown) => {
                        logger.error('set winner failed', err);
                        toaster.push(<Message type="error" showIcon closable>Error al asignar ganador</Message>, { placement: 'topEnd' });
                    })
                    .finally(() => setSaving(false));
            },
        });
    };

    const slides = photosChallenge ? photosChallenge.participants.map(participantToSlide) : [];

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
                                <span className={cn(styles.chip, expired ? styles.chipExpired : styles.chipActive)}>
                                    {expired ? 'Expirado' : 'Activo'}
                                </span>
                                <span className={styles.meta}>{formatDate(c.endDate)} · {c.participants.length} participantes</span>
                                {c.winner && <span className={styles.winner}>🥇 {c.winner.name}</span>}
                            </div>
                            <div className={styles.rowActions}>
                                {c.participants.length > 0 && (
                                    <Button size="xs" appearance="ghost" onClick={() => { setPhotosChallenge(c); setLightboxIndex(-1); setPendingWinner(null); }}>
                                        Ver fotos
                                    </Button>
                                )}
                                <Button size="xs" appearance="subtle" onClick={() => openEdit(c)}>Editar</Button>
                                <Button size="xs" appearance="subtle" color="red" onClick={() => handleDelete(c._id)}>Eliminar</Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Photos panel modal */}
            <Modal open={!!photosChallenge} onClose={() => setPhotosChallenge(null)} size="lg">
                <Modal.Header>
                    <Modal.Title>{photosChallenge?.title} — Participantes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {photosChallenge && (
                        <div className={styles.participantsGrid}>
                            {photosChallenge.participants.map((p, i) => {
                                const file = p.file as unknown as { _id: string; compressedSrc: string };
                                const isWinner = photosChallenge.winner?._id === p.user._id;
                                return (
                                    <div
                                        key={p.user._id}
                                        className={cn(styles.participantCard, isWinner && styles.participantWinner)}
                                    >
                                        <button
                                            type="button"
                                            className={styles.participantThumb}
                                            onClick={() => setLightboxIndex(i)}
                                        >
                                            <img src={file.compressedSrc} alt={p.user.name} loading="lazy" />
                                            <span className={styles.thumbOverlay}>🔍</span>
                                        </button>
                                        <div className={styles.participantInfo}>
                                            <Image src={p.user.picture} alt={p.user.name} circle style={{ width: 24, height: 24, flexShrink: 0 }} />
                                            <span className={styles.participantName}>{p.user.name || p.user.email}</span>
                                            {isWinner && <span className={styles.winnerTag}>🥇</span>}
                                        </div>
                                        {!photosChallenge.winner && isExpired(photosChallenge.endDate) && (
                                            <Button
                                                size="xs"
                                                appearance="ghost"
                                                loading={saving && pendingWinner?._id === p.user._id}
                                                onClick={() => { setPendingWinner(p.user); handleSetWinner(photosChallenge._id, p.user); }}
                                                block
                                            >
                                                Asignar ganador
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="subtle" onClick={() => setPhotosChallenge(null)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            {/* Lightbox dentro del modal de fotos */}
            {lightboxIndex >= 0 && slides.length > 0 && (
                <Lightbox
                    slides={slides}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(-1)}
                    onIndexChange={setLightboxIndex}
                />
            )}

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

            <ConfirmModal
                open={confirm !== null}
                message={confirm?.message ?? ''}
                confirmLabel="Confirmar"
                danger
                onConfirm={() => confirm?.onConfirm()}
                onCancel={() => setConfirm(null)}
            />
        </div>
    );
};

export { ChallengesManager };
