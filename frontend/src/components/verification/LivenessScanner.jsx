import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  startCamera,
  stopCamera,
  detectFacesInVideo,
  captureVideoFrame,
  faceBoxMovement,
  isFaceDetectionSupported,
} from '@/lib/faceDetect'

export function LivenessScanner({ onSuccess, busy }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const prevFacesRef = useRef(null)
  const stableRef = useRef(0)
  const movedRef = useRef(false)
  const doneRef = useRef(false)

  const [status, setStatus] = useState('idle')
  const [hint, setHint] = useState('Allow camera access to scan your face')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')

  const stop = useCallback(() => {
    stopCamera(streamRef.current)
    streamRef.current = null
  }, [])

  useEffect(() => () => stop(), [stop])

  const begin = async () => {
    setError('')
    setStatus('starting')
    try {
      const video = videoRef.current
      if (!video) return
      streamRef.current = await startCamera(video, 'user')
      setStatus('scanning')
      setHint(
        isFaceDetectionSupported()
          ? 'Center your face in the circle. Move slightly when prompted.'
          : 'Center your face in the circle and hold still.'
      )
    } catch (err) {
      setError(err.message || 'Camera access denied')
      setStatus('error')
    }
  }

  useEffect(() => {
    if (status !== 'scanning' || !videoRef.current) return

    const tick = async () => {
      if (doneRef.current) return
      const video = videoRef.current
      if (!video) return
      const result = await detectFacesInVideo(video)
      setScore(result.score)

      if (result.count === 1) {
        stableRef.current += 1
        if (faceBoxMovement(prevFacesRef.current, result.faces)) {
          movedRef.current = true
        }
        prevFacesRef.current = result.faces
        if (stableRef.current >= 4 && !movedRef.current && stableRef.current === 8) {
          setHint('Slowly turn your head left or right')
        }
        if (stableRef.current >= 5 && (movedRef.current || result.fallback)) {
          doneRef.current = true
          setStatus('passed')
          setHint('Face verified')
          const snapshot = captureVideoFrame(video)
          stop()
          onSuccess({
            snapshotDataUrl: snapshot,
            faceCount: 1,
            livenessScore: result.score,
            movementDetected: movedRef.current || result.fallback,
          })
        } else if (result.count === 1) {
          setHint('Hold still… detecting face')
        }
      } else if (result.count === 0) {
        stableRef.current = 0
        movedRef.current = false
        prevFacesRef.current = null
        setHint('Position your face inside the circle')
      } else {
        stableRef.current = 0
        setHint('Only one person should be visible')
      }
    }

    const id = setInterval(tick, 450)
    return () => clearInterval(id)
  }, [status, onSuccess, stop])

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-sm border border-[#e0e0e0] bg-[#1a1a1a]">
        <video
          ref={videoRef}
          className={cn('h-full w-full object-cover', status === 'idle' && 'opacity-30')}
          playsInline
          muted
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'h-48 w-48 rounded-full border-2 border-dashed',
              status === 'passed' ? 'border-[#057642]' : 'border-[#0a66c2]/70'
            )}
          />
        </div>
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#f3f2ef]/90 text-center">
            <Camera className="h-10 w-10 text-[#0a66c2]" />
            <p className="text-sm font-medium">Live face scan</p>
          </div>
        )}
        {status === 'passed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#057642]/20">
            <CheckCircle2 className="h-16 w-16 text-[#057642]" />
          </div>
        )}
      </div>

      <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">{hint}</p>
      {score > 0 && status === 'scanning' && (
        <p className="text-center text-xs text-[#0a66c2]">Confidence {Math.round(score * 100)}%</p>
      )}
      {error && (
        <p className="flex items-center justify-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {status === 'idle' && (
        <Button type="button" className="w-full gap-2" onClick={begin} disabled={busy}>
          <Camera className="h-4 w-4" /> Start face scan
        </Button>
      )}
      {status === 'starting' && (
        <p className="flex justify-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Starting camera…
        </p>
      )}
    </div>
  )
}
