import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type Step = 'welcome' | 'credentials' | 'done'

export default function SetupFacebook() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('welcome')
  const [pageId, setPageId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pageName, setPageName] = useState('')

  // Already connected? Go to inbox.
  useEffect(() => {
    fetch('/api/facebook/status')
      .then((r) => r.json())
      .then((s) => { if (s.connected) navigate('/inbox') })
      .catch(() => {})
  }, [navigate])

  const handleConnect = async () => {
    if (!pageId.trim() || !accessToken.trim()) {
      setError('Please fill in both fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/facebook/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: pageId.trim(), accessToken: accessToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not connect — double-check your Page ID and token.')
        return
      }
      setPageName(data.pageName)
      setStep('done')
    } catch {
      setError('Network error — make sure the app server is running.')
    } finally {
      setLoading(false)
    }
  }

  const STEPS: { key: Step; label: string }[] = [
    { key: 'welcome', label: 'Intro' },
    { key: 'credentials', label: 'Connect' },
    { key: 'done', label: 'Done' },
  ]
  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1rem',
      }}
    >
      {/* Progress dots */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '2.5rem',
          alignItems: 'center',
        }}
      >
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: i <= stepIndex ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
            <span style={{ fontSize: '0.7em', color: i <= stepIndex ? 'var(--accent)' : 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem' }}>
        {/* ── Step 1: Welcome ─────────────────────────────────── */}
        {step === 'welcome' && (
          <div>
            <div style={{ fontSize: '3em', textAlign: 'center', marginBottom: '1rem' }}>💬</div>
            <h1
              style={{
                color: 'var(--text-primary)',
                textAlign: 'center',
                marginBottom: '1rem',
                fontSize: '1.5em',
              }}
            >
              Connect Facebook Messenger
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              When customers message your Facebook business page, they'll show up right here in your Inbox — just like emails.
            </p>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: '1.25rem', marginBottom: '2rem' }}>
              <li>Commission inquiries are spotted automatically</li>
              <li>One tap to turn a message into a project</li>
              <li>You'll see a badge when new messages arrive</li>
            </ul>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82em', marginBottom: '2rem' }}>
              You'll need your Facebook Page ID and a Page Access Token — we'll walk you through it.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '56px', fontSize: '1.05em' }}
              onClick={() => setStep('credentials')}
            >
              Let's Do It →
            </button>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '0.75rem', minHeight: '48px' }}
              onClick={() => navigate('/settings')}
            >
              Maybe Later
            </button>
          </div>
        )}

        {/* ── Step 2: Credentials ─────────────────────────────── */}
        {step === 'credentials' && (
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Enter Your Page Credentials</h2>

            <div
              style={{
                background: 'var(--bg-raised)',
                borderRadius: '0.5rem',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.88em',
                lineHeight: 1.8,
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>How to get these:</strong>
              <ol style={{ paddingLeft: '1.25rem', margin: '0.75rem 0 0' }}>
                <li>
                  Go to{' '}
                  <strong>developers.facebook.com</strong> and log in
                </li>
                <li>Click <strong>My Apps → Create App</strong></li>
                <li>Choose <strong>Business</strong> and give it any name</li>
                <li>In the app dashboard, add the <strong>Messenger</strong> product</li>
                <li>Under <strong>Messenger → Settings</strong>, scroll to <em>Access Tokens</em></li>
                <li>Select your business page and click <strong>Generate Token</strong></li>
                <li>Copy the <strong>Page ID</strong> (shown below the page name) and the <strong>Access Token</strong></li>
              </ol>
              <div
                style={{
                  background: 'var(--bg-base)',
                  borderRadius: '0.35rem',
                  padding: '0.6rem 0.9rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                  marginTop: '1rem',
                  color: 'var(--text-muted)',
                }}
              >
                💡 For a token that doesn't expire, follow Meta's guide to convert it to a long-lived token.
              </div>
            </div>

            <label className="label">Facebook Page ID</label>
            <input
              className="input"
              style={{ marginBottom: '1rem' }}
              type="text"
              placeholder="e.g. 123456789012345"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              autoComplete="off"
            />

            <label className="label">Page Access Token</label>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                className="input"
                type={showToken ? 'text' : 'password'}
                placeholder="EAAxxxxxx..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                autoComplete="off"
                style={{ paddingRight: '3.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1.2em',
                }}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? '🙈' : '👁'}
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8em', marginBottom: '1.5rem' }}>
              🔒 Stored locally on this computer only — never sent anywhere else.
            </p>

            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid var(--danger)',
                  borderRadius: '0.4rem',
                  padding: '0.75rem 1rem',
                  color: 'var(--danger)',
                  marginBottom: '1rem',
                  fontSize: '0.9em',
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '56px', fontSize: '1.05em' }}
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? '⏳ Verifying…' : '✔ Connect Page'}
            </button>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '0.75rem', minHeight: '48px' }}
              onClick={() => setStep('welcome')}
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Done ───────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4em', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Facebook Connected!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Page connected:
            </p>
            <div
              style={{
                background: 'var(--bg-raised)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.25rem',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: '1.05em',
                marginBottom: '2rem',
                userSelect: 'all',
              }}
            >
              {pageName}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9em' }}>
              Tap <strong>Sync</strong> in your Inbox to load messages for the first time.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '56px', fontSize: '1.05em' }}
              onClick={() => navigate('/inbox')}
            >
              Go to Inbox →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
