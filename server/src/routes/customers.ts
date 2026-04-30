import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { projects: true, orders: true } } },
    })
    res.json(customers)
  } catch {
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        projects: { orderBy: { updatedAt: 'desc' } },
        orders: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    res.json(customer)
  } catch {
    res.status(500).json({ error: 'Failed to fetch customer' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, instagram, facebook, preferredContact, notes, tags } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const customer = await prisma.customer.create({
      data: { name: name.trim(), email, phone, instagram, facebook, preferredContact, notes, tags },
    })
    res.status(201).json(customer)
  } catch {
    res.status(500).json({ error: 'Failed to create customer' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, instagram, facebook, preferredContact, notes, tags, isVip } = req.body
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, email, phone, instagram, facebook, preferredContact, notes, tags, isVip },
    })
    res.json(customer)
  } catch {
    res.status(500).json({ error: 'Failed to update customer' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete customer' })
  }
})

export default router
