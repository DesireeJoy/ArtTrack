import { useEffect, useState } from 'react'
import { api, Customer } from '../api'
import Modal from '../components/Modal'

const CONTACT_OPTIONS = ['email', 'phone', 'messenger', 'instagram']

const blank = (): Partial<Customer> => ({
  name: '',
  email: '',
  phone: '',
  instagram: '',
  facebook: '',
  preferredContact: 'email',
  notes: '',
})

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<Partial<Customer>>(blank())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.getCustomers()
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm(blank())
    setEditing(null)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      instagram: c.instagram || '',
      facebook: c.facebook || '',
      preferredContact: c.preferredContact || 'email',
      notes: c.notes || '',
    })
    setEditing(c)
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name?.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.updateCustomer(editing.id, form)
      } else {
        await api.createCustomer(form)
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
    if (!confirm('Delete this customer? Their projects will remain.')) return
    await api.deleteCustomer(id).catch(() => {})
    load()
  }

  const set = (field: keyof Customer, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }))

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    )
  })

  const preferredIcon: Record<string, string> = {
    email: '📧',
    phone: '📞',
    messenger: '💬',
    instagram: '📸',
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Customers</h1>
        <button className="btn btn-primary" onClick={openNew}>
          + New Customer
        </button>
      </div>

      <div className="form-group" style={{ maxWidth: '400px' }}>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search by name, email, or phone…"
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          {search ? 'No customers match your search.' : 'No customers yet. Tap + New Customer to add one.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05em' }}>{c.name}</span>
                  {c.isVip && <span className="badge" style={{ background: 'gold', color: '#000' }}>⭐ VIP</span>}
                  {c._count && c._count.projects > 0 && (
                    <span className="badge" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
                      {c._count.projects} project{c._count.projects !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {c.email && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                      📧 <span style={{ userSelect: 'all' }}>{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                      📞 {c.phone}
                    </div>
                  )}
                  {c.instagram && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                      📸 @{c.instagram}
                    </div>
                  )}
                  {c.facebook && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                      💬 {c.facebook}
                    </div>
                  )}
                  {c.preferredContact && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82em' }}>
                      Prefers: {preferredIcon[c.preferredContact] || ''} {c.preferredContact}
                    </div>
                  )}
                </div>

                {c.notes && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85em', marginTop: '0.4rem', fontStyle: 'italic' }}>
                    {c.notes.length > 80 ? c.notes.slice(0, 80) + '…' : c.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ minHeight: '40px', padding: '0.4rem 0.9rem' }} onClick={() => openEdit(c)}>
                  Edit
                </button>
                <button className="btn btn-danger" style={{ minHeight: '40px', padding: '0.4rem 0.9rem' }} onClick={() => handleDelete(c.id)}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Customer' : 'New Customer'}
      >
        {error && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="label">Name *</label>
          <input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Full name" />
        </div>

        <div className="form-group">
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" />
        </div>

        <div className="form-group">
          <label className="label">Phone</label>
          <input className="input" type="tel" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 555-5555" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Instagram</label>
            <input className="input" value={form.instagram || ''} onChange={(e) => set('instagram', e.target.value)} placeholder="username (no @)" />
          </div>
          <div className="form-group">
            <label className="label">Facebook / Messenger</label>
            <input className="input" value={form.facebook || ''} onChange={(e) => set('facebook', e.target.value)} placeholder="Name or profile URL" />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Preferred Contact</label>
          <select className="input" value={form.preferredContact || 'email'} onChange={(e) => set('preferredContact', e.target.value)}>
            {CONTACT_OPTIONS.map((o) => (
              <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. Has 2 dogs: Max & Luna. Prefers PayPal." style={{ minHeight: '80px', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
