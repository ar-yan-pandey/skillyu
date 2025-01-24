'use server'

import AuthForm from '@/components/AuthForm'
import { headers } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'

export default async function AuthPage() {
  const supabase = createServerComponentClient({ cookies: () => headers().get('cookie') ?? '' })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <AuthForm />
      </div>
    </div>
  )
}