import { createContext, useContext, useState, useCallback } from 'react'
import { communityPosts, mentorships as seedMentorships, leaderboard as seedLeaderboard } from '@/data/mockData'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'talentstage-community'

const seedChallenges = [
  { id: 'ch1', title: '30-Day React Sprint', desc: 'Ship one React component daily', participants: 342, prize: '500 pts', daysLeft: 12, tag: 'React' },
  { id: 'ch2', title: 'UI Design Week', desc: 'Redesign one screen per day in Figma', participants: 218, prize: '300 pts', daysLeft: 5, tag: 'Design' },
  { id: 'ch3', title: 'API Builder Challenge', desc: 'Build REST APIs with tests', participants: 156, prize: '400 pts', daysLeft: 18, tag: 'Backend' },
]

const seedEvents = [
  { id: 'e1', title: 'Freelancer AMA: Pricing Projects', host: 'TalentStage', date: 'May 28, 2026', time: '6:00 PM IST', attendees: 89, type: 'live' },
  { id: 'e2', title: 'React 19 Workshop', host: 'Lisa Park', date: 'Jun 2, 2026', time: '10:00 AM IST', attendees: 45, type: 'workshop' },
]

const seedMentorshipList = seedMentorships.map((m, i) => ({
  id: `m-seed-${i}`,
  mentor: m.mentor,
  skill: m.skill,
  slots: m.slots,
  rating: m.rating,
}))

const seedPosts = communityPosts.map((p, i) => ({
  id: `post-seed-${i}`,
  author: p.author,
  title: p.title,
  body: 'Join the discussion — share your experience in the comments!',
  likes: p.likes,
  liked: false,
  comments: [],
  commentCount: p.comments,
  time: p.time,
  tags: ['tips', 'career'],
  createdAt: Date.now() - i * 3600000,
}))

const defaultState = {
  posts: seedPosts,
  challenges: seedChallenges,
  events: seedEvents,
  mentorships: seedMentorshipList,
  joinedChallenges: [],
  bookedMentors: [],
  registeredEvents: [],
  userPoints: 1920,
  leaderboard: seedLeaderboard,
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const mentorships = parsed.mentorships?.length ? parsed.mentorships : seedMentorshipList
      const bookedMentors = (parsed.bookedMentors || []).map((b) => {
        if (mentorships.some((m) => m.id === b)) return b
        const match = mentorships.find((m) => m.mentor === b)
        return match?.id || b
      })
      return {
        ...defaultState,
        ...parsed,
        challenges: parsed.challenges?.length ? parsed.challenges : seedChallenges,
        events: parsed.events?.length ? parsed.events : seedEvents,
        mentorships,
        posts: parsed.posts?.length ? parsed.posts : seedPosts,
        bookedMentors,
      }
    }
  } catch {
    /* ignore */
  }
  return { ...defaultState }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const CommunityContext = createContext(null)

