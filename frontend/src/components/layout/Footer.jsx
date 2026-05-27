import { Logo } from '@/components/shared/Logo'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#e0e0e0] bg-white py-10">
      <div className="mx-auto grid max-w-[1128px] gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            A professional network for freelancers and clients to hire, collaborate, and grow.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">For talent</h4>
          <ul className="mt-3 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            <li><Link to="/signup" className="hover:text-[#0a66c2] hover:underline">Become a freelancer</Link></li>
            <li><Link to="/freelancer/projects" className="hover:text-[#0a66c2] hover:underline">Find projects</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">For clients</h4>
          <ul className="mt-3 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            <li><Link to="/signup" className="hover:text-[#0a66c2] hover:underline">Post a project</Link></li>
            <li><Link to="/ai" className="hover:text-[#0a66c2] hover:underline">Hiring tools</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            <li><a href="#features" className="hover:text-[#0a66c2] hover:underline">About</a></li>
            <li><a href="#pricing" className="hover:text-[#0a66c2] hover:underline">Pricing</a></li>
          </ul>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
        © {new Date().getFullYear()} TalentStage. All rights reserved.
      </p>
    </footer>
  )
}
