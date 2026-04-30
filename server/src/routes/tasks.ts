import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, done } = req.query
    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = String(projectId)
    if (done !== undefined) where.done = done === 'true'
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ done: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
      include: { project: { select: { id: true, title: true } } },
    })
    res.json(tasks)
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, dueDate, priority, projectId } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        projectId: projectId || null,
      },
    })
    res.status(201).json(task)
  } catch {
    res.status(500).json({ error: 'Failed to create task' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, dueDate, priority, done, projectId } = req.body
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        done,
        projectId: projectId !== undefined ? (projectId || null) : undefined,
      },
    })
    res.json(task)
  } catch {
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

export default router
