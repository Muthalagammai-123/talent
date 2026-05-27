import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Key, Loader2, Bot, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useMessages } from '@/contexts/MessagesContext'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function MessagingPage() {
  const {
    conversationList,
    active,
    activeId,
    setActive,
    sendMessage,
    isReplying,
    chatError,
    apiKeyConfigured,
    saveApiKey,
    getGroqApiKey,
    isClient,
  } = useMessages()

  const [input, setInput] = useState('')
  const [keyInput, setKeyInput] = useState(() => getGroqApiKey())
  const [keySaved, setKeySaved] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
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

  const handleSaveKey = () => {
    saveApiKey(keyInput)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  if (!active) {
    return <p className="text-center text-[hsl(var(--muted-foreground))]">Select a conversation</p>
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">
          {isClient ? 'Messages with freelancers' : 'Messages'}
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {isClient
            ? 'Chat with freelancers about proposals, timelines, and deliverables. AI simulates freelancer replies.'
            : 'Chat with clients about projects. AI simulates client replies.'}
        </p>
      </div>

      {!apiKeyConfigured && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Connect Groq API for live AI chat replies
          </span>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-btn">Add API key</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Groq API settings</DialogTitle>
              </DialogHeader>
              <GroqKeyForm
                keyInput={keyInput}
                setKeyInput={setKeyInput}
                onSave={() => { handleSaveKey(); setSettingsOpen(false) }}
                keySaved={keySaved}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-white/10 glass">
        <aside className="w-full max-w-xs shrink-0 overflow-y-auto border-r border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <p className="font-semibold">{isClient ? 'Freelancers' : 'Messages'}</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Groq API settings">
                  <Key className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-400" /> Groq AI chat
                  </DialogTitle>
                </DialogHeader>
                <GroqKeyForm
                  keyInput={keyInput}
                  setKeyInput={setKeyInput}
                  onSave={handleSaveKey}
                  keySaved={keySaved}
                />
              </DialogContent>
            </Dialog>
          </div>
          {conversationList.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(m.id)}
              className={cn(
                'flex w-full gap-3 border-b border-white/5 p-4 text-left hover:bg-white/5',
                activeId === m.id && 'bg-purple-500/10'
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10"><AvatarFallback name={m.user} /></Avatar>
                <span
                  className={cn(
                    'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--card))]',
                    apiKeyConfigured && m.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="truncate text-sm font-medium">{m.user}</span>
                  <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">{m.time}</span>
                </div>
                {isClient && m.project && (
                  <p className="truncate text-[10px] text-purple-300">{m.project}</p>
                )}
                <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{m.last}</p>
              </div>
              {m.unread > 0 && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs text-white">
                  {m.unread}
                </span>
              )}
            </button>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="font-semibold">{active.meta.user}</p>
              {isClient && active.meta.project && (
                <Badge variant="secondary" className="mt-1 text-[10px]">{active.meta.project}</Badge>
              )}
              <p className="flex items-center gap-1 text-xs text-emerald-400">
                {apiKeyConfigured ? (
                  <>
                    <Bot className="h-3 w-3" />
                    {isClient ? 'AI freelancer' : 'Groq AI client'} · {isReplying ? 'typing...' : 'online'}
                  </>
                ) : (
                  'Offline — add API key'
                )}
              </p>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {active.messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.self && 'flex-row-reverse')}>
                {!msg.self && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback name={msg.sender} />
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                    msg.isError && 'border border-red-500/40 bg-red-500/10',
                    msg.self && !msg.isError && 'bg-purple-600/50 text-white',
                    !msg.self && !msg.isError && 'bg-white/10',
                    msg.isTyping && 'bg-white/5'
                  )}
                >
                  {msg.isTyping ? (
                    <span className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                      <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                    </span>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                  {!msg.isTyping && (
                    <p className="mt-1 text-[10px] opacity-60">{msg.time}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {chatError && (
            <p className="border-t border-white/10 px-4 py-2 text-xs text-red-400">{chatError}</p>
          )}

          <footer className="border-t border-white/10 p-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <Button type="button" variant="ghost" size="icon" title="Attach file" disabled={isReplying}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  apiKeyConfigured
                    ? isClient
                      ? 'Ask about timeline, budget, deliverables...'
                      : 'Message (powered by Groq)...'
                    : 'Add Groq API key to chat...'
                }
                disabled={isReplying || !apiKeyConfigured}
                className="flex h-10 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 disabled:opacity-50"
              />
              <Button type="submit" className="gradient-btn" disabled={isReplying || !apiKeyConfigured || !input.trim()}>
                {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </footer>
        </div>
      </div>
    </div>
  )
}

function GroqKeyForm({ keyInput, setKeyInput, onSave, keySaved }) {
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Get a free key at{' '}
        <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
          console.groq.com/keys
        </a>
        . Contacts reply using Groq AI (as freelancers when you are a client, or as clients when you are a freelancer).
      </p>
      <div>
        <Label htmlFor="groq-key">API key</Label>
        <Input
          id="groq-key"
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="gsk_..."
          className="mt-1 font-mono text-sm"
        />
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Or set <code className="rounded bg-white/10 px-1">VITE_GROQ_API_KEY</code> in a <code className="rounded bg-white/10 px-1">.env</code> file and restart the dev server.
      </p>
      <Button className="w-full gradient-btn" onClick={onSave} disabled={!keyInput.trim()}>
        {keySaved ? (
          <><CheckCircle2 className="h-4 w-4" /> Saved</>
        ) : (
          'Save API key'
        )}
      </Button>
    </div>
  )
}
