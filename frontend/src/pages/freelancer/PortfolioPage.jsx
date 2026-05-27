import { Link } from 'react-router-dom'
import { ExternalLink, Sparkles, GraduationCap, Briefcase, Code2, Award, Target, Pencil, FileText } from 'lucide-react'
import { PostMedia } from '@/components/posts/PostMedia'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/GlassCard'
import { usePortfolio } from '@/contexts/PortfolioContext'
import { useAuth } from '@/contexts/AuthContext'
import { VerifiedBadge, TrustScorePill } from '@/components/shared/VerifiedBadge'

const gradients = {
  'gradient-1': 'from-violet-600 to-purple-700',
  'gradient-2': 'from-fuchsia-600 to-pink-700',
  'gradient-3': 'from-indigo-600 to-blue-700',
}

export function PortfolioPage() {
  const { portfolio } = usePortfolio()
  const { verification } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <Link to="/freelancer/portfolio/create">
          <Button className="gradient-btn"><Pencil className="h-4 w-4" /> Edit portfolio</Button>
        </Link>
      </div>

      <GlassCard>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar className="h-24 w-24">
            {portfolio.profilePhoto && <AvatarImage src={portfolio.profilePhoto} alt={portfolio.name} />}
            <AvatarFallback name={portfolio.name} className="text-2xl" />
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{portfolio.name}</h2>
              {verification && <VerifiedBadge status={verification.status} />}
              {verification?.trustScore != null && <TrustScorePill score={verification.trustScore} />}
            </div>
            <p className="text-[#0a66c2] font-medium">{portfolio.title}</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{portfolio.location}</p>
            <p className="mt-3 text-sm font-medium">{portfolio.bio}</p>
            {portfolio.description && portfolio.description !== portfolio.bio && (
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{portfolio.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {portfolio.skills?.map((s) => <Badge key={s}>{s}</Badge>)}
            </div>
          </div>
          <div className="rounded-2xl bg-purple-500/10 px-4 py-3 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-purple-400" />
            <p className="mt-1 text-2xl font-bold text-purple-300">{portfolio.aiScore}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">AI score · {portfolio.completion}% complete</p>
          </div>
        </div>
      </GlassCard>

      {portfolio.interests?.length > 0 && (
        <GlassCard>
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-purple-400" /> Areas of interest</h3>
          <div className="flex flex-wrap gap-2">
            {portfolio.interests.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}
          </div>
        </GlassCard>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 space-y-6">
          {portfolio.experience?.length > 0 && (
            <div>
              <h3 className="mb-4 font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" /> Experience</h3>
              {portfolio.experience.map((e) => (
                <div key={e.company} className="mb-4 border-b border-white/10 pb-4 last:border-0">
                  <p className="font-medium">{e.role}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{e.company} · {e.period}</p>
                </div>
              ))}
            </div>
          )}
          <div>
            <h3 className="mb-4 font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Education</h3>
            {portfolio.education?.map((e) => (
              <p key={e.school} className="text-sm mb-2">{e.degree} — {e.school} ({e.year})</p>
            ))}
          </div>
          {portfolio.certifications?.length > 0 && (
            <div>
              <h3 className="mb-4 font-semibold flex items-center gap-2"><Award className="h-4 w-4" /> Certifications</h3>
              {portfolio.certifications.map((c) => (
                <div key={c.id || c.name} className="mb-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-[hsl(var(--muted-foreground))]"> · {c.issuer} ({c.year})</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="mb-3 font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-400" /> AI suggestions</h3>
          <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            {portfolio.aiSuggestions?.map((s) => (
              <li key={s} className="rounded-xl bg-white/5 p-3">{s}</li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Project gallery</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.projects?.length === 0 && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No projects yet. <Link to="/freelancer/portfolio/create" className="text-purple-400 hover:underline">Add projects</Link></p>
          )}
          {portfolio.projects?.map((p) => (
            <GlassCard key={p.id || p.title} className="overflow-hidden p-0">
              <div className={`h-32 bg-gradient-to-br ${gradients[p.image] || gradients['gradient-1']}`} />
              <div className="p-4">
                <p className="font-semibold">{p.title}</p>
                {p.description && <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">{p.description}</p>}
                <div className="mt-3 flex gap-2">
                  {p.link && <Button variant="outline" size="sm"><Code2 className="h-3 w-3" /> GitHub</Button>}
                  {p.live && <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3" /> Live</Button>}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {portfolio.posts?.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5 text-purple-400" /> Your posts</h3>
          <div className="space-y-3">
            {portfolio.posts.map((post) => (
              <GlassCard key={post.id} className="p-4">
                {post.content && <p className="text-sm">{post.content}</p>}
                <PostMedia media={post.media} />
                <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                  {new Date(post.createdAt).toLocaleString()}
                  {post.media?.length ? ` · ${post.media.length} file(s)` : ''}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
