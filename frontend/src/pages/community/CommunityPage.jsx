import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Trophy, Users, Plus, Search, Flame, Calendar,
  Send, Hash, Zap, Star, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { GlassCard } from '@/components/shared/GlassCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useCommunity } from '@/contexts/CommunityContext'
import { cn } from '@/lib/utils'

const TRENDING_TAGS = ['React', 'Freelancing', 'AI', 'Pricing', 'Remote', 'Design', 'Node.js']

export function CommunityPage() {
  const {
    posts, challenges, events, mentorships, leaderboard,
    joinedChallenges, bookedMentors, registeredEvents, userPoints,
    createPost, createChallenge, createMentorship, createEvent,
    toggleLike, addComment, joinChallenge, bookMentor, registerEvent,
    canCreatePrograms, canJoinPrograms,
  } = useCommunity()

  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('All')
  const [commentPostId, setCommentPostId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [newPost, setNewPost] = useState({ title: '', body: '', tags: '' })
  const [postOpen, setPostOpen] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [mentorOpen, setMentorOpen] = useState(false)
  const [eventOpen, setEventOpen] = useState(false)
  const [newChallenge, setNewChallenge] = useState({ title: '', desc: '', tag: '', prize: '', daysLeft: '7' })
  const [newMentor, setNewMentor] = useState({ mentor: '', skill: '', slots: '3', rating: '5' })
  const [newEvent, setNewEvent] = useState({ title: '', host: '', date: '', time: '', type: 'live' })

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.body?.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
      const matchTag = activeTag === 'All' || p.tags?.includes(activeTag)
      return matchSearch && matchTag
    })
  }, [posts, search, activeTag])

  const activePost = posts.find((p) => p.id === commentPostId)

  const handleCreatePost = () => {
    if (!newPost.title.trim()) return
    createPost({
      title: newPost.title,
      body: newPost.body,
      tags: newPost.tags.split(',').map((t) => t.trim()).filter(Boolean),
    })
    setNewPost({ title: '', body: '', tags: '' })
    setPostOpen(false)
  }

  const userRank = leaderboard.find((e) => e.name === 'You')?.rank || 3

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Feed</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Share updates and learn from the community
          </p>
        </div>
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-btn"><Plus className="h-4 w-4" /> Create post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Share with the community</DialogTitle></DialogHeader>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} className="mt-1" placeholder="What's on your mind?" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea value={newPost.body} onChange={(e) => setNewPost({ ...newPost, body: e.target.value })} className="mt-1 min-h-[100px]" placeholder="Share tips, wins, or questions..." />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input value={newPost.tags} onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })} className="mt-1" placeholder="React, freelancing" />
              </div>
              <Button className="w-full gradient-btn" onClick={handleCreatePost}>Publish (+10 pts)</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Your points', value: userPoints.toLocaleString(), icon: Zap, color: 'text-[#0a66c2]' },
          { label: 'Leaderboard rank', value: `#${userRank}`, icon: Trophy, color: 'text-amber-600' },
          { label: 'Challenges joined', value: joinedChallenges.length, icon: Flame, color: 'text-orange-600' },
          { label: 'Posts', value: posts.filter((p) => p.author === 'You').length, icon: MessageCircle, color: 'text-[#0a66c2]' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <s.icon className={cn('h-8 w-8', s.color)} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <Tabs defaultValue="feed">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* FEED */}
        <TabsContent value="feed" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All', ...TRENDING_TAGS.slice(0, 5)].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      activeTag === tag
                        ? 'border-[#0a66c2] bg-[#0a66c2]/10 text-[#0a66c2]'
                        : 'border-[#e0e0e0] bg-white text-[hsl(var(--muted-foreground))] hover:bg-[#f3f2ef]'
                    )}
                  >
                    <Hash className="mr-1 inline h-3 w-3" />
                    {tag}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="popLayout">
                {filteredPosts.length === 0 ? (
                  <GlassCard className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                    No posts match your filters. Be the first to post!
                  </GlassCard>
                ) : (
                  filteredPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <GlassCard>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef3f8] text-sm font-semibold text-[#0a66c2]">
                            {post.author.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{post.author}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{post.time}</p>
                          </div>
                        </div>
                        <h3 className="mt-3 font-semibold">{post.title}</h3>
                        {post.body && <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{post.body}</p>}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {(post.tags || []).map((t) => (
                            <Badge key={t} variant="secondary">{t}</Badge>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center gap-6 border-t border-[#e0e0e0] pt-3">
                          <button
                            type="button"
                            onClick={() => toggleLike(post.id)}
                            className={cn(
                              'flex items-center gap-1.5 text-sm font-medium transition-colors',
                              post.liked ? 'text-[#0a66c2]' : 'text-[hsl(var(--muted-foreground))] hover:text-[#0a66c2]'
                            )}
                          >
                            <Heart className={cn('h-4 w-4', post.liked && 'fill-current')} />
                            Like · {post.likes}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCommentPostId(post.id)}
                            className="flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[#0a66c2]"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {post.commentCount ?? post.comments?.length ?? 0}
                          </button>
                        </div>
                        {(post.comments?.length > 0) && (
                          <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                            {post.comments.slice(-2).map((c) => (
                              <div key={c.id} className="rounded-sm bg-[#f3f2ef] px-3 py-2 text-xs">
                                <span className="font-semibold text-[#0a66c2]">{c.author}</span>
                                <span className="text-[hsl(var(--muted-foreground))]"> · {c.time}</span>
                                <p className="mt-0.5">{c.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </GlassCard>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <aside className="space-y-4">
              <GlassCard>
                <h3 className="flex items-center gap-2 font-semibold">
                  <Flame className="h-4 w-4 text-orange-400" /> Trending topics
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TRENDING_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { setActiveTag(tag); setSearch('') }}
                      className="rounded-sm bg-[#f3f2ef] px-2 py-1 text-xs font-medium text-[#0a66c2] hover:bg-[#eef3f8]"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="flex items-center gap-2 font-semibold">
                  <Trophy className="h-4 w-4 text-amber-400" /> Leaderboard
                </h3>
                <div className="mt-3 space-y-2">
                  {leaderboard.slice(0, 5).map((entry) => (
                    <div
                      key={entry.rank}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm',
                        entry.name === 'You' ? 'bg-[#0a66c2]/8 ring-1 ring-[#0a66c2]/30' : 'bg-[#f3f2ef]'
                      )}
                    >
                      <span className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                        entry.rank === 1 && 'bg-amber-500/30 text-amber-300',
                        entry.rank === 2 && 'bg-slate-400/30',
                        entry.rank === 3 && 'bg-orange-700/30',
                        entry.rank > 3 && 'bg-white/10'
                      )}>
                        {entry.rank}
                      </span>
                      <span className="flex-1 font-medium truncate">{entry.name}</span>
                      <span className="font-medium text-[#0a66c2]">{entry.points} pts</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </aside>
          </div>
        </TabsContent>

        {/* CHALLENGES */}
        <TabsContent value="challenges" className="mt-4 space-y-4">
          {canJoinPrograms && (
            <p className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
              Join client-hosted challenges to build skills and earn community points.
            </p>
          )}
          {canCreatePrograms && (
          <div className="flex justify-end">
            <Dialog open={challengeOpen} onOpenChange={setChallengeOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-btn"><Plus className="h-4 w-4" /> Create challenge</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Launch a community challenge</DialogTitle></DialogHeader>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input value={newChallenge.title} onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })} className="mt-1" placeholder="30-Day React Sprint" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newChallenge.desc} onChange={(e) => setNewChallenge({ ...newChallenge, desc: e.target.value })} className="mt-1 min-h-[80px]" placeholder="What should participants do each day?" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Tag</Label>
                      <Input value={newChallenge.tag} onChange={(e) => setNewChallenge({ ...newChallenge, tag: e.target.value })} className="mt-1" placeholder="React" />
                    </div>
                    <div>
                      <Label>Prize</Label>
                      <Input value={newChallenge.prize} onChange={(e) => setNewChallenge({ ...newChallenge, prize: e.target.value })} className="mt-1" placeholder="500 pts" />
                    </div>
                  </div>
                  <div>
                    <Label>Days left</Label>
                    <Input type="number" min={1} value={newChallenge.daysLeft} onChange={(e) => setNewChallenge({ ...newChallenge, daysLeft: e.target.value })} className="mt-1" />
                  </div>
                  <Button
                    className="w-full gradient-btn"
                    onClick={() => {
                      if (!newChallenge.title.trim()) return
                      createChallenge(newChallenge)
                      setNewChallenge({ title: '', desc: '', tag: '', prize: '', daysLeft: '7' })
                      setChallengeOpen(false)
                    }}
                  >
                    Publish challenge (+30 pts)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((ch) => {
              const joined = joinedChallenges.includes(ch.id)
              return (
                <GlassCard key={ch.id}>
                  <Badge className="mb-2">{ch.tag}</Badge>
                  <h3 className="font-semibold">{ch.title}</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{ch.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{ch.participants} joined</span>
                    <span>🏆 {ch.prize}</span>
                    <span>{ch.daysLeft}d left</span>
                  </div>
                  {canJoinPrograms ? (
                    <Button
                      className={cn('mt-4 w-full', joined ? '' : 'gradient-btn')}
                      variant={joined ? 'outline' : 'default'}
                      onClick={() => joinChallenge(ch.id)}
                      disabled={joined}
                    >
                      {joined ? (
                        <><CheckCircle2 className="h-4 w-4" /> Joined (+50 pts)</>
                      ) : (
                        'Join challenge'
                      )}
                    </Button>
                  ) : canCreatePrograms ? (
                    <p className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                      Open to freelancers — you host this listing
                    </p>
                  ) : null}
                </GlassCard>
              )
            })}
          </div>
        </TabsContent>

        {/* MENTORSHIP */}
        <TabsContent value="mentorship" className="mt-4 space-y-4">
          {canJoinPrograms && (
            <p className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
              Book mentorship sessions offered by clients.
            </p>
          )}
          {canCreatePrograms && (
          <div className="flex justify-end">
            <Dialog open={mentorOpen} onOpenChange={setMentorOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-btn"><Plus className="h-4 w-4" /> Offer mentorship</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Offer a mentorship session</DialogTitle></DialogHeader>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label>Your name</Label>
                    <Input value={newMentor.mentor} onChange={(e) => setNewMentor({ ...newMentor, mentor: e.target.value })} className="mt-1" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <Label>Skill / topic</Label>
                    <Input value={newMentor.skill} onChange={(e) => setNewMentor({ ...newMentor, skill: e.target.value })} className="mt-1" placeholder="React Architecture" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Available slots</Label>
                      <Input type="number" min={1} value={newMentor.slots} onChange={(e) => setNewMentor({ ...newMentor, slots: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Rating (1–5)</Label>
                      <Input type="number" min={1} max={5} step={0.1} value={newMentor.rating} onChange={(e) => setNewMentor({ ...newMentor, rating: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                  <Button
                    className="w-full gradient-btn"
                    onClick={() => {
                      if (!newMentor.mentor.trim() || !newMentor.skill.trim()) return
                      createMentorship(newMentor)
                      setNewMentor({ mentor: '', skill: '', slots: '3', rating: '5' })
                      setMentorOpen(false)
                    }}
                  >
                    List mentorship (+20 pts)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {mentorships.map((m) => {
              const booked = bookedMentors.includes(m.id)
              return (
                <GlassCard key={m.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-lg font-bold">
                      {m.mentor.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{m.mentor}</p>
                      <p className="text-sm text-purple-300">{m.skill}</p>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {m.rating}
                        <span className="text-[hsl(var(--muted-foreground))]">· {m.slots} slots left</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                    1:1 session — portfolio review, career advice, or technical deep-dive.
                  </p>
                  {canJoinPrograms ? (
                    <Button
                      className="mt-4 w-full"
                      variant={booked ? 'outline' : 'default'}
                      disabled={booked || m.slots < 1}
                      onClick={() => bookMentor(m.id)}
                    >
                      {booked ? (
                        <><CheckCircle2 className="h-4 w-4" /> Session booked</>
                      ) : (
                        <><Users className="h-4 w-4" /> Book free intro</>
                      )}
                    </Button>
                  ) : canCreatePrograms ? (
                    <p className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                      Freelancers can book available slots
                    </p>
                  ) : null}
                </GlassCard>
              )
            })}
          </div>
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-4 space-y-4">
          {canJoinPrograms && (
            <p className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
              Register for client-hosted events and workshops.
            </p>
          )}
          {canCreatePrograms && (
          <div className="flex justify-end">
            <Dialog open={eventOpen} onOpenChange={setEventOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-btn"><Plus className="h-4 w-4" /> Create event</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Host a community event</DialogTitle></DialogHeader>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="mt-1" placeholder="Freelancer AMA: Pricing Projects" />
                  </div>
                  <div>
                    <Label>Host</Label>
                    <Input value={newEvent.host} onChange={(e) => setNewEvent({ ...newEvent, host: e.target.value })} className="mt-1" placeholder="Your name or team" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Date</Label>
                      <Input value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="mt-1" placeholder="Jun 2, 2026" />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="mt-1" placeholder="6:00 PM IST" />
                    </div>
                  </div>
                  <div>
                    <Label>Event type</Label>
                    <Select
                      className="mt-1"
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    >
                      <option value="live">Live AMA</option>
                      <option value="workshop">Workshop</option>
                      <option value="webinar">Webinar</option>
                      <option value="meetup">Meetup</option>
                    </Select>
                  </div>
                  <Button
                    className="w-full gradient-btn"
                    onClick={() => {
                      if (!newEvent.title.trim()) return
                      createEvent(newEvent)
                      setNewEvent({ title: '', host: '', date: '', time: '', type: 'live' })
                      setEventOpen(false)
                    }}
                  >
                    Publish event (+25 pts)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((ev) => {
              const registered = registeredEvents.includes(ev.id)
              return (
                <GlassCard key={ev.id}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <Badge variant="secondary">{ev.type}</Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{ev.title}</h3>
                  <p className="mt-1 text-sm text-purple-300">Hosted by {ev.host}</p>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    {ev.date} · {ev.time}
                  </p>
                  <p className="mt-1 text-xs">{ev.attendees} attending</p>
                  {canJoinPrograms ? (
                    <Button
                      className={cn('mt-4 w-full', !registered && 'gradient-btn')}
                      variant={registered ? 'outline' : 'default'}
                      disabled={registered}
                      onClick={() => registerEvent(ev.id)}
                    >
                      {registered ? (
                        <><CheckCircle2 className="h-4 w-4" /> Registered (+25 pts)</>
                      ) : (
                        'Register'
                      )}
                    </Button>
                  ) : canCreatePrograms ? (
                    <p className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                      Freelancers register from their account
                    </p>
                  ) : null}
                </GlassCard>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Comments dialog */}
      <Dialog open={!!commentPostId} onOpenChange={(open) => !open && setCommentPostId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-8">{activePost?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 max-h-60 space-y-3 overflow-y-auto">
            {(activePost?.comments || []).length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No comments yet. Start the conversation!</p>
            ) : (
              activePost.comments.map((c) => (
                <div key={c.id} className="rounded-xl bg-white/5 p-3 text-sm">
                  <p className="font-medium text-purple-300">{c.author}</p>
                  <p className="mt-1">{c.text}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{c.time}</p>
                </div>
              ))
            )}
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              addComment(commentPostId, commentText)
              setCommentText('')
            }}
          >
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
            />
            <Button type="submit" className="gradient-btn" disabled={!commentText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
