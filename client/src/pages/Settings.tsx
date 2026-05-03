import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme, Theme, FontSize, FontFamily } from '../contexts/ThemeContext'

const THEMES: { value: Theme; label: string; preview: string }[] = [
  { value: 'dark',      label: 'Dark',               preview: '#0f0f1a' },
  { value: 'light',     label: 'Light',              preview: '#f5f5ff' },
  { value: 'hc-black',  label: 'High Contrast Black', preview: '#000000' },
  { value: 'hc-yellow', label: 'High Contrast Yellow', preview: '#ffff00' },
]

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'Normal (17px)' },
  { value: 'large',  label: 'Large (21px) — Default' },
  { value: 'xl',     label: 'Extra Large (26px)' },
]

export default function Settings() {
  const { theme, setTheme, fontSize, setFontSize, fontFamily, setFontFamily, simpleMode, toggleSimpleMode } = useTheme()

  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailEmail, setGmailEmail] = useState('')
  const [fbConnected, setFbConnected] = useState(false)
  const [fbPageName, setFbPageName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/gmail/status').then((r) => r.json()).catch(() => ({})),
      fetch('/api/facebook/status').then((r) => r.json()).catch(() => ({})),
    ]).then(([gmail, fb]) => {
      setGmailConnected(!!gmail.connected)
      setGmailEmail(gmail.email || '')
      setFbConnected(!!fb.connected)
      setFbPageName(fb.pageName || '')
    })
  }, [])

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>⚙️ Settings</h1>

      {/* Connections */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1em', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Connections
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Gmail */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600 }}>📧 Gmail</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82em' }}>
                {gmailConnected ? gmailEmail || 'Connected' : 'Not connected'}
              </div>
            </div>
            {gmailConnected ? (
              <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9em' }}>✓ Connected</span>
            ) : (
              <Link to="/setup" className="btn btn-ghost" style={{ textDecoration: 'none', minHeight: '40px', padding: '0.4rem 1rem', fontSize: '0.88em' }}>
                Connect →
              </Link>
            )}
          </div>
          {/* Facebook */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600 }}>💬 Facebook Messenger</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82em' }}>
                {fbConnected ? fbPageName || 'Connected' : 'Not connected'}
              </div>
            </div>
            {fbConnected ? (
              <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9em' }}>✓ Connected</span>
            ) : (
              <Link to="/setup-facebook" className="btn btn-ghost" style={{ textDecoration: 'none', minHeight: '40px', padding: '0.4rem 1rem', fontSize: '0.88em' }}>
                Connect →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* View Mode */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1em', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Home Screen View
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88em', marginTop: 0, marginBottom: '1rem' }}>
          Changes how the <strong>Home</strong> screen looks.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${simpleMode ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, minHeight: '56px', flexDirection: 'column', gap: '0.2rem' }}
            onClick={() => { if (!simpleMode) toggleSimpleMode() }}
            aria-pressed={simpleMode}
          >
            <span style={{ fontSize: '1.4em' }}>🔲</span>
            <span>Simple{simpleMode ? ' ✓' : ''}</span>
            <span style={{ fontSize: '0.72em', opacity: 0.8 }}>4 big buttons</span>
          </button>
          <button
            className={`btn ${!simpleMode ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, minHeight: '56px', flexDirection: 'column', gap: '0.2rem' }}
            onClick={() => { if (simpleMode) toggleSimpleMode() }}
            aria-pressed={!simpleMode}
          >
            <span style={{ fontSize: '1.4em' }}>📋</span>
            <span>Full{!simpleMode ? ' ✓' : ''}</span>
            <span style={{ fontSize: '0.72em', opacity: 0.8 }}>Projects & tasks</span>
          </button>
        </div>
        {simpleMode !== undefined && (
          <p style={{ color: 'var(--success)', fontSize: '0.82em', margin: '0.75rem 0 0' }}>
            Currently: <strong>{simpleMode ? 'Simple' : 'Full'} mode</strong> — go to Home to see it.
          </p>
        )}
      </div>

      {/* Theme */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1em', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Color Theme
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              aria-pressed={theme === t.value}
              style={{
                border: `3px solid ${theme === t.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                background: t.preview,
                color: t.value === 'hc-yellow' ? '#000' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: theme === t.value ? 700 : 400,
                fontSize: '0.9em',
                minHeight: '52px',
              }}
            >
              {theme === t.value && <span>✓</span>}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1em', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Text Size
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {FONT_SIZES.map((f) => (
            <button
              key={f.value}
              className={`btn ${fontSize === f.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFontSize(f.value)}
              aria-pressed={fontSize === f.value}
              style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
            >
              {fontSize === f.value && <span>✓</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1em', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Font Style
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${fontFamily === 'default' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFontFamily('default' as FontFamily)}
            aria-pressed={fontFamily === 'default'}
          >
            {fontFamily === 'default' ? '✓ ' : ''}Standard Font
          </button>
          <button
            className={`btn ${fontFamily === 'dyslexic' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFontFamily('dyslexic' as FontFamily)}
            aria-pressed={fontFamily === 'dyslexic'}
            style={{ fontFamily: "'Comic Sans MS', cursive" }}
          >
            {fontFamily === 'dyslexic' ? '✓ ' : ''}Dyslexia-Friendly Font
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="card" style={{ borderColor: 'var(--accent)' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1em', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Preview
        </h2>
        <p style={{ margin: 0 }}>This is how your text looks right now.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85em', margin: '0.5rem 0 0' }}>
          Changes are saved automatically and remembered next time.
        </p>
      </div>
    </div>
  )
}
