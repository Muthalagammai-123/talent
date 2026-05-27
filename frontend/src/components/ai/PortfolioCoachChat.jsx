import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { coachChatAI } from '@/lib/aiPortfolio'
import { cn } from '@/lib/utils'

const STARTERS = [
  'How can I improve my portfolio score?',
  'What projects should I add?',
  'Help me write a better bio',
  'How do I verify my top skills?',
]

export function PortfolioCoachChat({ portfolio, resumeText }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your TalentStage AI coach. I've read your portfolio. Ask me how to improve it, prepare for interviews, or stand out to clients.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setError('')
    setLoading(true)

    try {
      const reply = await coachChatAI({
        portfolio,
        resumeText,
        messages: nextMessages.filter((m) => m.role !== 'system'),
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I couldn't respond: ${err.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[420px] flex-col rounded-2xl border border-white/10 bg-white/5">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[90%] rounded-2xl px-4 py-2 text-sm',
              m.role === 'user' ? 'ml-auto bg-purple-600/50' : 'bg-white/10'
            )}
          >
            {m.role === 'assistant' && (
              <Bot className="mb-1 h-4 w-4 text-purple-400" />
            )}
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your portfolio...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/10 p-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="rounded-lg bg-white/5 px-2 py-1 text-xs hover:bg-purple-500/20"
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="px-4 text-xs text-red-400">{error}</p>}

      <form
        className="flex gap-2 border-t border-white/10 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI coach..."
          className="flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/40"
        />
        <Button type="submit" className="gradient-btn" disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
