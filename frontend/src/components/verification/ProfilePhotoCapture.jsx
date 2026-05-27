import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label, Input } from '@/components/ui/input'
import { startCamera, stopCamera, captureVideoFrame } from '@/lib/faceDetect'

export function ProfilePhotoCapture({ profileName, onNameChange, onCapture, busy }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [live, setLive] = useState(false)
  const [error, setError] = useState('')

  const stop = useCallback(() => {
    stopCamera(streamRef.current)
    streamRef.current = null
    setLive(false)
  }, [])

  useEffect(() => () => stop(), [stop])

  const openCamera = async () => {
    setError('')
    try {
      const video = videoRef.current
      if (!video) return
      streamRef.current = await startCamera(video, 'user')
      setLive(true)
      setPreview(null)
    } catch (err) {
      setError(err.message || 'Camera not available')
    }
  }

  const snap = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const url = captureVideoFrame(video)
    setPreview(url)
    stop()
  }

  const confirm = () => {
    if (!preview) return
    if (!profileName?.trim()) {
      setError('Enter your full name')
      return
    }
    onCapture({ photoDataUrl: preview, profileName: profileName.trim() })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="vName">Full name (as on Aadhaar)</Label>
        <Input
          id="vName"
          value={profileName}
          onChange={(e) => onNameChange(e.target.value)}
          className="mt-1.5"
          placeholder="Your legal name"
        />
      </div>

      <div className="relative mx-auto aspect-square max-w-xs overflow-hidden rounded-full border-4 border-[#e0e0e0] bg-[#eef3f8]">
        {preview ? (
          <img src={preview} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            style={{ display: live ? 'block' : 'none' }}
          />
        )}
        {!live && !preview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#666]">
            <Camera className="h-10 w-10" />
            <p className="mt-2 text-xs">Profile photo</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="flex flex-wrap justify-center gap-2">
        {!live && !preview && (
          <Button type="button" variant="outline" onClick={openCamera} className="gap-2">
            <Camera className="h-4 w-4" /> Open camera
          </Button>
        )}
        {live && (
          <Button type="button" onClick={snap} className="gap-2">
            <Camera className="h-4 w-4" /> Capture photo
          </Button>
        )}
        {preview && (
          <>
            <Button type="button" variant="outline" onClick={openCamera} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Retake
            </Button>
            <Button type="button" onClick={confirm} disabled={busy} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Save photo
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
