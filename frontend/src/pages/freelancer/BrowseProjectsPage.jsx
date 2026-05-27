import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Shield } from 'lucide-react'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'

import { Input } from '@/components/ui/input'

import { Select } from '@/components/ui/select'

import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'

import { GlassCard } from '@/components/shared/GlassCard'


import { categories } from '@/data/mockData'

import { api, getToken } from '@/lib/api'

import { getProjectsBump, subscribeProjectsUpdated } from '@/lib/projectsSync'



const PER_PAGE = 8



function mapProject(p) {

  const postedAt = p.postedAt ? new Date(p.postedAt).getTime() : 0

  return {

    id: p.id,

    title: p.title,

    description: p.description || '',

    budget: p.budget,

    category: p.category,

    skills: Array.isArray(p.skills) ? p.skills : [],

    posted: p.postedAt

      ? new Date(p.postedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

      : 'Recently',

    postedAt,

    proposals: p.proposals ?? 0,

    status: p.status || 'open',

  }

}



export function BrowseProjectsPage() {
  const navigate = useNavigate()
  const [verification, setVerification] = useState(null)
  const [query, setQuery] = useState('')

  const [category, setCategory] = useState('All')

  const [budget, setBudget] = useState('all')

  const [page, setPage] = useState(1)

  const [projects, setProjects] = useState([])

  const [loading, setLoading] = useState(true)

  const [apiError, setApiError] = useState(null)

  const [usingApi, setUsingApi] = useState(false)

  const mountBump = useRef(getProjectsBump())



  const loadProjects = useCallback(async () => {

    setLoading(true)

    setApiError(null)

    try {

      const { projects: list } = await api.browseProjects({ status: 'open' })

      const mapped = (list || []).map(mapProject).sort((a, b) => b.postedAt - a.postedAt)

      setProjects(mapped)

      setUsingApi(true)
    } catch (err) {

      setApiError(err.message)

      setUsingApi(false)

      if (!getToken()) {

        setProjects([])

      }

    } finally {

      setLoading(false)

    }

  }, [])



  useEffect(() => {

    loadProjects()

  }, [loadProjects])

  useEffect(() => {
    if (!getToken()) return
    api.getVerification().then((d) => setVerification(d.verification)).catch(() => {})
  }, [])



  useEffect(() => {

    return subscribeProjectsUpdated(() => {

      setPage(1)

      loadProjects()

    })

  }, [loadProjects])



  useEffect(() => {

    const onVisible = () => {

      if (document.visibilityState === 'visible') loadProjects()

    }

    document.addEventListener('visibilitychange', onVisible)

    return () => document.removeEventListener('visibilitychange', onVisible)

  }, [loadProjects])



  useEffect(() => {

    const id = window.setInterval(() => {

      if (document.visibilityState === 'visible') loadProjects()

    }, 20000)

    return () => window.clearInterval(id)

  }, [loadProjects])



  const hasNewSinceVisit = usingApi && getProjectsBump() > mountBump.current



  const filtered = useMemo(() => {

    return projects.filter((p) => {

      const skills = p.skills || []

      const q = query.trim().toLowerCase()

      const matchQ =

        !q ||

        p.title.toLowerCase().includes(q) ||

        skills.some((s) => s.toLowerCase().includes(q)) ||

        (p.description || '').toLowerCase().includes(q) ||

        (p.budget || '').toLowerCase().includes(q)

      const matchCat = category === 'All' || p.category === category

      const matchBudget =

        budget === 'all' ||

        (budget === 'high' &&

          (String(p.budget).includes('4,000') ||

            String(p.budget).includes('4000') ||

            String(p.budget).includes('5,000')))

      return matchQ && matchCat && matchBudget && p.status === 'open'

    })

  }, [projects, query, category, budget])



  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)



  const canApply = verification?.canApply || verification?.status === 'verified'

  const openApply = (project) => {
    if (!canApply) {
      navigate('/freelancer/verify')
      return
    }
    navigate(`/freelancer/apply/${project.id}`)
  }



  const clearFilters = () => {

    setQuery('')

    setCategory('All')

    setBudget('all')

    setPage(1)

  }



  return (

    <div className="space-y-6">

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold">Browse Projects</h1>

          <p className="text-[hsl(var(--muted-foreground))]">

            {usingApi

              ? `${projects.length} open jobs from clients — synced live from the server`

              : 'Connect the backend to see real client jobs'}

          </p>

        </div>

        <Button variant="outline" size="sm" onClick={loadProjects} disabled={loading}>

          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />

          Refresh

        </Button>

      </div>

      {verification && !canApply && (
        <GlassCard className="border border-[#0a66c2]/30 bg-[#eef3f8] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#0a66c2]" />
              <div>
                <p className="font-semibold text-sm">Verify your identity to apply</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Aadhaar, face scan & profile photo required —{' '}
                  <VerifiedBadge status={verification.status} size="xs" className="inline-flex align-middle" />
                </p>
              </div>
            </div>
            <Link to="/freelancer/verify">
              <Button size="sm">Go to verification</Button>
            </Link>
          </div>
        </GlassCard>
      )}

      {hasNewSinceVisit && usingApi && (

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">

          <span>New jobs were posted — list updated.</span>

          <Button size="sm" variant="outline" onClick={loadProjects}>

            Reload now

          </Button>

        </div>

      )}



      {apiError && (

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>

            <p className="font-medium">Cannot load jobs from server</p>

            <p className="mt-1 text-amber-200/90">{apiError}</p>

            <p className="mt-2 text-xs">

              Run: <code className="rounded bg-black/30 px-1">cd backend</code> then{' '}

              <code className="rounded bg-black/30 px-1">npm run dev</code>

            </p>

          </div>

        </div>

      )}



      <div className="flex flex-col gap-4 lg:flex-row">

        <div className="relative flex-1">

          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />

          <Input

            placeholder="Search projects or skills..."

            value={query}

            onChange={(e) => {

              setQuery(e.target.value)

              setPage(1)

            }}

            className="pl-10"

          />

        </div>

        <Select

          value={category}

          onChange={(e) => {

            setCategory(e.target.value)

            setPage(1)

          }}

          className="w-full sm:w-auto"

        >

          {categories.map((c) => (

            <option key={c} value={c}>

              {c}

            </option>

          ))}

        </Select>

        <Select

          value={budget}

          onChange={(e) => {

            setBudget(e.target.value)

            setPage(1)

          }}

          className="w-full sm:w-auto"

        >

          <option value="all">All budgets</option>

          <option value="high">$4,000+</option>

        </Select>

        {(query || category !== 'All' || budget !== 'all') && (

          <Button variant="ghost" size="sm" onClick={clearFilters}>

            Clear filters

          </Button>

        )}

      </div>



      {loading && projects.length === 0 ? (

        <p className="py-12 text-center text-[hsl(var(--muted-foreground))]">Loading projects...</p>

      ) : paginated.length === 0 ? (

        <div className="py-12 text-center text-[hsl(var(--muted-foreground))] space-y-2">

          <p>{usingApi ? 'No open jobs match your filters.' : 'No projects to show.'}</p>

          {usingApi && projects.length > 0 && (

            <Button variant="outline" size="sm" onClick={clearFilters}>

              Show all {projects.length} open jobs

            </Button>

          )}

        </div>

      ) : (

        <div className="grid gap-4">

          {paginated.map((p) => (

            <GlassCard

              key={p.id}

              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"

            >

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h3 className="font-semibold">{p.title}</h3>

                  <Badge variant="secondary">{p.category}</Badge>

                  <Badge variant="success">Open</Badge>

                </div>

                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">

                  {p.description || 'No description provided.'}

                </p>

                <div className="mt-2 flex flex-wrap gap-1">

                  {(p.skills || []).map((s) => (

                    <Badge key={s} variant="secondary">

                      {s}

                    </Badge>

                  ))}

                </div>

                <p className="mt-2 text-sm text-purple-300">

                  {p.budget} · Posted {p.posted} · {p.proposals} proposals

                </p>

              </div>

              <Button className="shrink-0" onClick={() => openApply(p)}>
                Start 3-round application
              </Button>

            </GlassCard>

          ))}

        </div>

      )}



      <div className="flex items-center justify-center gap-4">

        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>

          <ChevronLeft className="h-4 w-4" />

        </Button>

        <span className="text-sm">

          Page {page} of {totalPages}

          {filtered.length > 0 && ` · ${filtered.length} job(s)`}

        </span>

        <Button

          variant="outline"

          size="icon"

          disabled={page >= totalPages}

          onClick={() => setPage((p) => p + 1)}

        >

          <ChevronRight className="h-4 w-4" />

        </Button>

      </div>



    </div>

  )

}


