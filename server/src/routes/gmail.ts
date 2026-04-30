import { Router, Request, Response } from 'express'
import { google } from 'googleapis'
import { readConfig, writeConfig } from '../lib/config'
import { getAuthUrl, createOAuthClient, fetchRecentEmails, getRedirectUris } from '../lib/gmailClient'
import prisma from '../lib/prisma'

const router = Router()

// GET /api/gmail/status — check connection state
router.get('/status', (_req: Request, res: Response) => {
  const config = readConfig()
  res.json({
    connected: !!config.gmailConnected,
    email: config.gmailEmail || null,
    hasCredentials: !!(config.gmailClientId && config.gmailClientSecret),
    setupComplete: !!config.setupComplete,
    setupSkipped: !!config.setupSkipped,
  })
})

// POST /api/gmail/credentials — save Client ID + Secret
router.post('/credentials', (req: Request, res: Response) => {
  const { clientId, clientSecret } = req.body
  if (!clientId?.trim() || !clientSecret?.trim()) {
    return res.status(400).json({ error: 'Client ID and Client Secret are required' })
  }
  writeConfig({
    gmailClientId: clientId.trim(),
    gmailClientSecret: clientSecret.trim(),
  })
  res.json({ ok: true })
})

// GET /api/gmail/auth-url — get OAuth URL to open in browser
router.get('/auth-url', (_req: Request, res: Response) => {
  const config = readConfig()
  if (!config.gmailClientId || !config.gmailClientSecret) {
    return res.status(400).json({ error: 'Credentials not configured yet' })
  }
  res.json({ url: getAuthUrl() })
})

// GET /api/gmail/callback — Google redirects here after user grants permission
router.get('/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query
  const { CLIENT_REDIRECT } = getRedirectUris()

  if (error || !code) {
    return res.redirect(`${CLIENT_REDIRECT}?error=access_denied`)
  }

  try {
    const config = readConfig()
    const oauth2 = new google.auth.OAuth2(
      config.gmailClientId,
      config.gmailClientSecret,
      'http://localhost:3001/api/gmail/callback'
    )
    const { tokens } = await oauth2.getToken(String(code))
    oauth2.setCredentials(tokens)

    // Get user email address
    const gmail = google.gmail({ version: 'v1', auth: oauth2 })
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const email = profile.data.emailAddress || ''

    writeConfig({
      gmailAccessToken: tokens.access_token || undefined,
      gmailRefreshToken: tokens.refresh_token || undefined,
      gmailConnected: true,
      gmailEmail: email,
      setupComplete: true,
    })

    res.redirect(`${CLIENT_REDIRECT}?connected=1&email=${encodeURIComponent(email)}`)
  } catch (e) {
    console.error('Gmail callback error:', e)
    res.redirect(`${CLIENT_REDIRECT}?error=token_exchange`)
  }
})

// POST /api/gmail/skip-setup — user chose to skip for now
router.post('/skip-setup', (_req: Request, res: Response) => {
  writeConfig({ setupSkipped: true })
  res.json({ ok: true })
})

// POST /api/gmail/sync — fetch recent emails and store new ones
router.post('/sync', async (_req: Request, res: Response) => {
  const config = readConfig()
  if (!config.gmailConnected) {
    return res.status(400).json({ error: 'Gmail not connected' })
  }
  try {
    const emails = await fetchRecentEmails(50)
    let newCount = 0

    for (const email of emails) {
      const exists = await prisma.email.findUnique({ where: { gmailId: email.gmailId } })
      if (exists) continue

      await prisma.email.create({
        data: {
          gmailId: email.gmailId,
          subject: email.subject,
          from: email.from,
          body: email.body.slice(0, 5000), // cap body size
          receivedAt: email.receivedAt,
          isInquiry: email.isInquiry,
          isRead: false,
        },
      })
      newCount++
    }

    res.json({ synced: emails.length, new: newCount })
  } catch (e: unknown) {
    console.error('Sync error:', e)
    res.status(500).json({ error: 'Sync failed — check Gmail connection' })
  }
})

// GET /api/gmail/emails — get stored emails
router.get('/emails', async (req: Request, res: Response) => {
  try {
    const { inquiry, unread } = req.query
    const where: Record<string, unknown> = {}
    if (inquiry === 'true') where.isInquiry = true
    if (unread === 'true') where.isRead = false

    const emails = await prisma.email.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: 100,
      include: {
        customer: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    })
    res.json(emails)
  } catch {
    res.status(500).json({ error: 'Failed to fetch emails' })
  }
})

// PUT /api/gmail/emails/:id/read — mark email as read
router.put('/emails/:id/read', async (req: Request, res: Response) => {
  try {
    await prisma.email.update({ where: { id: req.params.id }, data: { isRead: true } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// POST /api/gmail/emails/:id/convert — convert email to project + customer
router.post('/emails/:id/convert', async (req: Request, res: Response) => {
  try {
    const email = await prisma.email.findUnique({ where: { id: req.params.id } })
    if (!email) return res.status(404).json({ error: 'Email not found' })

    // Try to match existing customer by sender email
    const senderEmail = email.from?.match(/<([^>]+)>/)?.[1] || email.from || ''
    const senderName = email.from?.replace(/<[^>]+>/, '').trim() || 'Unknown'

    let customer = senderEmail
      ? await prisma.customer.findFirst({ where: { email: senderEmail } })
      : null

    if (!customer && senderEmail) {
      customer = await prisma.customer.create({
        data: { name: senderName, email: senderEmail, preferredContact: 'email' },
      })
    }

    const project = await prisma.project.create({
      data: {
        title: email.subject || 'Inquiry from ' + senderName,
        type: 'commission',
        status: 'inquiry',
        customerId: customer?.id || null,
      },
    })

    await prisma.email.update({
      where: { id: req.params.id },
      data: { isRead: true, projectId: project.id, customerId: customer?.id || null },
    })

    res.json({ project, customer })
  } catch {
    res.status(500).json({ error: 'Conversion failed' })
  }
})

// GET /api/gmail/unread-count — badge count for nav
router.get('/unread-count', async (_req: Request, res: Response) => {
  try {
    const count = await prisma.email.count({ where: { isRead: false, isInquiry: true } })
    res.json({ count })
  } catch {
    res.json({ count: 0 })
  }
})

export default router
