import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onDone: () => void
}

export default function Toast({ message, type = 'success', onDone }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(onDone, 300)
      return () => clearTimeout(t)
    }
  }, [visible, onDone])

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '5rem',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : '120%'})`,
        transition: 'transform 0.3s ease',
        background: type === 'success' ? 'var(--success)' : 'var(--danger)',
        color: '#fff',
        padding: '0.85rem 1.5rem',
        borderRadius: '2rem',
        fontWeight: 700,
        fontSize: '1em',
        zIndex: 2000,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
    >
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  )
}
