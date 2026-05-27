import { Outlet, Link } from 'react-router-dom'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Footer } from './Footer'

export function PublicLayout() {
  const { isAuthenticated, isFreelancer } = useAuth()
  const dashPath = isFreelancer ? '/freelancer' : '/client'

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f2ef]">
      <header className="sticky top-0 z-50 border-b border-[#e0e0e0] bg-white">
        <div className="mx-auto flex h-[52px] max-w-[1128px] items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[hsl(var(--muted-foreground))] md:flex">
            <a href="#features" className="hover:text-[#0a66c2] hover:underline">Features</a>
            <a href="#testimonials" className="hover:text-[#0a66c2] hover:underline">Stories</a>
            <a href="#pricing" className="hover:text-[#0a66c2] hover:underline">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to={dashPath}>
                <Button size="sm">Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-semibold text-[#0a66c2]">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Join now</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