export function CommunityProvider({ children }) {
  const { isClient, isFreelancer } = useAuth()
  const [state, setState] = useState(loadState)

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      persist(next)
      return next
    })
  }, [])

  const createPost = useCallback(({ title, body, tags = [] }) => {
    update((prev) => ({
      ...prev,
      posts: [
        {
          id: `post-${Date.now()}`,
          author: 'You',
          title,
          body,
          likes: 0,
          liked: false,
          comments: [],
          commentCount: 0,
          time: 'just now',
          tags,
          createdAt: Date.now(),
        },
        ...prev.posts,
      ],
      userPoints: prev.userPoints + 10,
    }))
  }, [update])

  const createChallenge = useCallback(({ title, desc, tag, prize, daysLeft }) => {
    if (!isClient || !title?.trim()) return
    update((prev) => ({
      ...prev,
      challenges: [
        {
          id: `ch-${Date.now()}`,
          title: title.trim(),
          desc: desc?.trim() || '',
          tag: tag?.trim() || 'General',
          prize: prize?.trim() || '100 pts',
          daysLeft: Math.max(1, Number(daysLeft) || 7),
          participants: 1,
          createdBy: 'You',
        },
        ...prev.challenges,
      ],
      userPoints: prev.userPoints + 30,
    }))
  }, [update, isClient])

  const createMentorship = useCallback(({ mentor, skill, slots, rating }) => {
    if (!isClient || !mentor?.trim() || !skill?.trim()) return
    update((prev) => ({
      ...prev,
      mentorships: [
        {
          id: `m-${Date.now()}`,
          mentor: mentor.trim(),
          skill: skill.trim(),
          slots: Math.max(1, Number(slots) || 3),
          rating: Math.min(5, Math.max(1, Number(rating) || 5)),
          createdBy: 'You',
        },
        ...prev.mentorships,
      ],
      userPoints: prev.userPoints + 20,
    }))
  }, [update, isClient])

  const createEvent = useCallback(({ title, host, date, time, type }) => {
    if (!isClient || !title?.trim()) return
    update((prev) => ({
      ...prev,
      events: [
        {
          id: `e-${Date.now()}`,
          title: title.trim(),
          host: host?.trim() || 'You',
          date: date?.trim() || 'TBD',
          time: time?.trim() || 'TBD',
          type: type || 'live',
          attendees: 1,
          createdBy: 'You',
        },
        ...prev.events,
      ],
      userPoints: prev.userPoints + 25,
    }))
  }, [update, isClient])

  const toggleLike = useCallback((postId) => {
    update((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p
        const liked = !p.liked
        return {
          ...p,
          liked,
          likes: p.likes + (liked ? 1 : -1),
        }
      }),
      userPoints: prev.userPoints + (prev.posts.find((p) => p.id === postId)?.liked ? -1 : 2),
    }))
  }, [update])

  const addComment = useCallback((postId, text, author = 'You') => {
    if (!text.trim()) return
    update((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p
        const comment = {
          id: `c-${Date.now()}`,
          author,
          text: text.trim(),
          time: 'just now',
        }
        return {
          ...p,
          comments: [...(p.comments || []), comment],
          commentCount: (p.commentCount || 0) + 1,
        }
      }),
      userPoints: prev.userPoints + 5,
    }))
  }, [update])

  const joinChallenge = useCallback((challengeId) => {
    if (!isFreelancer) return
    update((prev) => {
      if (prev.joinedChallenges.includes(challengeId)) return prev
      return {
        ...prev,
        joinedChallenges: [...prev.joinedChallenges, challengeId],
        challenges: prev.challenges.map((ch) =>
          ch.id === challengeId ? { ...ch, participants: (ch.participants || 0) + 1 } : ch
        ),
        userPoints: prev.userPoints + 50,
      }
    })
  }, [update, isFreelancer])

  const bookMentor = useCallback((mentorId) => {
    if (!isFreelancer) return
    update((prev) => {
      if (prev.bookedMentors.includes(mentorId)) return prev
      const mentor = prev.mentorships.find((m) => m.id === mentorId)
      if (!mentor || mentor.slots < 1) return prev
      return {
        ...prev,
        bookedMentors: [...prev.bookedMentors, mentorId],
        mentorships: prev.mentorships.map((m) =>
          m.id === mentorId ? { ...m, slots: Math.max(0, m.slots - 1) } : m
        ),
      }
    })
  }, [update, isFreelancer])

  const registerEvent = useCallback((eventId) => {
    if (!isFreelancer) return
    update((prev) => {
      if (prev.registeredEvents.includes(eventId)) return prev
      return {
        ...prev,
        registeredEvents: [...prev.registeredEvents, eventId],
        events: prev.events.map((ev) =>
          ev.id === eventId ? { ...ev, attendees: (ev.attendees || 0) + 1 } : ev
        ),
        userPoints: prev.userPoints + 25,
      }
    })
  }, [update, isFreelancer])

  return (
    <CommunityContext.Provider
      value={{
        isClient,
        isFreelancer,
        canCreatePrograms: isClient,
        canJoinPrograms: isFreelancer,
        posts: state.posts,
        challenges: state.challenges,
        events: state.events,
        mentorships: state.mentorships,
        joinedChallenges: state.joinedChallenges,
        bookedMentors: state.bookedMentors,
        registeredEvents: state.registeredEvents,
        userPoints: state.userPoints,
        leaderboard: state.leaderboard.map((e) =>
          e.name === 'You' ? { ...e, points: state.userPoints } : e
        ),
        createPost,
        createChallenge,
        createMentorship,
        createEvent,
        toggleLike,
        addComment,
        joinChallenge,
        bookMentor,
        registerEvent,
      }}
    >
      {children}
    </CommunityContext.Provider>
  )
}

export function useCommunity() {
  const ctx = useContext(CommunityContext)
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider')
  return ctx
}
