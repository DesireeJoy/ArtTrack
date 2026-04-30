import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Welcome' },
  { label: 'Google Setup' },
  { label: 'Connect Gmail' },
  { label: 'Done!' },
]

// ── Progress Dots ─────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
      {STEPS.map((s, i) => (
        <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
          <div
            style={{
              width: i <= step ? '14px' : '10px',
              height: i <= step ? '14px' : '10px',
              borderRadius: '50%',
              background: i < step ? 'var(--success)' : i === step ? 'var(--accent)' : 'var(--border)',
              transition: 'all 0.2s',
            }}
          />
          <span style={{ fontSize: '0.65em', color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '4em', marginBottom: '1rem' }}>🎨</div>
      <h1 style={{ fontSize: '1.8em', color: 'var(--text-primary)', margin: '0 0 1rem' }}>
        Welcome to ArtTrack!
      </h1>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '460px', margin: '0 auto 2rem' }}>
        Let's connect your Gmail so commission requests automatically appear here — 
        no more digging through your inbox.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88em', marginBottom: '2.5rem' }}>
        This takes about 5 minutes and only needs to be done once.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '340px', margin: '0 auto' }}>
        <button className="btn btn-primary" style={{ minHeight: '64px', fontSize: '1.1em' }} onClick={onNext}>
          Let's Do It →
        </button>
        <button className="btn btn-ghost" onClick={onSkip} style={{ fontSize: '0.9em' }}>
          Skip for now — I'll do this later
        </button>
      </div>
    </div>
  )
}

// ── Step 1: Google Cloud Credentials ─────────────────────────────────────────

function StepCredentials({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Both fields are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/gmail/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      })
      if (!res.ok) throw new Error('Failed to save')
      onNext()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.4em', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
        Step 1 — Create Google credentials
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
        Google requires a free "project" to let apps read Gmail. Follow these steps:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { n: 1, text: 'Open', link: 'https://console.cloud.google.com/', linkText: 'console.cloud.google.com' },
          { n: 2, text: 'Click "Select a project" → "New Project" → name it ArtTrack → click Create' },
          { n: 3, text: 'In the left menu go to APIs & Services → Library → search "Gmail API" → click Enable' },
          { n: 4, text: 'Go to APIs & Services → Credentials → "Create Credentials" → OAuth Client ID' },
          { n: 5, text: 'Application type: Web application. Name it anything.' },
          {
            n: 6,
            text: 'Under "Authorized redirect URIs" click Add URI and paste exactly:',
            code: 'http://localhost:3001/api/gmail/callback',
          },
          { n: 7, text: 'Click Create — a popup will show your Client ID and Client Secret. Copy them below.' },
        ].map((item) => (
          <div
            key={item.n}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              background: 'var(--bg-hover)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
            }}
          >
            <span
              style={{
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                minWidth: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85em',
              }}
            >
              {item.n}
            </span>
            <div>
              <span style={{ color: 'var(--text-primary)' }}>{item.text}</span>
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', marginLeft: '0.3rem' }}>
                  {item.linkText}
                </a>
              )}
              {item.code && (
                <div
                  style={{
                    fontFamily: 'monospace',
                    background: 'var(--bg-base)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.3rem',
                    marginTop: '0.4rem',
                    color: 'var(--accent)',
                    fontSize: '0.9em',
                    userSelect: 'all',
                  }}
                >
                  {item.code}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: 'var(--danger)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="label">Client ID</label>
        <input
          className="input"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Paste your Client ID here"
          style={{ fontFamily: 'monospace', fontSize: '0.88em' }}
        />
      </div>

      <div className="form-group">
        <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Client Secret</span>
          <button
            onClick={() => setShowSecret((s) => !s)}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9em', padding: 0 }}
          >
            {showSecret ? 'Hide' : 'Show'}
          </button>
        </label>
        <input
          className="input"
          type={showSecret ? 'text' : 'password'}
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Paste your Client Secret here"
          style={{ fontFamily: 'monospace', fontSize: '0.88em' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minHeight: '56px', paddingLeft: '2rem', paddingRight: '2rem' }}>
          {saving ? 'Saving…' : 'Save & Continue →'}
        </button>
      </div>
    </div>
  )
}

// ── Step 2: OAuth Connect ─────────────────────────────────────────────────────

