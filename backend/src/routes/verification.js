import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson, stringifyJson } from '../lib/json.js'
import { authRequired, loadUser, requireRole } from '../middleware/auth.js'
import { verifyIdentityAI } from '../lib/verification.js'
import { isAdminUser } from '../lib/admin.js'
import {
  normalizeAadhaar,
  validateAadhaar,
  maskAadhaar,
  hashAadhaar,
  hashOtp,
  generateOtp,
  DEMO_AADHAAR_OTP,
} from '../lib/aadhaar.js'

const router = Router()
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

async function getPortfolioName(userId) {
  const row = await prisma.portfolio.findUnique({ where: { userId } })
  const data = parseJson(row?.data, {})
  return data.name || ''
}

async function savePortfolioPhoto(userId, photoDataUrl, profileName) {
  const row = await prisma.portfolio.findUnique({ where: { userId } })
  const data = parseJson(row?.data, {})
  const next = {
    ...data,
    profilePhoto: photoDataUrl,
    name: profileName?.trim() || data.name,
  }
  await prisma.portfolio.upsert({
    where: { userId },
    create: { userId, data: stringifyJson(next) },
    update: { data: stringifyJson(next) },
  })
}

function imageByteSize(dataUrl) {
  if (!dataUrl) return 0
  const raw = String(dataUrl)
  const base64 = raw.includes(',') ? raw.split(',')[1] : raw
  return Buffer.byteLength(base64, 'base64')
}

function formatVerification(row, extra = {}) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.userId,
    method: row.method,
    linkedInUrl: row.linkedInUrl,
    aadhaarMasked: row.aadhaarMasked,
    aadhaarVerified: row.aadhaarVerified,
    livenessPassed: row.livenessPassed,
    livenessScore: row.livenessScore,
    hasProfilePhoto: Boolean(row.profilePhotoData),
    profileName: row.profileName,
    status: row.status,
    trustScore: row.trustScore,
    aiAnalysis: parseJson(row.aiAnalysis, null),
    flags: parseJson(row.flags, []),
    verifiedAt: row.verifiedAt,
    adminNote: row.adminNote,
    updatedAt: row.updatedAt,
    canApply: row.status === 'verified',
    steps: {
      aadhaar: row.aadhaarVerified,
      liveness: row.livenessPassed,
      profilePhoto: Boolean(row.profilePhotoData),
    },
    ...extra,
  }
}

router.get('/me', authRequired, loadUser, async (req, res, next) => {
  try {
    const row = await prisma.identityVerification.findUnique({ where: { userId: req.userId } })
    if (!row) {
      return res.json({
        verification: {
          status: 'unverified',
          trustScore: 50,
          required: req.user.role === 'freelancer',
          canApply: false,
          steps: { aadhaar: false, liveness: false, profilePhoto: false },
        },
      })
    }
    res.json({
      verification: formatVerification(row, { required: req.user.role === 'freelancer' }),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/aadhaar/send-otp', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const digits = normalizeAadhaar(req.body.aadhaar)
    if (!validateAadhaar(digits)) {
      return res.status(400).json({ error: 'Enter a valid 12-digit Aadhaar number' })
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.identityVerification.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        method: 'aadhaar',
        aadhaarHash: hashAadhaar(digits),
        aadhaarMasked: maskAadhaar(digits),
        otpHash: hashOtp(otp),
        otpExpiresAt: expiresAt,
        status: 'pending',
      },
      update: {
        method: 'aadhaar',
        aadhaarHash: hashAadhaar(digits),
        aadhaarMasked: maskAadhaar(digits),
        otpHash: hashOtp(otp),
        otpExpiresAt: expiresAt,
        aadhaarVerified: false,
      },
    })

    res.json({
      ok: true,
      masked: maskAadhaar(digits),
      message: 'OTP sent to Aadhaar-linked mobile (sandbox).',
      demoHint: `Demo OTP: ${DEMO_AADHAAR_OTP}`,
      expiresInMinutes: 10,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/aadhaar/verify-otp', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const digits = normalizeAadhaar(req.body.aadhaar)
    const otp = String(req.body.otp || '').trim()
    if (!validateAadhaar(digits)) {
      return res.status(400).json({ error: 'Invalid Aadhaar number' })
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Enter the 6-digit OTP' })
    }

    const row = await prisma.identityVerification.findUnique({ where: { userId: req.userId } })
    if (!row?.otpHash || !row.otpExpiresAt) {
      return res.status(400).json({ error: 'Request OTP first' })
    }
    if (new Date() > row.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP expired. Request a new one.' })
    }
    if (row.aadhaarHash !== hashAadhaar(digits)) {
      return res.status(400).json({ error: 'Aadhaar number does not match OTP session' })
    }
    if (row.otpHash !== hashOtp(otp) && otp !== DEMO_AADHAAR_OTP) {
      return res.status(400).json({ error: 'Incorrect OTP' })
    }

    const updated = await prisma.identityVerification.update({
      where: { userId: req.userId },
      data: {
        aadhaarVerified: true,
        aadhaarVerifiedAt: new Date(),
        otpHash: null,
        otpExpiresAt: null,
      },
    })

    res.json({ verification: formatVerification(updated) })
  } catch (err) {
    next(err)
  }
})

router.post('/liveness', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { snapshotDataUrl, faceCount, livenessScore, movementDetected } = req.body
    const row = await prisma.identityVerification.findUnique({ where: { userId: req.userId } })
    if (!row?.aadhaarVerified) {
      return res.status(400).json({ error: 'Complete Aadhaar verification first' })
    }
    if (!snapshotDataUrl) {
      return res.status(400).json({ error: 'Face snapshot required' })
    }
    if (imageByteSize(snapshotDataUrl) > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: 'Snapshot too large' })
    }
    if (Number(faceCount) !== 1) {
      return res.status(400).json({ error: 'Exactly one face must be visible' })
    }
    const score = Number(livenessScore) || 0
    if (score < 0.55 && !movementDetected) {
      return res.status(400).json({ error: 'Liveness check failed. Center your face and move slightly.' })
    }

    const updated = await prisma.identityVerification.update({
      where: { userId: req.userId },
      data: {
        livenessPassed: true,
        livenessScore: score,
        livenessSnapshot: snapshotDataUrl,
      },
    })

    res.json({ verification: formatVerification(updated) })
  } catch (err) {
    next(err)
  }
})

