import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, Project, Customer } from '../api'
import Modal from '../components/Modal'

const STATUS_OPTIONS = ['inquiry', 'quoted', 'paid', 'in_progress', 'awaiting_approval', 'shipped', 'complete']
const TYPE_OPTIONS = ['pet_portrait', 'commission', 'holiday_card', 'landscape', 'other']

const STATUS_LABELS: Record<string, string> = {
  inquiry: 'Inquiry',
  quoted: 'Quoted',
  paid: 'Paid',
  in_progress: 'In Progress',
  awaiting_approval: 'Awaiting Approval',
  shipped: 'Shipped',
  complete: 'Complete',
}

const blank = (): Partial<Project> => ({
  title: '',
  type: 'pet_portrait',
  status: 'inquiry',
  deadline: '',
  price: undefined,
  depositPaid: 0,
  notes: '',
  customerId: '',
})

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState<Partial<Project>>(blank())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setForm(blank())
      setEditing(null)
      setModalOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getProjects(filterStatus ? { status: filterStatus } : undefined),
      api.getCustomers(),
    ])
      .then(([p, c]) => {
        setProjects(p)
        setCustomers(c)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [filterStatus])

  const openNew = () => {
    setForm(blank())
    setEditing(null)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p: Project) => {
    setForm({
      title: p.title,
      type: p.type,
      status: p.status,
      deadline: p.deadline ? p.deadline.slice(0, 10) : '',
      price: p.price,
      depositPaid: p.depositPaid,
      notes: p.notes || '',
      customerId: p.customerId || '',
    })
    setEditing(p)
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title?.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.updateProject(editing.id, form)
      } else {
        await api.createProject(form)
      }
      setModalOpen(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    await api.deleteProject(id).catch(() => {})
    load()
  }

  const set = (field: keyof Project, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🎨 Projects</h1>
        <button className="btn btn-primary" onClick={openNew}>
          + New Project
        </button>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s || 'all'}
            className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: '40px', padding: '0.4rem 0.9rem', fontSize: '0.85em' }}
            onClick={() => setFilterStatus(s)}
          >
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          No projects yet. Tap <strong>+ New Project</strong> to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {projects.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05em' }}>{p.title}</span>
                  <span className={`badge badge-${p.status}`}>{STATUS_LABELS[p.status] || p.status}</span>
                </div>
                {p.customer && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9em', marginTop: '0.3rem' }}>
                    👤 {p.customer.name}
                    {p.customer.email && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{p.customer.email}</span>
                    )}
                  </div>
                )}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82em', marginTop: '0.4rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>📁 {p.type.replace('_', ' ')}</span>
                  {p.deadline && <span>📅 Due {new Date(p.deadline).toLocaleDateString()}</span>}
                  {p.price != null && <span>💰 ${p.price.toFixed(2)}</span>}
                  {p._count && <span>✅ {p._count.tasks} tasks</span>}
                </div>
                {p.notes && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85em', marginTop: '0.4rem', fontStyle: 'italic' }}>
                    {p.notes.length > 100 ? p.notes.slice(0, 100) + '…' : p.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ minHeight: '40px', padding: '0.4rem 0.9rem' }} onClick={() => openEdit(p)}>
                  Edit
                </button>
                <button className="btn btn-danger" style={{ minHeight: '40px', padding: '0.4rem 0.9rem' }} onClick={() => handleDelete(p.id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Project' : 'New Project'}
      >
        {error && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="label">Project Title *</label>
          <input className="input" value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Portrait of Max the Golden" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Type</label>
            <select className="input" value={form.type || 'pet_portrait'} onChange={(e) => set('type', e.target.value)}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.status || 'inquiry'} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Customer</label>
          <select className="input" value={form.customerId || ''} onChange={(e) => set('customerId', e.target.value)}>
            <option value="">— No customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Deadline</label>
            <input className="input" type="date" value={form.deadline as string || ''} onChange={(e) => set('deadline', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Price ($)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.price ?? ''} onChange={(e) => set('price', e.target.value ? Number(e.target.value) : undefined)} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="label">Deposit Paid ($)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.depositPaid ?? 0} onChange={(e) => set('depositPaid', Number(e.target.value))} placeholder="0.00" />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="Any details about this project..." style={{ minHeight: '80px', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
