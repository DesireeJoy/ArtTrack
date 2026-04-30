import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { readConfig, writeConfig } from '../lib/config'
import { fetchRecentMessages, getPageInfo, isInquiry } from '../lib/facebookClient'

const router = Router()
const prisma = new PrismaClient()

// GET /api/facebook/status
router.get('/status', (_req, res) => {
  const config = readConfig()
  res.json({
    connected: !!config.facebookConnected,
    pageId: config.facebookPageId ?? null,
    pageName: config.facebookPageName ?? null,
  })
})

// POST /api/facebook/credentials  (save page ID + access token and verify them)
router.post('/credentials', async (req, res) => {
  const { pageId, accessToken } = req.body as { pageId?: string; accessToken?: string }
  if (!pageId || !accessToken) {
    return res.status(400).json({ error: 'pageId and accessToken are required' })
  }
  try {
    const info = await getPageInfo(pageId, accessToken)
    writeConfig({
      facebookPageId: info.id,
      facebookAccessToken: accessToken,
      facebookPageName: info.name,
      facebookConnected: true,
    })
    return res.json({ ok: true, pageName: info.name })
  } catch (err: any) {
    return res.status(400).json({ error: err.message ?? 'Invalid credentials' })
  }
})

// POST /api/facebook/disconnect
router.post('/disconnect', (_req, res) => {
  writeConfig({
    facebookPageId: undefined,
    facebookAccessToken: undefined,
    facebookPageName: undefined,
    facebookConnected: false,
  })
  res.json({ ok: true })
})

// POST /api/facebook/sync
router.post('/sync', async (_req, res) => {
  const config = readConfig()
  if (!config.facebookConnected || !config.facebookPageId || !config.facebookAccessToken) {
    return res.status(400).json({ error: 'Facebook not connected' })
  }
  try {
    const msgs = await fetchRecentMessages(
      config.facebookPageId,
      config.facebookAccessToken,
      50,
    )
    let newCount = 0
    for (const msg of msgs) {
      const exists = await prisma.message.findUnique({ where: { externalId: msg.id } })
      if (exists) continue
      await prisma.message.create({
        data: {
          source: 'facebook',
          externalId: msg.id,
          senderId: msg.from.id,
          senderName: msg.from.name,
          body: msg.message!.slice(0, 5000),
          receivedAt: new Date(msg.created_time),
          isInquiry: isInquiry(msg.message!),
          isRead: false,
        },
      })
      newCount++
    }
    return res.json({ ok: true, new: newCount, total: msgs.length })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// GET /api/facebook/messages
router.get('/messages', async (req, res) => {
  const where: Record<string, unknown> = { source: 'facebook' }
  if (req.query.inquiry === 'true') where.isInquiry = true
  if (req.query.unread === 'true') where.isRead = false
  const messages = await prisma.message.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    },
  })
  res.json(messages)
})

// PUT /api/facebook/messages/:id/read
router.put('/messages/:id/read', async (req, res) => {
  const updated = await prisma.message.update({
    where: { id: req.params.id },
    data: { isRead: true },
  })
  res.json(updated)
})

// POST /api/facebook/messages/:id/convert
router.post('/messages/:id/convert', async (req, res) => {
  const msg = await prisma.message.findUnique({ where: { id: req.params.id } })
  if (!msg) return res.status(404).json({ error: 'Message not found' })
  if (msg.projectId) return res.status(400).json({ error: 'Already linked to a project' })

  // Find or create a customer by their Facebook name
  let customer = await prisma.customer.findFirst({
    where: { facebook: msg.senderName },
  })
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: msg.senderName ?? 'Unknown',
        facebook: msg.senderName ?? undefined,
        preferredContact: 'facebook',
      },
    })
  }

  const project = await prisma.project.create({
    data: {
      title: `${msg.senderName} – Commission`,
      type: 'commission',
      status: 'inquiry',
      customerId: customer.id,
    },
  })

  await prisma.message.update({
    where: { id: msg.id },
    data: { projectId: project.id, customerId: customer.id },
  })

  return res.json({ ok: true, project, customer })
})

// GET /api/facebook/unread-count
router.get('/unread-count', async (_req, res) => {
  const count = await prisma.message.count({
    where: { source: 'facebook', isRead: false, isInquiry: true },
  })
  res.json({ count })
})

export default router
