'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import ProfileSetupModal from './ProfileSetupModal'

interface AuthProps {
  returnUrl?: string;
}

export default function Auth({ returnUrl }: AuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const router = useRouter()

  const checkProfileCompletion = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone_number, role')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error checking profile:', error.message)
        return false
      }

      if (!data || !data.full_name || !data.phone_number || !data.role) {
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking profile:', error)
      return false
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/callback?returnUrl=${returnUrl || '/dashboard'}`
          }
        })
        if (error) throw error
        
        toast.success('Check your email to verify your account!')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        if (data.user) {
          const isProfileComplete = await checkProfileCompletion(data.user.id)
          if (!isProfileComplete) {
            setShowProfileSetup(true)
          } else {
            // Only redirect after successful login
            router.push(returnUrl || '/dashboard')
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileComplete = () => {
    setShowProfileSetup(false)
    router.push(returnUrl || '/dashboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-8 rounded-2xl shadow-lg"
    >
      <div className="flex flex-col items-center space-y-6">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image 
            src="/logo.png" 
            alt="Project Yukti Logo" 
            width={150} 
            height={150} 
            className="w-32 h-auto"
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-gray-900"
        >
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </motion.h2>
        
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleAuth}
          className="w-full space-y-4"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-[#4FCDC4]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4FCDC4] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-[#4FCDC4]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4FCDC4] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full bg-[#4FCDC4] hover:bg-[#3db8af] text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </div>
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {isSignUp ? 'Already have an account?' : 'Need an account?'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Sign In Instead' : 'Create an Account'}
          </Button>
        </motion.form>
      </div>

      {showProfileSetup && (
        <ProfileSetupModal onComplete={handleProfileComplete} />
      )}
    </motion.div>
  )
}
