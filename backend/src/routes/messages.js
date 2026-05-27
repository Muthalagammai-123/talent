import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, loadUser } from '../middleware/auth.js'

const router = Router()

function formatThread(thread, userId) {
  const participant = thread.participants.find((p) => p.userId === userId)
  const otherMsg = thread.messages.find((m) => !m.self) || thread.messages[0]
  const contactName = thread.messages.find((m) => !m.self)?.senderName || 'Contact'

  return {
    id: thread.id,
    meta: {
      id: thread.id,
      user: contactName,
      status: 'online',
      last: thread.lastMessage,
      time: thread.lastTime,
      unread: participant?.unread ?? 0,
      project: thread.projectTitle,
    },
    messages: thread.messages.map((m) => ({
      id: m.id,
      sender: m.senderName,
      text: m.text,
      self: m.senderId === userId,
      time: m.time,
      isError: m.isError,
    })),
  }
}

router.get('/threads', authRequired, loadUser, async (req, res, next) => {
  try {
    const threads = await prisma.messageThread.findMany({
      where: { participants: { some: { userId: req.userId } } },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({
      threads: Object.fromEntries(
        threads.map((t) => [t.id, formatThread(t, req.userId)])
      ),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/threads', authRequired, loadUser, async (req, res, next) => {
  try {
    const { contactName, projectTitle, initialMessage } = req.body
    if (!contactName) return res.status(400).json({ error: 'contactName required' })

    const thread = await prisma.messageThread.create({
      data: {
        projectTitle: projectTitle || null,
        lastMessage: initialMessage || 'New conversation',
        lastTime: 'now',
        participants: { create: [{ userId: req.userId, unread: 0 }] },
        messages: {
          create: {
            senderName: contactName,
            text: initialMessage || `Hi! I'm ${contactName}. How can I help?`,
            self: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        },
      },
      include: { participants: true, messages: { orderBy: { createdAt: 'asc' } } },
    })
    res.status(201).json({ thread: formatThread(thread, req.userId) })
  } catch (err) {
    next(err)
  }
})

router.post('/threads/:id/messages', authRequired, loadUser, async (req, res, next) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'Message text required' })

    const participant = await prisma.threadParticipant.findFirst({
      where: { threadId: req.params.id, userId: req.userId },
    })
    if (!participant) return res.status(404).json({ error: 'Thread not found' })

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const msg = await prisma.message.create({
      data: {
        threadId: req.params.id,
        senderId: req.userId,
        senderName: 'You',
        text: text.trim(),
        self: true,
        time,
      },
    })

    await prisma.messageThread.update({
      where: { id: req.params.id },
      data: { lastMessage: text.trim(), lastTime: 'now', updatedAt: new Date() },
    })

    res.status(201).json({
      message: {
        id: msg.id,
        sender: 'You',
        text: msg.text,
        self: true,
        time: msg.time,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/threads/:id/read', authRequired, loadUser, async (req, res, next) => {
  try {
    await prisma.threadParticipant.updateMany({
      where: { threadId: req.params.id, userId: req.userId },
      data: { unread: 0 },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
