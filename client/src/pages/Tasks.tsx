import { useEffect, useState } from 'react'
import { api, Task, Project } from '../api'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const PRIORITY_OPTIONS = ['low', 'medium', 'high']

const blank = (): Partial<Task> => ({
  title: '',
  dueDate: '',
  priority: 'medium',
  projectId: '',
})

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState<Partial<Task>>(blank())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getTasks(showDone ? undefined : { done: 'false' }),
      api.getProjects(),
    ])
      .then(([t, p]) => { setTasks(t); setProjects(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [showDone])

  const toggleDone = async (task: Task) => {
    await api.updateTask(task.id, { done: !task.done }).catch(() => {})
    load()
  }

  const openNew = () => {
    setForm(blank())
    setEditing(null)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (t: Task) => {
    setForm({
      title: t.title,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
      priority: t.priority,
      projectId: t.projectId || '',
    })
    setEditing(t)
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title?.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.updateTask(editing.id, form)
      } else {
        await api.createTask(form)
      }
      setModalOpen(false)
      load()
      setToast(editing ? 'Task updated!' : 'Task added!')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await api.deleteTask(deleteTarget).catch(() => {})
    setDeleteTarget(null)
    setToast('Task deleted.')
    load()
  }

  const set = (field: keyof Task, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }))

  const isOverdue = (t: Task) =>
    !t.done && t.dueDate && new Date(t.dueDate) < new Date()

  const priorityColor: Record<string, string> = {
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--success)',
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">✅ Tasks</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9em' }}>
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            Show completed
          </label>
          <button className="btn btn-primary" onClick={openNew}>
            + New Task
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ color: 'var(--success)', textAlign: 'center', padding: '3rem', fontWeight: 700, fontSize: '1.1em' }}>
          {showDone ? 'No tasks found.' : '🎉 Nothing left to do!'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {tasks.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                borderLeft: `4px solid ${priorityColor[t.priority] || 'var(--border)'}`,
                opacity: t.done ? 0.55 : 1,
              }}
            >
              {/* Big checkbox */}
              <button
                onClick={() => toggleDone(t)}
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  borderRadius: '50%',
                  border: `2px solid ${t.done ? 'var(--success)' : 'var(--border)'}`,
                  background: t.done ? 'var(--success)' : 'transparent',
                  color: '#fff',
                  fontSize: '1.3em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                title={t.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {t.done ? '✓' : ''}
              </button>

              <div style={{ flex: 1, minWidth: '150px' }}>
                <div style={{ fontWeight: 600, textDecoration: t.done ? 'line-through' : 'none' }}>
                  {t.title}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82em', marginTop: '0.2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {t.project && <span>🎨 {t.project.title}</span>}
                  {t.dueDate && (
                    <span style={{ color: isOverdue(t) ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isOverdue(t) ? 700 : 400 }}>
                      📅 {isOverdue(t) ? 'OVERDUE — ' : ''}{new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ minHeight: '40px', padding: '0.4rem 0.9rem' }} onClick={() => openEdit(t)}>
                  Edit
                </button>
                <button className="btn btn-danger" style={{ minHeight: '40px', padding: '0.4rem 0.9rem' }} onClick={() => setDeleteTarget(t.id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Task' : 'New Task'}>
        {error && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>
        )}

        <div className="form-group">
          <label className="label">Task *</label>
          <input className="input" value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="What needs to be done?" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.dueDate as string || ''} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Priority</label>
            <select className="input" value={form.priority || 'medium'} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Link to Project (optional)</label>
          <select className="input" value={form.projectId || ''} onChange={(e) => set('projectId', e.target.value)}>
            <option value="">— Standalone task —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        message="Delete this task? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}