function StepConnect({ onNext, onBack, connectedEmail }: { onNext: (email: string) => void; onBack: () => void; connectedEmail: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // If we already connected (came back from OAuth redirect)
  useEffect(() => {
    if (connectedEmail) onNext(connectedEmail)
  }, [connectedEmail])

  const openGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gmail/auth-url')
      const data = await res.json()
      if (!data.url) throw new Error('Could not get login URL')
      window.open(data.url, '_blank', 'width=500,height=700')

      // Poll for connection every 2 seconds (Google will redirect back)
      pollRef.current = setInterval(async () => {
        const status = await fetch('/api/gmail/status').then((r) => r.json())
        if (status.connected && status.email) {
          clearInterval(pollRef.current!)
          onNext(status.email)
        }
      }, 2000)
    } catch {
      setError('Could not open Google login. Make sure your credentials are saved.')
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3em', marginBottom: '1rem' }}>📧</div>
      <h2 style={{ fontSize: '1.4em', color: 'var(--text-primary)', margin: '0 0 1rem' }}>
        Connect your Gmail
      </h2>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '440px', margin: '0 auto 1rem' }}>
        Click the button below. A Google login window will open.
        Log in and click <strong>Allow</strong> — then come back here.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85em', marginBottom: '2rem' }}>
        ArtTrack only reads your inbox. It never sends emails without you.
      </p>

      {error && (
        <div style={{ background: 'var(--danger)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'left' }}>
          {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ minHeight: '72px', fontSize: '1.2em', width: '100%', maxWidth: '380px', marginBottom: '1rem' }}
        onClick={openGoogleLogin}
        disabled={loading}
      >
        {loading ? '⏳ Waiting for Google login…' : '🔗 Open Gmail Login'}
      </button>

      {loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85em', marginBottom: '1.5rem' }}>
          Waiting for you to approve access in the Google window…
        </p>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  )
}

// ── Step 3: Done ──────────────────────────────────────────────────────────────

function StepDone({ email }: { email: string }) {
  const navigate = useNavigate()

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '4em', marginBottom: '1rem' }}>🎉</div>
      <h2 style={{ fontSize: '1.6em', color: 'var(--text-primary)', margin: '0 0 1rem' }}>
        You're all set!
      </h2>
      {email && (
        <div
          style={{
            background: 'var(--success)',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '2rem',
            display: 'inline-block',
            marginBottom: '1.5rem',
            fontWeight: 700,
          }}
        >
          ✓ Connected: {email}
        </div>
      )}
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '420px', margin: '0 auto 2rem' }}>
        Commission requests that arrive in your Gmail will automatically appear in your
        <strong> Inbox</strong>. You can convert them to projects with one tap.
      </p>
      <button
        className="btn btn-primary"
        style={{ minHeight: '64px', fontSize: '1.1em', minWidth: '240px' }}
        onClick={() => navigate('/dashboard')}
      >
        Go to Dashboard →
      </button>
    </div>
  )
}

// ── Main Setup Component ───────────────────────────────────────────────────────

export default function Setup() {
  const [step, setStep] = useState(0)
  const [connectedEmail, setConnectedEmail] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Google redirects back here with ?connected=1&email=...
  useEffect(() => {
    const connected = searchParams.get('connected')
    const email = searchParams.get('email') || ''
    if (connected === '1') {
      setConnectedEmail(email)
      setStep(3)
    }
    const err = searchParams.get('error')
    if (err) {
      setStep(2) // Go back to connect step and let it show error
    }
  }, [])

  // Check if already set up
  useEffect(() => {
    fetch('/api/gmail/status')
      .then((r) => r.json())
      .then((s) => {
        if (s.connected && !searchParams.get('reconnect')) {
          navigate('/dashboard')
        }
      })
      .catch(() => {})
  }, [])

  const handleSkip = async () => {
    await fetch('/api/gmail/skip-setup', { method: 'POST' }).catch(() => {})
    navigate('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      {/* Header */}
      <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '1.4em', marginBottom: '2rem' }}>
        🎨 ArtTrack
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '2.5rem',
        }}
      >
        <ProgressDots step={step} />

        {step === 0 && <StepWelcome onNext={() => setStep(1)} onSkip={handleSkip} />}
        {step === 1 && <StepCredentials onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && (
          <StepConnect
            onNext={(email) => { setConnectedEmail(email); setStep(3) }}
            onBack={() => setStep(1)}
            connectedEmail={connectedEmail}
          />
        )}
        {step === 3 && <StepDone email={connectedEmail} />}
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.8em', marginTop: '1.5rem', textAlign: 'center' }}>
        Your credentials are stored locally on this computer only.<br />
        They are never sent to any server other than Google.
      </div>
    </div>
  )
}
