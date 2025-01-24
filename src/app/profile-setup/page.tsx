'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfileSetup() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    role: '', // 'student' or 'mentor'
    studentType: '', // 'college' or 'school' or 'other'
    institutionName: '',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      
      setUser(session.user)
      setFormData(prev => ({
        ...prev,
        email: session.user.email || '',
      }))
      setLoading(false)
    }
    getUser()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 1 && !formData.role) {
      alert('Please select a role')
      return
    }

    if (step === 2 && formData.role === 'student' && !formData.studentType) {
      alert('Please select your student type')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            email: formData.email,
            role: formData.role,
            student_type: formData.studentType,
            institution_name: formData.institutionName,
            updated_at: new Date().toISOString(),
          }
        ])

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4fcdc4]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0f1c36]">Complete Your Profile</h1>
            <p className="text-gray-600 mt-2">Tell us a bit about yourself</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4fcdc4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4fcdc4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    I want to join as
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleSelectChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4fcdc4] focus:border-transparent"
                  >
                    <option value="">Select role</option>
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => formData.role && setStep(2)}
                  className="w-full bg-[#0f1c36] hover:bg-[#162844] text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    I am a
                  </label>
                  <select
                    name="studentType"
                    value={formData.studentType}
                    onChange={handleSelectChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4fcdc4] focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="college">College Student</option>
                    <option value="school">School Student</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {formData.studentType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.studentType === 'college' 
                        ? 'College Name' 
                        : formData.studentType === 'school'
                        ? 'School Name'
                        : 'Institution Name'}
                    </label>
                    <input
                      type="text"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4fcdc4] focus:border-transparent"
                    />
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0f1c36] hover:bg-[#162844] text-white font-medium py-2.5 rounded-lg transition-colors"
                  >
                    Complete Setup
                  </button>
                </div>
              </>
            )}

            {step === 2 && formData.role === 'mentor' && (
              <>
                <div className="text-center text-gray-600 mb-4">
                  Great! You're all set to be a mentor.
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0f1c36] hover:bg-[#162844] text-white font-medium py-2.5 rounded-lg transition-colors"
                  >
                    Complete Setup
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
