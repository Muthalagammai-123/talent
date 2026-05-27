import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

export function AIAssistantWidget() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [reply, setReply] = useState(null)
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const result = await api.aiTaskBreakdown(prompt)
      setReply(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass fixed bottom-24 right-6 z-50 w-96 rounded-xl border border-white/10 p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Bot className="h-5 w-5 text-indigo-400" />
                AI Assistant
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Break down a feature..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
              />
              <Button size="icon" onClick={ask} disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {loading && <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Thinking...</p>}
            {reply && (
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                {reply.tasks.map((t, i) => (
                  <li key={i} className="rounded-lg bg-white/5 px-3 py-2">
                    {t.title} <span className="text-indigo-400">({t.estimate})</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
