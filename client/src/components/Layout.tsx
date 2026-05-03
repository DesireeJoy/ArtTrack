import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

function useUnreadCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const load = async () => {
      try {
        const [gmail, fb] = await Promise.all([
          fetch('/api/gmail/unread-count').then((r) => r.json()).catch(() => ({ count: 0 })),
          fetch('/api/facebook/unread-count').then((r) => r.json()).catch(() => ({ count: 0 })),
        ])
        setCount((gmail.count || 0) + (fb.count || 0))
      } catch {
        // ignore
      }
    }
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [])
  return count
}

const NAV_ITEMS = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/projects',  icon: '🎨', label: 'Projects' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/tasks',     icon: '✅', label: 'Tasks' },
  { to: '/inbox',       icon: '📬', label: 'Inbox', badge: true },
  { to: '/shipping',    icon: '📦', label: 'Shipping' },
  { to: '/calculators', icon: '🧮', label: 'Calculators' },
  { to: '/settings',    icon: '⚙️', label: 'Settings' },
]

export default function Layout() {
  const { simpleMode, toggleSimpleMode } = useTheme()
  const unreadCount = useUnreadCount()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar — desktop */}
      <aside
        className="sidebar-desktop"
        style={{
          width: '220px',
          minWidth: '220px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          flexDirection: 'column',
          padding: '1.5rem 0.75rem',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          overflowY: 'auto',
        }}
      >
        <div style={{ paddingLeft: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--accent)', fontSize: '1.6em', fontWeight: 900, lineHeight: 1 }}>
            🎨 ArtTrack
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75em', marginTop: '0.25rem' }}>
            Illustration Manager
          </div>
        </div>

        <nav aria-label="Main navigation" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '1.2em', minWidth: '1.5rem', textAlign: 'center' }}>
                {item.icon}
              </span>
              {item.label}
              {item.badge && unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'var(--danger)',
                    color: '#fff',
                    borderRadius: '999px',
                    fontSize: '0.7em',
                    fontWeight: 800,
                    padding: '0.1rem 0.5rem',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleSimpleMode}
          className="btn btn-ghost"
          style={{ marginTop: '1rem', width: '100%', fontSize: '0.85em' }}
          title="Toggle between Simple and Full view"
        >
          {simpleMode ? '📋 Full View' : '🔲 Simple View'}
        </button>
      </aside>

      {/* Main content */}
      <main
        className="main-content"
        style={{ marginLeft: '220px', flex: 1, padding: '2rem', minHeight: '100vh' }}
      >
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav
        aria-label="Mobile navigation"
        className="bottom-nav-mobile"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-sidebar)',
          borderTop: '2px solid var(--border)',
          zIndex: 100,
          justifyContent: 'space-around',
          padding: '0.25rem 0',
        }}
      >
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            style={{
              flexDirection: 'column',
              fontSize: '0.6em',
              gap: '0.2rem',
              padding: '0.5rem 0.25rem',
              minHeight: '60px',
              width: '20%',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '1.8em', lineHeight: 1 }}>{item.icon}</span>
            {item.label}
            {item.badge && unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                background: 'var(--danger)',
                color: '#fff',
                borderRadius: '999px',
                fontSize: '1.4em',
                fontWeight: 800,
                padding: '0 0.3rem',
                minWidth: '18px',
                textAlign: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
