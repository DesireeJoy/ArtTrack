import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

// ── Types ──────────────────────────────────────────────────────────────────

interface StoredEmail {
  id: string
  subject?: string
  from?: string
  body?: string
  receivedAt?: string
  isInquiry: boolean
  isRead: boolean
  customer?: { id: string; name: string } | null
  project?: { id: string; title: string } | null
}

interface StoredMessage {
  id: string
  senderName: string
  body?: string
  receivedAt?: string
  isInquiry: boolean
  isRead: boolean
  customer?: { id: string; name: string } | null
  project?: { id: string; title: string } | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

function senderName(from: string | undefined): string {
  if (!from) return 'Unknown'
  const match = from.match(/^"?([^"<]+)"?\s*</)
  return match ? match[1].trim() : from.replace(/<[^>]+>/, '').trim() || from
}

function senderEmail(from: string | undefined): string {
  if (!from) return ''
  const match = from.match(/<([^>]+)>/)
  return match ? match[1] : from
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(dateStr).toLocaleDateString()
}

// ── EmailRow ───────────────────────────────────────────────────────────────

function EmailRow({
  email,
  expanded,
  converting,
  onToggle,
  onConvert,
}: {
  email: StoredEmail
  expanded: boolean
  converting: boolean
  onToggle: () => void
  onConvert: () => void
}) {
  return (
    <div
      className="card"
      style={{
        borderLeft: email.isInquiry ? '4px solid var(--accent)' : '4px solid var(--border)',
        opacity: email.isRead ? 0.75 : 1,
        cursor: 'pointer',
      }}
    >
      <div
        onClick={onToggle}
        style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {!email.isRead && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ fontWeight: email.isRead ? 400 : 700 }}>
              {email.subject || '(No subject)'}
            </span>
            {email.isInquiry && (
              <span className="badge" style={{ background: 'var(--accent)', color: '#fff' }}>
                ⭐ Inquiry
              </span>
            )}
            {email.project && (
              <span className="badge" style={{ background: 'var(--success)', color: '#fff' }}>
                🎨 {email.project.title}
              </span>
            )}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88em', marginTop: '0.25rem' }}>
            <strong>{senderName(email.from)}</strong>
            {senderEmail(email.from) && (
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', userSelect: 'all' }}>
                &lt;{senderEmail(email.from)}&gt;
              </span>
            )}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82em', flexShrink: 0, paddingTop: '0.2rem' }}>
          {timeAgo(email.receivedAt)}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1rem' }}>
          <div
            style={{
              background: 'var(--bg-base)',
              borderRadius: '0.4rem',
              padding: '1rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9em',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '1rem',
            }}
          >
            {email.body?.trim() || '(No body)'}
          </div>
          {email.isInquiry && !email.project && (
            <button
              className="btn btn-primary"
              style={{ minHeight: '52px', fontSize: '0.95em' }}
              onClick={onConvert}
              disabled={converting}
            >
              {converting ? '⏳ Creating…' : '🎨 Convert to Project'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── MessageRow ─────────────────────────────────────────────────────────────

function MessageRow({
  msg,
  expanded,
  converting,
  onToggle,
  onConvert,
}: {
  msg: StoredMessage
  expanded: boolean
  converting: boolean
  onToggle: () => void
  onConvert: () => void
}) {
  return (
    <div
      className="card"
      style={{
        borderLeft: msg.isInquiry ? '4px solid #1877f2' : '4px solid var(--border)',
        opacity: msg.isRead ? 0.75 : 1,
        cursor: 'pointer',
      }}
    >
      <div
        onClick={onToggle}
        style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {!msg.isRead && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#1877f2',
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ fontSize: '0.85em' }}>💬</span>
            <span style={{ fontWeight: msg.isRead ? 400 : 700 }}>{msg.senderName}</span>
            {msg.isInquiry && (
              <span className="badge" style={{ background: '#1877f2', color: '#fff' }}>
                ⭐ Inquiry
              </span>
            )}
            {msg.project && (
              <span className="badge" style={{ background: 'var(--success)', color: '#fff' }}>
                🎨 {msg.project.title}
              </span>
            )}
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.84em',
              marginTop: '0.25rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '400px',
            }}
          >
            {msg.body || ''}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82em', flexShrink: 0, paddingTop: '0.2rem' }}>
          {timeAgo(msg.receivedAt)}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1rem' }}>
          <div
            style={{
              background: 'var(--bg-base)',
              borderRadius: '0.4rem',
              padding: '1rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9em',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '1rem',
            }}
          >
            {msg.body?.trim() || '(No message)'}
          </div>
          {msg.isInquiry && !msg.project && (
            <button
              className="btn btn-primary"
              style={{ minHeight: '52px', fontSize: '0.95em', background: '#1877f2' }}
              onClick={onConvert}
              disabled={converting}
            >
              {converting ? '⏳ Creating…' : '🎨 Convert to Project'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Inbox ──────────────────────────────────────────────────────────────────

type Tab = 'inquiries' | 'email' | 'facebook'

export default function Inbox() {
  const [tab, setTab] = useState<Tab>('inquiries')
  const [emails, setEmails] = useState<StoredEmail[]>([])
  const [messages, setMessages] = useState<StoredMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [converting, setConverting] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState('')

  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null)
  const [gmailEmail, setGmailEmail] = useState('')
  const [fbConnected, setFbConnected] = useState<boolean | null>(null)
  const [fbPageName, setFbPageName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/gmail/status').then((r) => r.json()).catch(() => ({ connected: false })),
      fetch('/api/facebook/status').then((r) => r.json()).catch(() => ({ connected: false })),
    ]).then(([gmail, fb]) => {
      setGmailConnected(!!gmail.connected)
      setGmailEmail(gmail.email || '')
      setFbConnected(!!fb.connected)
      setFbPageName(fb.pageName || '')
    })
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [emailData, msgData] = await Promise.all([
        gmailConnected
          ? fetch('/api/gmail/emails').then((r) => r.json()).catch(() => [])
          : Promise.resolve([]),
        fbConnected
          ? fetch('/api/facebook/messages').then((r) => r.json()).catch(() => [])
          : Promise.resolve([]),
      ])
      setEmails(Array.isArray(emailData) ? emailData : [])
      setMessages(Array.isArray(msgData) ? msgData : [])
    } finally {
      setLoading(false)
    }
  }, [gmailConnected, fbConnected])

  useEffect(() => {
    if (gmailConnected !== null && fbConnected !== null) loadData()
  }, [gmailConnected, fbConnected, loadData])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const results = await Promise.all([
        gmailConnected
          ? fetch('/api/gmail/sync', { method: 'POST' }).then((r) => r.json()).catch(() => ({ new: 0 }))
          : Promise.resolve({ new: 0 }),
        fbConnected
          ? fetch('/api/facebook/sync', { method: 'POST' }).then((r) => r.json()).catch(() => ({ new: 0 }))
          : Promise.resolve({ new: 0 }),
      ])
      const totalNew = results.reduce((sum, r) => sum + (r.new ?? 0), 0)
      setSyncMsg(totalNew > 0 ? `✓ ${totalNew} new message${totalNew !== 1 ? 's' : ''} loaded` : '✓ Already up to date')
      loadData()
    } catch {
      setSyncMsg('Sync failed — check your connection')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 4000)
    }
  }

  const markEmailRead = async (id: string) => {
    await fetch(`/api/gmail/emails/${id}/read`, { method: 'PUT' }).catch(() => {})
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, isRead: true } : e)))
  }

  const markMsgRead = async (id: string) => {
    await fetch(`/api/facebook/messages/${id}/read`, { method: 'PUT' }).catch(() => {})
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)))
  }

  const convertEmail = async (email: StoredEmail) => {
    if (!confirm(`Convert "${email.subject || 'this email'}" into a new project?`)) return
    setConverting(email.id)
    try {
      const res = await fetch(`/api/gmail/emails/${email.id}/convert`, { method: 'POST' })
      const data = await res.json()
      if (data.project) {
        setSyncMsg(`✓ Project created: "${data.project.title}"`)
        setTimeout(() => setSyncMsg(''), 4000)
        loadData()
      }
    } catch {
      setSyncMsg('Could not convert — try again')
    } finally {
      setConverting(null)
    }
  }

  const convertMessage = async (msg: StoredMessage) => {
    if (!confirm(`Convert message from ${msg.senderName} into a new project?`)) return
    setConverting(msg.id)
    try {
      const res = await fetch(`/api/facebook/messages/${msg.id}/convert`, { method: 'POST' })
      const data = await res.json()
      if (data.project) {
        setSyncMsg(`✓ Project created: "${data.project.title}"`)
        setTimeout(() => setSyncMsg(''), 4000)
        loadData()
      }
    } catch {
      setSyncMsg('Could not convert — try again')
    } finally {
      setConverting(null)
    }
  }

  const toggleExpand = (id: string) => setExpanded((prev) => (prev === id ? null : id))
  const toggleEmailExpand = (id: string, isRead: boolean) => { toggleExpand(id); if (!isRead) markEmailRead(id) }
  const toggleMsgExpand = (id: string, isRead: boolean) => { toggleExpand(id); if (!isRead) markMsgRead(id) }

  if (gmailConnected === false && fbConnected === false) {
    return (
      <div>
        <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>📬 Inbox</h1>
        <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '480px' }}>
          <div style={{ fontSize: '3em', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Nothing connected yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Connect Gmail and/or Facebook Messenger to see your commission inquiries here.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/setup" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Connect Gmail →
            </Link>
            <Link to="/setup-facebook" className="btn btn-ghost" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Connect Facebook Messenger →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  type InboxItem = { kind: 'email'; data: StoredEmail } | { kind: 'message'; data: StoredMessage }

  const inquiryItems: InboxItem[] = [
    ...emails.filter((e) => e.isInquiry).map((e): InboxItem => ({ kind: 'email', data: e })),
    ...messages.filter((m) => m.isInquiry).map((m): InboxItem => ({ kind: 'message', data: m })),
  ].sort((a, b) => new Date(b.data.receivedAt ?? 0).getTime() - new Date(a.data.receivedAt ?? 0).getTime())

  const TABS = [
    { key: 'inquiries' as Tab, label: '⭐ Inquiries', count: inquiryItems.filter((i) => !i.data.isRead).length },
    ...(gmailConnected ? [{ key: 'email' as Tab, label: '📧 Email', count: emails.filter((e) => !e.isRead).length }] : []),
    ...(fbConnected ? [{ key: 'facebook' as Tab, label: '💬 Facebook', count: messages.filter((m) => !m.isRead).length }] : []),
  ]

  const connectedParts = [gmailConnected && gmailEmail, fbConnected && fbPageName].filter(Boolean) as string[]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📬 Inbox</h1>
          {connectedParts.length > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82em', marginTop: '0.25rem' }}>
              {connectedParts.join(' · ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {syncMsg && (
            <span style={{ color: syncMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)', fontSize: '0.88em' }}>
              {syncMsg}
            </span>
          )}
          <button className="btn btn-ghost" onClick={handleSync} disabled={syncing} style={{ minHeight: '44px' }}>
            {syncing ? '⏳ Syncing…' : '🔄 Sync Now'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: '40px', padding: '0.4rem 1.1rem', fontSize: '0.9em' }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count > 0 && (
              <span
                style={{
                  marginLeft: '0.4rem',
                  background: tab === t.key ? 'rgba(255,255,255,0.3)' : 'var(--danger)',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: '0.75em',
                  fontWeight: 800,
                  padding: '0 0.4rem',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {!fbConnected && (
        <div style={{ background: 'var(--bg-raised)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>💬 Want Facebook Messenger here too?</span>
          <Link to="/setup-facebook" style={{ color: 'var(--accent)', fontWeight: 600 }}>Connect →</Link>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tab === 'inquiries' && (
            inquiryItems.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No commission inquiries yet. Tap Sync to check.</div>
            ) : (
              inquiryItems.map((item) =>
                item.kind === 'email' ? (
                  <EmailRow key={`e-${item.data.id}`} email={item.data} expanded={expanded === item.data.id} converting={converting === item.data.id} onToggle={() => toggleEmailExpand(item.data.id, item.data.isRead)} onConvert={() => convertEmail(item.data)} />
                ) : (
                  <MessageRow key={`m-${item.data.id}`} msg={item.data} expanded={expanded === item.data.id} converting={converting === item.data.id} onToggle={() => toggleMsgExpand(item.data.id, item.data.isRead)} onConvert={() => convertMessage(item.data)} />
                )
              )
            )
          )}
          {tab === 'email' && (
            emails.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No emails yet. Tap Sync to load your inbox.</div>
            ) : (
              emails.map((email) => (
                <EmailRow key={email.id} email={email} expanded={expanded === email.id} converting={converting === email.id} onToggle={() => toggleEmailExpand(email.id, email.isRead)} onConvert={() => convertEmail(email)} />
              ))
            )
          )}
          {tab === 'facebook' && (
            messages.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No messages yet. Tap Sync to load Messenger messages.</div>
            ) : (
              messages.map((msg) => (
                <MessageRow key={msg.id} msg={msg} expanded={expanded === msg.id} converting={converting === msg.id} onToggle={() => toggleMsgExpand(msg.id, msg.isRead)} onConvert={() => convertMessage(msg)} />
              ))
            )
          )}
        </div>
      )}
    </div>
  )
}
