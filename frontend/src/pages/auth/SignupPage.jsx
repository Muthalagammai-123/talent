import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/shared/Logo'
import { useAuth } from '@/contexts/AuthContext'

export function SignupPage() {
  const [searchParams] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signup, loading, setRole } = useAuth()
  const navigate = useNavigate()
  const presetRole = searchParams.get('role')

  useEffect(() => {
    if (presetRole) sessionStorage.setItem('talentstage-preset-role', presetRole)
  }, [presetRole])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signup({ name, email, password })
      const role = sessionStorage.getItem('talentstage-preset-role')
      if (role === 'freelancer' || role === 'client') {
        setRole(role)
        sessionStorage.removeItem('talentstage-preset-role')
        navigate(role === 'freelancer' ? '/freelancer' : '/client')
      } else {
        navigate('/role-selection')
      }
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
        <Card>
          <CardHeader className="border-b border-[#e0e0e0] pb-5">
            <CardTitle className="text-xl">Join TalentStage</CardTitle>
            <CardDescription>Make the most of your professional life</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">First and last name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="password">Password (6+ characters)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Agree & Join'}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Already on TalentStage?{' '}
              <Link to="/login" className="font-semibold text-[#0a66c2] hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
