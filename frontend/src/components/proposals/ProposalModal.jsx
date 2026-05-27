import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { notifyProjectsUpdated } from '@/lib/projectsSync'

export function ProposalModal({ project, open, onOpenChange }) {
  const [bid, setBid] = useState('')
  const [timeline, setTimeline] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(false)

  const previewScore = async () => {
    setLoading(true)
    try {
      const result = await api.scoreProposal({ bid, timeline, coverLetter })
      setScore(result)
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    setLoading(true)
    try {
      if (project.id) {
        await api.submitProposal({
          projectId: project.id,
          bid: parseInt(bid, 10),
          timeline,
          coverLetter,
          aiScore: score?.score,
        })
        notifyProjectsUpdated()
      }
      onOpenChange(false)
      setScore(null)
      setBid('')
      setTimeline('')
      setCoverLetter('')
    } catch (err) {
      alert(err.message || 'Failed to submit proposal')
    } finally {
      setLoading(false)
    }
  }

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit proposal</DialogTitle>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{project.title}</p>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Bid amount ($)</Label>
            <Input type="number" value={bid} onChange={(e) => setBid(e.target.value)} className="mt-1" placeholder="4200" />
          </div>
          <div>
            <Label>Timeline</Label>
            <Input value={timeline} onChange={(e) => setTimeline(e.target.value)} className="mt-1" placeholder="3 weeks" />
          </div>
          <div>
            <Label>Cover letter</Label>
            <Textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="mt-1 min-h-[120px]"
              placeholder="Explain why you're the best fit..."
            />
          </div>

          {score && (
            <div className="rounded-2xl bg-purple-500/10 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles className="h-4 w-4 text-purple-400" /> AI proposal score
                </span>
                <span className="text-lg font-bold text-purple-300">{score.score}/100</span>
              </div>
              <Progress value={score.score} className="mt-2" />
              <ul className="mt-3 space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                {score.tips.map((t) => <li key={t}>• {t}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={previewScore} disabled={loading}>
              {loading ? 'Scoring...' : 'Preview AI score'}
            </Button>
            <Button className="flex-1 gradient-btn" onClick={submit}>Submit proposal</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
