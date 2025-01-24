'use client'

import { createClientComponentClient, type Session } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AuthComponent from '@/components/Auth'
import { motion } from 'framer-motion'

const supabase = createClientComponentClient()

export default function HomeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const returnUrl = searchParams.get('returnUrl')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        if (session) {
          router.push(returnUrl || '/dashboard')
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [router, returnUrl])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4"
      >
        <AuthComponent />
      </motion.div>
    </div>
  )
}
