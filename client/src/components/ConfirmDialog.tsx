interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '1rem',
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '380px' }}
      >
        <p style={{ margin: '0 0 1.5rem', fontSize: '1.05em', lineHeight: 1.6, color: 'var(--text-primary)' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel} style={{ minHeight: '52px', flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} style={{ minHeight: '52px', flex: 1 }}>
            🗑 {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
