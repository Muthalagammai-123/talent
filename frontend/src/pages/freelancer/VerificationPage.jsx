import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Loader2, CheckCircle2, AlertTriangle, BadgeCheck, Link2, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { GlassCard } from '@/components/shared/GlassCard'
import { VerifiedBadge, TrustScorePill } from '@/components/shared/VerifiedBadge'
import { VerificationStepper } from '@/components/verification/VerificationStepper'
import { LivenessScanner } from '@/components/verification/LivenessScanner'
import { ProfilePhotoCapture } from '@/components/verification/ProfilePhotoCapture'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { usePortfolio } from '@/contexts/PortfolioContext'

function formatAadhaarInput(value) {
  const d = value.replace(/\D/g, '').slice(0, 12)
  if (d.length <= 4) return d
  if (d.length <= 8) return `${d.slice(0, 4)} ${d.slice(4)}`
  return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`
}

export function VerificationPage() {
  const { user } = useAuth()
  const { portfolio, setProfilePhoto } = usePortfolio()
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [aadhaar, setAadhaar] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [demoHint, setDemoHint] = useState('')
  const [profileName, setProfileName] = useState(user?.name || portfolio.name || '')
  const [linkedInUrl, setLinkedInUrl] = useState('')

  const refresh = () =>
    api.getVerification().then((d) => {
      setVerification(d.verification)
      const v = d.verification
      if (v?.profileName) setProfileName(v.profileName)
      if (v?.linkedInUrl) setLinkedInUrl(v.linkedInUrl)
      if (v?.steps?.aadhaar && !v?.steps?.liveness) setStep(2)
      else if (v?.steps?.liveness && !v?.steps?.profilePhoto) setStep(3)
      else if (v?.steps?.profilePhoto && v.status !== 'verified') setStep(4)
      else if (v.status === 'verified') setStep(4)
    })

  useEffect(() => {
    refresh()
      .catch(() => setVerification({ status: 'unverified', trustScore: 50, steps: {} }))
      .finally(() => setLoading(false))
  }, [])

  const stepsDone = {
    aadhaar: verification?.steps?.aadhaar || verification?.aadhaarVerified,
    liveness: verification?.steps?.liveness || verification?.livenessPassed,
    profile: verification?.steps?.profilePhoto || verification?.hasProfilePhoto,
  }

  const sendOtp = async () => {
    const digits = aadhaar.replace(/\D/g, '')
    if (digits.length !== 12) {
      setError('Enter a valid 12-digit Aadhaar number')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await api.sendAadhaarOtp(digits)
      setOtpSent(true)
      setDemoHint(res.demoHint || '')
      setStep(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async () => {
    setBusy(true)
    setError('')
    try {
      const data = await api.verifyAadhaarOtp(aadhaar.replace(/\D/g, ''), otp)
      setVerification(data.verification)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submitLiveness = async (payload) => {
    setBusy(true)
    setError('')
    try {
      const data = await api.submitLiveness(payload)
      setVerification(data.verification)
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const savePhoto = async ({ photoDataUrl, profileName: name }) => {
    setBusy(true)
    setError('')
    try {
      const data = await api.saveVerificationPhoto({ photoDataUrl, profileName: name })
      setVerification(data.verification)
      setProfilePhoto(photoDataUrl)
      setProfileName(name)
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const finalSubmit = async () => {
    setBusy(true)
    setError('')
    try {
      const data = await api.submitVerification({
        profileName,
        linkedInUrl: linkedInUrl.trim() || undefined,
      })
      setVerification(data.verification)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const status = verification?.status || 'unverified'
  const canApply = verification?.canApply || status === 'verified'

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-12 text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading verification…
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Identity verification</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Aadhaar OTP, live face scan, and profile photo — required before applying to jobs. Sandbox only (not UIDAI).
        </p>
      </div>

      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          {status === 'verified' ? (
            <BadgeCheck className="h-8 w-8 text-[#0a66c2]" />
          ) : (
            <Shield className="h-8 w-8 text-[#666]" />
          )}
          <VerifiedBadge status={status} />
          <TrustScorePill score={verification?.trustScore ?? 50} />
          {verification?.aadhaarMasked && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              Aadhaar {verification.aadhaarMasked}
            </span>
          )}
        </div>
      </GlassCard>

      {status !== 'verified' && (
        <GlassCard className="p-6">
          <VerificationStepper
            current={step}
            completed={{
              aadhaar: stepsDone.aadhaar,
              liveness: stepsDone.liveness,
              profile: stepsDone.profile,
            }}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {step === 1 && (
                <>
                  <h2 className="font-semibold">Enter your Aadhaar</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    12 digits. We store a hash only — UIDAI OTP follows (demo).
                  </p>
                  <div>
                    <Label htmlFor="aadhaar">Aadhaar number</Label>
                    <Input
                      id="aadhaar"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(formatAadhaarInput(e.target.value))}
                      className="mt-1.5 font-mono tracking-wider"
                      placeholder="XXXX XXXX XXXX"
                      disabled={stepsDone.aadhaar}
                    />
                  </div>
                  {otpSent && !stepsDone.aadhaar && (
                    <div>
                      <Label htmlFor="otp">OTP from UIDAI</Label>
                      <Input
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="mt-1.5 font-mono"
                        placeholder="6-digit"
                        maxLength={6}
                      />
                      {demoHint && (
                        <p className="mt-1 text-xs text-[#0a66c2]">{demoHint}</p>
                      )}
                    </div>
                  )}
                  {!stepsDone.aadhaar && (
                    <div className="flex flex-col gap-2">
                      {!otpSent ? (
                        <Button onClick={sendOtp} disabled={busy}>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
                        </Button>
                      ) : (
                        <Button onClick={verifyOtp} disabled={busy || otp.length !== 6}>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify OTP'}
                        </Button>
                      )}
                    </div>
                  )}
                  {stepsDone.aadhaar && (
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Continue to liveness <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-semibold">Liveness check</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Use your camera so we can confirm a real person matches your profile.
                  </p>
                  {stepsDone.liveness ? (
                    <div className="flex items-center gap-2 text-[#057642]">
                      <CheckCircle2 className="h-5 w-5" /> Face scan complete
                      <Button variant="outline" size="sm" className="ml-auto" onClick={() => setStep(3)}>
                        Next
                      </Button>
                    </div>
                  ) : (
                    <LivenessScanner onSuccess={submitLiveness} busy={busy} />
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="font-semibold">Profile photo</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Take a clear photo for your freelancer profile.
                  </p>
                  {stepsDone.profile ? (
                    <div className="flex items-center gap-2 text-[#057642]">
                      <CheckCircle2 className="h-5 w-5" /> Photo saved
                      <Button variant="outline" size="sm" className="ml-auto" onClick={() => setStep(4)}>
                        Review & submit
                      </Button>
                    </div>
                  ) : (
                    <ProfilePhotoCapture
                      profileName={profileName}
                      onNameChange={setProfileName}
                      onCapture={savePhoto}
                      busy={busy}
                    />
                  )}
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="font-semibold">Review & submit</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#057642]" /> Aadhaar verified
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#057642]" /> Liveness passed
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#057642]" /> Profile photo added
                    </li>
                  </ul>
                  <div>
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" /> LinkedIn (optional)
                    </Label>
                    <Input
                      id="linkedin"
                      value={linkedInUrl}
                      onChange={(e) => setLinkedInUrl(e.target.value)}
                      className="mt-1.5"
                      placeholder="https://www.linkedin.com/in/you"
                    />
                  </div>
                  <Button onClick={finalSubmit} disabled={busy} className="w-full">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit verification'}
                  </Button>
                </>
              )}

              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                </p>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-20 rounded-sm border border-[#e0e0e0] bg-[#f9fafb] p-6 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  Secure channel
                </p>
                <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-full border-2 border-dashed border-[#0a66c2]/40 bg-[#eef3f8]">
                  <span className="text-2xl font-bold text-[#0a66c2]">
                    {step === 1 ? 'ID' : step === 2 ? 'FACE' : step === 3 ? 'PHOTO' : 'OK'}
                  </span>
                </div>
                <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
                  {step === 1 && 'Government ID via Aadhaar OTP'}
                  {step === 2 && 'Live camera face match'}
                  {step === 3 && 'Professional profile image'}
                  {step === 4 && 'Ready for platform review'}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex flex-wrap gap-3">
        {canApply ? (
          <Link to="/freelancer/projects">
            <Button className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Browse jobs
            </Button>
          </Link>
        ) : (
          <Link to="/freelancer/portfolio/create">
            <Button variant="outline">Complete portfolio</Button>
          </Link>
        )}
        <Link to="/freelancer">
          <Button variant="ghost">Back to home</Button>
        </Link>
      </div>
    </div>
  )
}
