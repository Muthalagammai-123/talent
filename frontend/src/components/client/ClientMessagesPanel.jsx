import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Loader2, Bot, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useMessages } from '@/contexts/MessagesContext'
import { useClient } from '@/contexts/ClientContext'
import { cn } from '@/lib/utils'

export function ClientMessagesPanel({ compact = false }) {
  const {
    conversationList,
    active,
    activeId,
    setActive,
    sendMessage,
    ensureThread,
    isReplying,
    chatError,
    apiKeyConfigured,
    totalUnread,
  } = useMessages()
  const { proposals, hires, projects } = useClient()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages, isReplying])

  const handleSend = async () => {
    if (!input.trim() || isReplying) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const quickContacts = useMemo(() => {
    const fromProposals = proposals
      .filter((p) => ['pending', 'shortlisted', 'accepted'].includes(p.status))
      .slice(0, 3)
      .map((p) => ({
        name: p.freelancer,
        project: projects.find((pr) => pr.id === p.projectId)?.title,
      }))
    const fromHires = hires.slice(0, 2).map((h) => ({ name: h.name, project: h.project }))
    const seen = new Set()
    return [...fromProposals, ...fromHires].filter((c) => {
      if (seen.has(c.name)) return false
      seen.add(c.name)
      return true
    })
  }, [proposals, hires, projects])

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            Messages with freelancers
            {totalUnread > 0 && <Badge variant="default">{totalUnread} new</Badge>}
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Groq-powered replies simulate freelancer responses for hiring discussions
          </p>
        </div>
      </div>

      {!apiKeyConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          Add Groq API key in Messages settings or .env to enable live chat
        </div>
      )}

      {quickContacts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))] w-full">Quick chat:</span>
          {quickContacts.map((c) => (
            <Button
              key={c.name}
              size="sm"
              variant="outline"
              onClick={() => ensureThread(c.name, c.project)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      )}

      <div
        className={cn(
          'flex overflow-hidden rounded-2xl border border-white/10 glass',
          compact ? 'h-[420px]' : 'h-[calc(100vh-14rem)] min-h-[480px]'
        )}
      >
        <aside className="w-full max-w-[220px] shrink-0 overflow-y-auto border-r border-white/10 sm:max-w-xs">
          {conversationList.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(m.id)}
              className={cn(
                'flex w-full gap-2 border-b border-white/5 p-3 text-left hover:bg-white/5',
                activeId === m.id && 'bg-purple-500/10'
              )}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback name={m.user} />
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.user}</p>
                {m.project && (
                  <p className="truncate text-[10px] text-purple-300">{m.project}</p>
                )}
                <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{m.last}</p>
              </div>
              {m.unread > 0 && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-[10px] text-white">
                  {m.unread}
                </span>
              )}
            </button>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {active ? (
            <>
              <header className="border-b border-white/10 px-3 py-2">
                <p className="font-semibold text-sm">{active.meta.user}</p>
                <p className="flex items-center gap-1 text-xs text-emerald-400">
                  <Bot className="h-3 w-3" />
                  {apiKeyConfigured ? (isReplying ? 'Freelancer typing...' : 'AI freelancer · online') : 'Offline'}
                </p>
                {active.meta.project && (
                  <Badge variant="secondary" className="mt-1 text-[10px]">{active.meta.project}</Badge>
                )}
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {active.messages.map((msg) => (
                  <div key={msg.id} className={cn('flex gap-2', msg.self && 'flex-row-reverse')}>
                    {!msg.self && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback name={msg.sender} />
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                        msg.self && 'bg-purple-600/50 text-white',
                        !msg.self && 'bg-white/10',
                        msg.isError && 'border border-red-500/40 bg-red-500/10'
                      )}
                    >
                      {msg.isTyping ? (
                        <span className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                          <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                        </span>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {chatError && <p className="px-3 text-xs text-red-400">{chatError}</p>}

              <footer className="border-t border-white/10 p-2">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about timeline, budget, deliverables..."
                    disabled={isReplying || !apiKeyConfigured}
                    className="flex h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm disabled:opacity-50"
                  />
                  <Button type="submit" size="sm" className="gradient-btn" disabled={isReplying || !apiKeyConfigured || !input.trim()}>
                    {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </footer>
            </>
          ) : (
            <p className="m-auto text-sm text-[hsl(var(--muted-foreground))]">Select a conversation</p>
          )}
        </div>
      </div>
    </div>
  )
}
