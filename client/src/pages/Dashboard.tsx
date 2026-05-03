import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { api, Project, Task } from '../api'

function SimpleModeDashboard() {
  const navigate = useNavigate()

  const tiles = [
    { icon: '🎨', label: 'New Job', sub: 'Start a commission', color: 'var(--accent)', action: () => navigate('/projects?new=1') },
    { icon: '✅', label: 'My Tasks', sub: 'See what to do', color: 'var(--success)', action: () => navigate('/tasks') },
    { icon: '📬', label: 'Messages', sub: 'Gmail & Messenger', color: 'var(--info)', action: () => navigate('/inbox') },
    { icon: '📦', label: 'Shipping', sub: 'Track packages', color: 'var(--warning)', action: () => navigate('/shipping') },
  ]

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Good to see you! 👋</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
        {tiles.map((tile) => (
          <button
            key={tile.label}
            onClick={tile.action}
            className="card"
            style={{
              flexDirection: 'column',
              gap: '0.75rem',
              minHeight: '150px',
              cursor: 'pointer',
              border: `2px solid ${tile.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'transform 0.1s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)'
              e.currentTarget.style.boxShadow = `0 4px 20px ${tile.color}44`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = ''
            }}
          >
            <span style={{ fontSize: '2.5em', lineHeight: 1 }}>{tile.icon}</span>
            <span style={{ color: tile.color, fontWeight: 800, fontSize: '1.1em' }}>{tile.label}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8em' }}>{tile.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function FullDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.getProjects(), api.getTasks({ done: 'false' })])
      .then(([p, t]) => {
        setProjects(p.filter((x) => x.status !== 'complete').slice(0, 8))
        setTasks(t.filter((task) => task.dueDate && new Date(task.dueDate) < new Date()))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading...</div>
  }

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Active Projects */}
        <div>
          <h3
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              fontSize: '0.85em',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Active Projects ({projects.length})
          </h3>
          {projects.length === 0 ? (
            <div className="card" style={{ color: 'var(--text-muted)' }}>
              No active projects yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="card"
                  onClick={() => navigate('/projects')}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span>
                  </div>
                  {p.customer && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85em', marginTop: '0.25rem' }}>
                      {p.customer.name}
                    </div>
                  )}
                  {p.deadline && (
                    <div style={{ color: 'var(--warning)', fontSize: '0.82em', marginTop: '0.3rem' }}>
                      Due {new Date(p.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div>
          <h3
            style={{
              color: tasks.length > 0 ? 'var(--danger)' : 'var(--text-secondary)',
              marginBottom: '1rem',
              fontSize: '0.85em',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Overdue Tasks ({tasks.length})
          </h3>
          {tasks.length === 0 ? (
            <div className="card" style={{ color: 'var(--success)', fontWeight: 600 }}>
              All caught up! 🎉
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="card"
                  onClick={() => navigate('/tasks')}
                  style={{ cursor: 'pointer', borderColor: 'var(--danger)' }}
                >
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  {t.project && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>{t.project.title}</div>
                  )}
                  <div style={{ color: 'var(--danger)', fontSize: '0.82em', marginTop: '0.25rem' }}>
                    Was due {new Date(t.dueDate!).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { simpleMode } = useTheme()
  return simpleMode ? <SimpleModeDashboard /> : <FullDashboard />
}
