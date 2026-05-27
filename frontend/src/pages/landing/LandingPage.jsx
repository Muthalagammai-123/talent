import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, FileText, BadgeCheck, Wallet, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/GlassCard'
import { AnimatedCounter } from '@/components/shared/AnimatedCounter'
import { stats, features, testimonials, pricingPlans } from '@/data/mockData'

const iconMap = { Sparkles, FileText, BadgeCheck, Wallet }

export function LandingPage() {
  return (
    <>
      <section className="bg-white px-4 pb-16 pt-12 sm:px-6">
        <div className="mx-auto max-w-[780px] text-center">
          <p className="text-sm font-medium text-[#0a66c2]">
            Where professionals find work and hire talent
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
            Build your freelance career on a network you trust
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
            TalentStage helps clients post projects, review proposals, and hire verified freelancers — with messaging, payments, and community built in.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup?role=client">
              <Button size="lg">
                Hire talent <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/signup?role=freelancer">
              <Button size="lg" variant="outline">
                Find work
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-[#e0e0e0] bg-[#f3f2ef] px-3 py-4 text-center">
                <p className="text-xl font-semibold text-[#0a66c2]">
                  <AnimatedCounter value={s.value} decimals={s.decimals} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-[#e0e0e0] bg-[#f3f2ef] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1128px]">
          <h2 className="text-center text-2xl font-semibold">Everything you need to hire and get hired</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[hsl(var(--muted-foreground))]">
            Practical tools arranged the way working professionals expect — not flashy demos.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = iconMap[f.icon]
              return (
                <GlassCard key={f.title} className="p-5">
                  <Icon className="mb-3 h-7 w-7 text-[#0a66c2]" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{f.desc}</p>
                </GlassCard>
              )
            })}
          </div>
        </div>
      </section>

      <section id="testimonials" className="border-t border-[#e0e0e0] bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1128px]">
          <h2 className="text-center text-2xl font-semibold">Trusted by freelancers and teams</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <GlassCard key={t.name} className="p-5">
                <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3 border-t border-[#e0e0e0] pt-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef3f8] text-sm font-semibold text-[#0a66c2]">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-[#e0e0e0] bg-[#f3f2ef] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[900px]">
          <h2 className="text-center text-2xl font-semibold">Straightforward pricing</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <GlassCard key={plan.name} className={plan.popular ? 'ring-2 ring-[#0a66c2]' : ''}>
                {plan.popular && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#0a66c2]">
                    Recommended
                  </span>
                )}
                <h3 className="mt-2 text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2 text-2xl font-semibold">
                  ${plan.price}
                  <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">/mo</span>
                </p>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0a66c2]" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-6 block">
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    Get started
                  </Button>
                </Link>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
