import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera, Plus, X, GraduationCap, Award, Target, Briefcase, FileText, Eye, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { PostComposer } from '@/components/posts/PostComposer'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/shared/GlassCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePortfolio } from '@/contexts/PortfolioContext'
import { compressImage } from '@/lib/imageUtils'

const INTEREST_SUGGESTIONS = ['Web Development', 'Mobile Apps', 'UI/UX Design', 'AI/ML', 'DevOps', 'E-commerce']
const SKILL_SUGGESTIONS = ['React', 'Node.js', 'TypeScript', 'Python', 'Figma', 'AWS']

function TagInput({ label, tags, onChange, suggestions = [] }) {
  const inputRef = useRef(null)

  const add = (tag) => {
    const t = (tag || inputRef.current?.value || '').trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} className="gap-1 pr-1">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
          placeholder="Type and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={() => add()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {suggestions.filter((s) => !tags.includes(s)).slice(0, 6).map((s) => (
          <button key={s} type="button" onClick={() => add(s)} className="rounded-lg bg-white/5 px-2 py-1 text-xs hover:bg-purple-500/20">
            + {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PortfolioCreatePage() {
  const {
    portfolio,
    saveError,
    lastSaved,
    updatePortfolio,
    setProfilePhoto,
    addProject,
    updateProject,
    removeProject,
    addEducation,
    updateEducation,
    removeEducation,
    addCertification,
    updateCertification,
    removeCertification,
    addPost,
  } = usePortfolio()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [photoLoading, setPhotoLoading] = useState(false)

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG, PNG, etc.)')
      return
    }
    setPhotoLoading(true)
    try {
      const compressed = await compressImage(file, 480, 0.85)
      setProfilePhoto(compressed)
    } catch {
      alert('Could not load image. Try another file.')
    } finally {
      setPhotoLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Portfolio</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Changes save automatically as you edit</p>
          {lastSaved && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Saved {new Date(lastSaved).toLocaleTimeString()}
            </p>
          )}
          {saveError && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" /> {saveError}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/freelancer/portfolio">
            <Button type="button" variant="outline"><Eye className="h-4 w-4" /> Preview</Button>
          </Link>
        </div>
      </div>

      <GlassCard>
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Camera className="h-5 w-5 text-purple-400" /> Profile photo</h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <Avatar className="h-28 w-28">
              {portfolio.profilePhoto && <AvatarImage src={portfolio.profilePhoto} alt="Profile" />}
              <AvatarFallback name={portfolio.name || 'You'} className="text-2xl" />
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoLoading}
              className="absolute bottom-0 right-0 rounded-full bg-purple-600 p-2 shadow-lg hover:bg-purple-500 disabled:opacity-50"
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
            {photoLoading && (
              <p className="absolute -bottom-6 left-0 text-xs text-purple-300">Uploading...</p>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input value={portfolio.name || ''} onChange={(e) => updatePortfolio({ name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Professional title</Label>
                <Input value={portfolio.title || ''} onChange={(e) => updatePortfolio({ title: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={portfolio.location || ''} onChange={(e) => updatePortfolio({ location: e.target.value })} className="mt-1" />
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><FileText className="h-5 w-5 text-purple-400" /> About you</h2>
        <div className="space-y-4">
          <div>
            <Label>Bio</Label>
            <Input value={portfolio.bio || ''} onChange={(e) => updatePortfolio({ bio: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={portfolio.description || ''}
              onChange={(e) => updatePortfolio({ description: e.target.value })}
              className="mt-1 min-h-[140px]"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-purple-400" /> Skills & interests</h2>
        <div className="space-y-6">
          <TagInput label="Skill set" tags={portfolio.skills || []} onChange={(skills) => updatePortfolio({ skills })} suggestions={SKILL_SUGGESTIONS} />
          <TagInput label="Areas of interest" tags={portfolio.interests || []} onChange={(interests) => updatePortfolio({ interests })} suggestions={INTEREST_SUGGESTIONS} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><GraduationCap className="h-5 w-5 text-purple-400" /> Education</h2>
          <Button type="button" variant="outline" size="sm" onClick={addEducation}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="space-y-4">
          {(portfolio.education || []).length === 0 && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Click Add to include education.</p>
          )}
          {(portfolio.education || []).map((edu, i) => (
            <motion.div key={`edu-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex justify-end">
                <button type="button" onClick={() => removeEducation(i)}><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label>School</Label>
                  <Input value={edu.school || ''} onChange={(e) => updateEducation(i, 'school', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input value={edu.year || ''} onChange={(e) => updateEducation(i, 'year', e.target.value)} className="mt-1" />
                </div>
                <div className="sm:col-span-3">
                  <Label>Degree</Label>
                  <Input value={edu.degree || ''} onChange={(e) => updateEducation(i, 'degree', e.target.value)} className="mt-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><Award className="h-5 w-5 text-purple-400" /> Certifications</h2>
          <Button type="button" variant="outline" size="sm" onClick={addCertification}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="space-y-4">
          {(portfolio.certifications || []).map((cert, i) => (
            <div key={cert.id || i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex justify-end">
                <button type="button" onClick={() => removeCertification(i)}><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input value={cert.name || ''} onChange={(e) => updateCertification(i, 'name', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input value={cert.year || ''} onChange={(e) => updateCertification(i, 'year', e.target.value)} className="mt-1" />
                </div>
                <div className="sm:col-span-3">
                  <Label>Issuer</Label>
                  <Input value={cert.issuer || ''} onChange={(e) => updateCertification(i, 'issuer', e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><Briefcase className="h-5 w-5 text-purple-400" /> Projects</h2>
          <Button type="button" variant="outline" size="sm" onClick={addProject}><Plus className="h-4 w-4" /> Add project</Button>
        </div>
        <div className="space-y-4">
          {(portfolio.projects || []).length === 0 && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No projects yet — click Add project.</p>
          )}
          {(portfolio.projects || []).map((proj) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-purple-500/20 bg-white/5 p-4"
            >
              <div className="mb-3 flex justify-end">
                <button type="button" onClick={() => removeProject(proj.id)} aria-label="Remove project">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Project title</Label>
                  <Input value={proj.title || ''} onChange={(e) => updateProject(proj.id, 'title', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={proj.description || ''} onChange={(e) => updateProject(proj.id, 'description', e.target.value)} className="mt-1" rows={2} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>GitHub link</Label>
                    <Input value={proj.link || ''} onChange={(e) => updateProject(proj.id, 'link', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Live URL</Label>
                    <Input value={proj.live || ''} onChange={(e) => updateProject(proj.id, 'live', e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><FileText className="h-5 w-5 text-purple-400" /> Create post</h2>
        <p className="mb-3 text-sm text-[hsl(var(--muted-foreground))]">Add text, photos, or videos to your portfolio feed.</p>
        <PostComposer onPublish={addPost} posts={portfolio.posts || []} />
      </GlassCard>

      <div className="flex justify-end gap-3 pb-8">
        <Button type="button" variant="outline" onClick={() => navigate('/freelancer')}>Back</Button>
        <Button type="button" className="gradient-btn" onClick={() => navigate('/freelancer/portfolio')}>
          View portfolio
        </Button>
      </div>
    </div>
  )
}