router.post('/profile-photo', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { photoDataUrl, profileName } = req.body
    const row = await prisma.identityVerification.findUnique({ where: { userId: req.userId } })
    if (!row?.livenessPassed) {
      return res.status(400).json({ error: 'Complete liveness check first' })
    }
    if (!photoDataUrl) {
      return res.status(400).json({ error: 'Profile photo required' })
    }
    if (imageByteSize(photoDataUrl) > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: 'Photo must be under 2MB' })
    }

    const name = profileName?.trim() || row.profileName || req.user.name
    await savePortfolioPhoto(req.userId, photoDataUrl, name)

    const updated = await prisma.identityVerification.update({
      where: { userId: req.userId },
      data: {
        profilePhotoData: photoDataUrl,
        profileName: name,
      },
    })

    res.json({ verification: formatVerification(updated) })
  } catch (err) {
    next(err)
  }
})

router.post('/submit', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { linkedInUrl, profileName } = req.body
    const row = await prisma.identityVerification.findUnique({ where: { userId: req.userId } })
    if (!row?.aadhaarVerified) {
      return res.status(400).json({ error: 'Complete Aadhaar verification' })
    }
    if (!row.livenessPassed) {
      return res.status(400).json({ error: 'Complete face liveness scan' })
    }
    if (!row.profilePhotoData) {
      return res.status(400).json({ error: 'Add your profile photo' })
    }

    const legalName = profileName?.trim() || row.profileName || req.user.name
    const portfolioName = await getPortfolioName(req.userId)
    const analysis = await verifyIdentityAI({
      profileName: legalName,
      portfolioName: portfolioName || req.user.name,
      linkedInUrl: linkedInUrl?.trim(),
      aadhaarVerified: true,
      livenessPassed: true,
      hasProfilePhoto: true,
      livenessScore: row.livenessScore,
      userId: req.userId,
    })

    let finalStatus = analysis.status
    if (finalStatus === 'verified' && analysis.trustScore < 75) {
      finalStatus = 'pending'
    }

    const updated = await prisma.identityVerification.update({
      where: { userId: req.userId },
      data: {
        profileName: legalName,
        linkedInUrl: linkedInUrl?.trim() || null,
        status: finalStatus,
        trustScore: analysis.trustScore,
        aiAnalysis: stringifyJson(analysis),
        flags: stringifyJson(analysis.flags || []),
        verifiedAt: finalStatus === 'verified' ? new Date() : null,
        adminNote: null,
      },
    })

    await prisma.freelancerProfile.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        name: legalName,
        title: 'Freelancer',
        rate: 'TBD',
        skills: '[]',
        verified: finalStatus === 'verified',
        trustScore: analysis.trustScore,
        suspicious: finalStatus === 'flagged',
      },
      update: {
        name: legalName,
        verified: finalStatus === 'verified',
        trustScore: analysis.trustScore,
        suspicious: finalStatus === 'flagged',
      },
    })

    res.json({
      verification: formatVerification(updated, { aiAnalysis: analysis }),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/admin/pending', authRequired, loadUser, async (req, res, next) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    const rows = await prisma.identityVerification.findMany({
      where: { status: { in: ['pending', 'flagged'] } },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
      orderBy: { updatedAt: 'desc' },
    })

    const verifications = await Promise.all(
      rows.map(async (row) => {
        const portfolioName = await getPortfolioName(row.userId)
        return { ...formatVerification(row), user: row.user, portfolioName }
      })
    )

    res.json({ verifications })
  } catch (err) {
    next(err)
  }
})

router.get('/admin/document/:userId', authRequired, loadUser, async (req, res, next) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    const row = await prisma.identityVerification.findUnique({
      where: { userId: req.params.userId },
    })
    if (!row) return res.status(404).json({ error: 'Not found' })

    res.json({
      aadhaarMasked: row.aadhaarMasked,
      aadhaarVerified: row.aadhaarVerified,
      livenessPassed: row.livenessPassed,
      livenessScore: row.livenessScore,
      profilePhoto: row.profilePhotoData,
      livenessSnapshot: row.livenessSnapshot,
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/admin/:userId', authRequired, loadUser, async (req, res, next) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Admin only' })
    }
    const { status, trustScore, adminNote } = req.body
    if (!['verified', 'pending', 'flagged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const row = await prisma.identityVerification.update({
      where: { userId: req.params.userId },
      data: {
        status,
        trustScore: trustScore != null ? Number(trustScore) : undefined,
        adminNote: adminNote ?? undefined,
        verifiedAt: status === 'verified' ? new Date() : null,
      },
    })

    await prisma.freelancerProfile.updateMany({
      where: { userId: req.params.userId },
      data: {
        verified: status === 'verified',
        trustScore: trustScore ?? row.trustScore,
        suspicious: status === 'flagged',
      },
    })

    res.json({ verification: formatVerification(row) })
  } catch (err) {
    next(err)
  }
})

export default router
