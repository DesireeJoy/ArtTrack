import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, customerId } = req.query
    const where: Record<string, unknown> = {}
    if (status) where.status = String(status)
    if (customerId) where.customerId = String(customerId)
    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
    })
    res.json(projects)
  } catch {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        tasks: { orderBy: { createdAt: 'asc' } },
        shipments: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch {
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, type, status, deadline, price, depositPaid, notes, customerId } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        type: type || 'commission',
        status: status || 'inquiry',
        deadline: deadline ? new Date(deadline) : null,
        price: price ? Number(price) : null,
        depositPaid: depositPaid ? Number(depositPaid) : 0,
        notes,
        customerId: customerId || null,
      },
    })
    res.status(201).json(project)
  } catch {
    res.status(500).json({ error: 'Failed to create project' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, type, status, deadline, price, depositPaid, notes, customerId } = req.body
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        title,
        type,
        status,
        deadline: deadline ? new Date(deadline) : undefined,
        price: price !== undefined ? Number(price) : undefined,
        depositPaid: depositPaid !== undefined ? Number(depositPaid) : undefined,
        notes,
        customerId: customerId || null,
      },
    })
    res.json(project)
  } catch {
    res.status(500).json({ error: 'Failed to update project' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default router
