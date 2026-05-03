import { useEffect, useRef, useState } from 'react'
import { api, Shipment, Project } from '../api'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

// Detect carrier from tracking number format
function detectCarrier(tn: string): string {
  const t = tn.replace(/\s/g, '').toUpperCase()
  if (/^1Z[0-9A-Z]{16}$/.test(t)) return 'UPS'
  if (/^(94|93|92|91|90)[0-9]{18,20}$/.test(t)) return 'USPS'
  if (/^[0-9]{12,22}$/.test(t)) return 'FedEx'
  if (/^[0-9]{10,11}$/.test(t)) return 'DHL'
  return ''
}

function trackingUrl(carrier: string, tn: string): string | null {
  const t = encodeURIComponent(tn)
  const c = carrier.toUpperCase()
  if (c === 'UPS') return `https://www.ups.com/track?tracknum=${t}`
  if (c === 'USPS') return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`
  if (c === 'FEDEX') return `https://www.fedex.com/fedextrack/?trknbr=${t}`
  if (c === 'DHL') return `https://www.dhl.com/en/express/tracking.html?AWB=${t}`
  return null
}

const STATUS_OPTIONS = ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'issue']
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  issue: '⚠️ Issue',
}

const blank = (): Partial<Shipment> => ({
  carrier: '',
  trackingNumber: '',
  recipientName: '',
  address: '',
  status: 'pending',
  projectId: '',
})

