'use client'

import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-[#0f1c36] text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[#4fcdc4] hover:opacity-90 transition-opacity">
            Skillyu
          </Link>
          <div className="flex items-center space-x-6">
            <Link 
              href="/courses" 
              className="text-sm font-medium hover:text-[#4fcdc4] transition-colors"
            >
              Courses
            </Link>
            <Link 
              href="/profile" 
              className="text-sm font-medium hover:text-[#4fcdc4] transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="bg-[#4fcdc4] px-4 py-2 text-sm font-medium rounded-lg hover:bg-[#45b8b0] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
