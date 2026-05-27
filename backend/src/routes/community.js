import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson, stringifyJson } from '../lib/json.js'
import { authRequired, loadUser } from '../middleware/auth.js'

const router = Router()

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

router.get('/', async (req, res, next) => {
  try {
    const posts = await prisma.communityPost.findMany({
      include: { comments: { orderBy: { createdAt: 'asc' }, take: 20 } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({
      posts: posts.map((p) => ({
        id: p.id,
        author: p.authorName,
        title: p.title,
        body: p.body,
        likes: p.likes,
        liked: false,
        comments: p.comments.map((c) => ({
          id: c.id,
          author: c.authorName,
          text: c.text,
          time: timeAgo(c.createdAt),
        })),
        commentCount: p.commentCount,
        time: timeAgo(p.createdAt),
        tags: parseJson(p.tags, []),
        createdAt: p.createdAt.getTime(),
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/posts', authRequired, loadUser, async (req, res, next) => {
  try {
    const { title, body, tags = [] } = req.body
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' })

    const post = await prisma.communityPost.create({
      data: {
        authorId: req.userId,
        authorName: req.user.name,
        title,
        body,
        tags: stringifyJson(tags),
      },
    })
    res.status(201).json({
      post: {
        id: post.id,
        author: post.authorName,
        title: post.title,
        body: post.body,
        likes: 0,
        liked: false,
        comments: [],
        commentCount: 0,
        time: 'just now',
        tags,
        createdAt: post.createdAt.getTime(),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/posts/:id/like', authRequired, loadUser, async (req, res, next) => {
  try {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: req.params.id, userId: req.userId } },
    })
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } })
      const post = await prisma.communityPost.update({
        where: { id: req.params.id },
        data: { likes: { decrement: 1 } },
      })
      return res.json({ likes: post.likes, liked: false })
    }
    await prisma.postLike.create({ data: { postId: req.params.id, userId: req.userId } })
    const post = await prisma.communityPost.update({
      where: { id: req.params.id },
      data: { likes: { increment: 1 } },
    })
    res.json({ likes: post.likes, liked: true })
  } catch (err) {
    next(err)
  }
})

router.post('/posts/:id/comments', authRequired, loadUser, async (req, res, next) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' })

    const comment = await prisma.comment.create({
      data: {
        postId: req.params.id,
        authorId: req.userId,
        authorName: req.user.name,
        text: text.trim(),
      },
    })
    await prisma.communityPost.update({
      where: { id: req.params.id },
      data: { commentCount: { increment: 1 } },
    })
    res.status(201).json({
      comment: {
        id: comment.id,
        author: comment.authorName,
        text: comment.text,
        time: 'just now',
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
