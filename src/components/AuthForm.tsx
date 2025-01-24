'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  const returnUrl = searchParams.get('returnUrl') || '/'

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      router.push(returnUrl)
      toast.success('Signed in successfully!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Check your email for the confirmation link!')
      setView('sign-in')
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-center">
          {view === 'sign-in' ? 'Sign in' : 'Create account'}
        </h2>
        <p className="mt-2 text-sm text-center text-gray-600">
          {view === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}
          <button
            className="ml-1 text-blue-500 hover:text-blue-600"
            onClick={() => setView(view === 'sign-in' ? 'sign-up' : 'sign-in')}
          >
            {view === 'sign-in' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <form onSubmit={view === 'sign-in' ? handleSignIn : handleSignUp} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : view === 'sign-in' ? (
            'Sign in'
          ) : (
            'Sign up'
          )}
        </Button>
      </form>
    </div>
  )
}
