'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ProfileSetupModalProps {
  onComplete: () => void
}

type UserRole = 'mentor' | 'student'
type StudentType = 'college' | 'school' | 'other'

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    role: '' as UserRole,
    student_type: '' as StudentType,
    institution_name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const profileData = {
        id: user.id,
        email: user.email,
        ...formData,
        updated_at: new Date().toISOString()
      }

      // Remove student-specific fields if user is a mentor
      if (formData.role === 'mentor') {
        delete profileData.student_type
        delete profileData.institution_name
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (error) throw error

      toast.success('Profile setup completed!')
      onComplete()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Please fill in your details to continue. This will help us personalize your experience.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                required
                value={formData.phone_number}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
                placeholder="+91 1234567890"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
              >
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                <div>
                  <label htmlFor="student_type" className="block text-sm font-medium text-gray-700">
                    Student Type *
                  </label>
                  <select
                    id="student_type"
                    name="student_type"
                    required
                    value={formData.student_type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
                  >
                    <option value="">Select your student type</option>
                    <option value="college">College</option>
                    <option value="school">School</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="institution_name" className="block text-sm font-medium text-gray-700">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    id="institution_name"
                    name="institution_name"
                    required
                    value={formData.institution_name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
                    placeholder="Enter your institution name"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full py-2.5 bg-[#0f1c36] hover:bg-[#0f1c36]/90 text-white font-medium rounded-lg transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your profile...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
