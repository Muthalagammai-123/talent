import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, Loader2, Phone, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function VoiceInterviewPanel({ transcript, onStart, onSendMessage, busy, complete }) {
  const [listening, setListening] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [voiceOn, setVoiceOn] = useState(true)
  const [started, setStarted] = useState(false)
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef(null)
  const lastSpokenRef = useRef('')

  useEffect(() => {
    setSupported(!!getSpeechRecognition() && 'speechSynthesis' in window)
  }, [])

  const speak = useCallback(
    (text) => {
      if (!voiceOn || !text || text === lastSpokenRef.current) return
      lastSpokenRef.current = text
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.95
      u.pitch = 1
      window.speechSynthesis.speak(u)
    },
    [voiceOn]
  )

  useEffect(() => {
    const last = transcript.filter((m) => m.role === 'interviewer').pop()
    if (last?.text && started) speak(last.text)
  }, [transcript, started, speak])

  const startListening = () => {
    const SR = getSpeechRecognition()
    if (!SR) return
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      setLiveText(final || interim)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const begin = async () => {
    setStarted(true)
    await onStart()
  }

  const submitAnswer = async () => {
    const text = liveText.trim()
    if (!text) return
    stopListening()
    setLiveText('')
    await onSendMessage(text)
  }

  if (!supported) {
    return (
      <p className="text-sm text-amber-700">
        Voice interview requires Chrome or Edge. Use the text fallback in settings or switch browser.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Round 3 — AI voice interview</h2>
        <label className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} />
          AI voice replies
        </label>
      </div>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Speak your answers. The AI interviewer listens and responds by voice — like a professional screening call.
      </p>

      {!started ? (
        <Button onClick={begin} disabled={busy} className="gap-2">
          <Phone className="h-4 w-4" />
          Start voice interview
        </Button>
      ) : (
        <>
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg bg-[#f3f2ef] p-4">
            {transcript.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  m.role === 'candidate' ? 'ml-6 border-l-2 border-[#0a66c2] bg-white' : 'mr-6 bg-[#eef3f8]'
                )}
              >
                <p className="flex items-center gap-1 text-xs font-semibold text-[#0a66c2] capitalize">
                  {m.role === 'interviewer' && <Volume2 className="h-3 w-3" />}
                  {m.role}
                </p>
                <p className="mt-1">{m.text}</p>
              </div>
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Loader2 className="h-4 w-4 animate-spin" /> AI is thinking…
              </p>
            )}
          </div>

          {!complete && (
            <div className="rounded-lg border border-[#0a66c2]/30 bg-[#eef3f8] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0a66c2]">Your answer</p>
              <p className="mt-2 min-h-[48px] text-sm">{liveText || 'Tap the mic and speak…'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={listening ? 'destructive' : 'default'}
                  onClick={listening ? stopListening : startListening}
                  disabled={busy}
                  className="gap-2"
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {listening ? 'Stop mic' : 'Hold to answer'}
                </Button>
                <Button onClick={submitAnswer} disabled={busy || !liveText.trim()}>
                  Send answer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.speechSynthesis.cancel()}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
