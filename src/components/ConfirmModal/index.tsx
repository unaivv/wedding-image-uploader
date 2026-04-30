import { Modal, Button } from 'rsuite';

interface ConfirmModalProps {
    open: boolean;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal = ({
    open,
    message,
    confirmLabel = 'Confirmar',
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) => (
    <Modal open={open} onClose={onCancel} size="xs" backdrop="static">
        <Modal.Body style={{ paddingTop: '1.5rem' }}>{message}</Modal.Body>
        <Modal.Footer>
            <Button onClick={onCancel} appearance="subtle" disabled={loading}>
                Cancelar
            </Button>
            <Button
                onClick={onConfirm}
                appearance="primary"
                color={danger ? 'red' : undefined}
                loading={loading}
            >
                {confirmLabel}
            </Button>
        </Modal.Footer>
    </Modal>
);

export { ConfirmModal };