export default function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Shipment | null>(null)
  const [form, setForm] = useState<Partial<Shipment>>(blank())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [ocrWarning, setOcrWarning] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.getShipments(), api.getProjects()])
      .then(([s, p]) => { setShipments(s); setProjects(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm(blank())
    setEditing(null)
    setError('')
    setOcrWarning('')
    setModalOpen(true)
  }

  const openEdit = (s: Shipment) => {
    setForm({
      carrier: s.carrier || '',
      trackingNumber: s.trackingNumber || '',
      recipientName: s.recipientName || '',
      address: s.address || '',
      status: s.status,
      projectId: s.projectId || '',
    })
    setEditing(s)
    setError('')
    setOcrWarning('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.updateShipment(editing.id, form)
      } else {
        await api.createShipment(form)
      }
      setModalOpen(false)
      load()
      setToast(editing ? 'Shipment updated!' : 'Shipment added!')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await api.deleteShipment(deleteTarget).catch(() => {})
    setDeleteTarget(null)
    setToast('Shipment deleted.')
    load()
  }

  const set = (field: keyof Shipment, value: unknown) => {
    setForm((f) => {
      const updated = { ...f, [field]: value }
      if (field === 'trackingNumber' && typeof value === 'string') {
        const detected = detectCarrier(value)
        if (detected && !f.carrier) updated.carrier = detected
      }
      return updated
    })
  }

  // OCR via Tesseract loaded dynamically so we don't ship it unless needed
  const handleScanLabel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setOcrWarning('')
    try {
      // @ts-expect-error Tesseract loaded via CDN at runtime
      const Tesseract = window.Tesseract
      if (!Tesseract) {
        setOcrWarning('OCR library not loaded. Make sure you are online the first time.')
        setScanning(false)
        return
      }
      const { data } = await Tesseract.recognize(file, 'eng', { logger: () => {} })
      const text: string = data.text

      // Extract tracking number
      const tnMatch = text.match(/\b(1Z[0-9A-Z]{16}|[0-9]{20,22}|[0-9]{12,15})\b/)
      const tn = tnMatch ? tnMatch[0] : ''
      const carrier = tn ? detectCarrier(tn) : ''

      // Extract recipient name (line after "SHIP TO" or "TO:")
      const recipientMatch = text.match(/(?:SHIP\s*TO|TO\s*:?)\s*\n+(.+)/i)
      const recipient = recipientMatch ? recipientMatch[1].trim() : ''

      // Grab a few lines as address
      const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean)
      const tnLineIdx = lines.findIndex((l: string) => l.includes(tn))
      const addrLines = tnLineIdx >= 0
        ? lines.slice(Math.max(0, tnLineIdx - 4), tnLineIdx).join(', ')
        : ''

      const warnings: string[] = []
      if (!tn) warnings.push('tracking number')
      if (!recipient) warnings.push('recipient name')
      if (warnings.length) setOcrWarning(`Could not read: ${warnings.join(', ')} — please fill in highlighted fields.`)

      setForm((f) => ({
        ...f,
        trackingNumber: tn || f.trackingNumber,
        carrier: carrier || f.carrier,
        recipientName: recipient || f.recipientName,
        address: addrLines || f.address,
        rawLabelText: text,
      }))
    } catch {
      setOcrWarning('Could not read the image. Try a clearer photo.')
    } finally {
      setScanning(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const statusColor: Record<string, string> = {
    pending: 'var(--info)',
    in_transit: 'var(--warning)',
    out_for_delivery: 'var(--accent)',
    delivered: 'var(--success)',
    issue: 'var(--danger)',
  }

  return (
    <div>
      {/* Load Tesseract from CDN on first visit */}
      <script
        dangerouslySetInnerHTML={{
          __html: `if(!window.Tesseract){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';document.head.appendChild(s);}`,
        }}
      />

      <div className="page-header">
        <h1 className="page-title">📦 Shipping</h1>
        <button className="btn btn-primary" onClick={openNew}>
          + New Shipment
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : shipments.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          No shipments yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {shipments.map((s) => {
            const url = s.trackingNumber && s.carrier ? trackingUrl(s.carrier, s.trackingNumber) : null
            return (
              <div key={s.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{s.recipientName || 'Unknown Recipient'}</span>
                    <span
                      className="badge"
                      style={{ background: statusColor[s.status] || 'var(--border)', color: '#fff' }}
                    >
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </div>
                  {s.address && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85em', marginTop: '0.3rem' }}>
                      📍 {s.address}
                    </div>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82em', marginTop: '0.4rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {s.carrier && <span>🚚 {s.carrier}</span>}
                    {s.trackingNumber && url ? (
                      <>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'monospace' }}>
                          {s.trackingNumber} 🔗
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(s.trackingNumber!)}
                          className="btn btn-ghost"
                          style={{ minHeight: '28px', padding: '0.1rem 0.5rem', fontSize: '0.78em' }}
                          title="Copy tracking number"
                        >
                          📋 Copy
                        </button>
                      </>
                    ) : s.trackingNumber ? (
                      <>
                        <span style={{ fontFamily: 'monospace' }}>{s.trackingNumber}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(s.trackingNumber!)}
                          className="btn btn-ghost"
                          style={{ minHeight: '28px', padding: '0.1rem 0.5rem', fontSize: '0.78em' }}
                          title="Copy tracking number"
                        >
                          📋 Copy
                        </button>
                      </>
                    ) : null}
                    {s.project && <span>🎨 {s.project.title}</span>}
                    {s.shipDate && <span>📅 {new Date(s.shipDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button className="btn btn-ghost" style={{ minHeight: '40px', padding: '0.4rem 0.9rem' }} onClick={() => openEdit(s)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" style={{ minHeight: '40px', padding: '0.4rem 0.9rem' }} onClick={() => setDeleteTarget(s.id)}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Shipment' : 'New Shipment'}>
        {error && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>
        )}

        {/* Scan Label button */}
        {!editing && (
          <div className="form-group">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleScanLabel} />
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '1.05em', minHeight: '60px' }}
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
            >
              {scanning ? '⏳ Reading label…' : '📷 Scan Shipping Label'}
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8em', marginTop: '0.4rem', textAlign: 'center' }}>
              Take a photo or upload an image — fields will auto-fill
            </div>
            {ocrWarning && (
              <div style={{ background: 'var(--warning)', color: '#000', padding: '0.6rem', borderRadius: '0.4rem', marginTop: '0.5rem', fontSize: '0.85em' }}>
                ⚠️ {ocrWarning}
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="label">Recipient Name</label>
          <input className="input" value={form.recipientName || ''} onChange={(e) => set('recipientName', e.target.value)} placeholder="Who is this going to?" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Carrier</label>
            <select className="input" value={form.carrier || ''} onChange={(e) => set('carrier', e.target.value)}>
              <option value="">— Auto-detect —</option>
              {['UPS', 'USPS', 'FedEx', 'DHL'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" style={{ color: !form.trackingNumber && ocrWarning ? 'var(--warning)' : undefined }}>
              Tracking Number {!form.trackingNumber && ocrWarning ? '⚠️' : ''}
            </label>
            <input
              className="input"
              value={form.trackingNumber || ''}
              onChange={(e) => set('trackingNumber', e.target.value)}
              placeholder="Enter or scan label"
              style={{ borderColor: !form.trackingNumber && ocrWarning ? 'var(--warning)' : undefined }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Address</label>
          <textarea className="input" rows={2} value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Shipping address" style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.status || 'pending'} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Link to Project</label>
            <select className="input" value={form.projectId || ''} onChange={(e) => set('projectId', e.target.value)}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Shipment'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        message="Delete this shipment? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}
