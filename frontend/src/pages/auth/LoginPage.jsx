import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/shared/Logo'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = await login({ email, password })
      if (!user.role) navigate('/role-selection')
      else navigate(user.role === 'freelancer' ? '/freelancer' : '/client')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[#f3f2ef] px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#e0e0e0] bg-white pb-5">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Stay updated on your professional world</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
              New to TalentStage?{' '}
              <Link to="/signup" className="font-semibold text-[#0a66c2] hover:underline">
                Join now
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
