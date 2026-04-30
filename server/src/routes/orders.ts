import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, customerId } = req.query
    const where: Record<string, unknown> = {}
    if (status) where.status = String(status)
    if (customerId) where.customerId = String(customerId)
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true } } },
    })
    res.json(orders)
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { source, externalId, items, total, status, paymentStatus, customerId } = req.body
    const order = await prisma.order.create({
      data: {
        source: source || 'manual',
        externalId,
        items: items ? JSON.stringify(items) : null,
        total: total ? Number(total) : null,
        status: status || 'pending',
        paymentStatus: paymentStatus || 'unpaid',
        customerId: customerId || null,
      },
    })
    res.status(201).json(order)
  } catch {
    res.status(500).json({ error: 'Failed to create order' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus, customerId } = req.body
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, paymentStatus, customerId: customerId || null },
    })
    res.json(order)
  } catch {
    res.status(500).json({ error: 'Failed to update order' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete order' })
  }
})

export default router
