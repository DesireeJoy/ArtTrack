import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, status } = req.query
    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = String(projectId)
    if (status) where.status = String(status)
    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { id: true, title: true, customer: { select: { name: true } } },
        },
      },
    })
    res.json(shipments)
  } catch {
    res.status(500).json({ error: 'Failed to fetch shipments' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { carrier, trackingNumber, shipDate, recipientName, address, rawLabelText, projectId, status } = req.body
    const shipment = await prisma.shipment.create({
      data: {
        carrier,
        trackingNumber,
        recipientName,
        address,
        rawLabelText,
        status: status || 'pending',
        shipDate: shipDate ? new Date(shipDate) : null,
        projectId: projectId || null,
      },
    })
    res.status(201).json(shipment)
  } catch {
    res.status(500).json({ error: 'Failed to create shipment' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { carrier, trackingNumber, shipDate, deliveredDate, status, recipientName, address, projectId } = req.body
    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data: {
        carrier,
        trackingNumber,
        recipientName,
        address,
        status,
        shipDate: shipDate ? new Date(shipDate) : undefined,
        deliveredDate: deliveredDate ? new Date(deliveredDate) : undefined,
        projectId: projectId !== undefined ? (projectId || null) : undefined,
      },
    })
    res.json(shipment)
  } catch {
    res.status(500).json({ error: 'Failed to update shipment' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.shipment.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete shipment' })
  }
})

export default router
