'use client'

import { useRouter } from 'next/navigation'

interface ProfilePromptProps {
  onClose: () => void
}

export default function ProfilePrompt({ onClose }: ProfilePromptProps) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#4fcdc4] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#4fcdc4]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0f1c36] mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            Please complete your profile to access all features of Skillyu
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => router.push('/profile-setup')}
            className="w-full bg-[#0f1c36] hover:bg-[#162844] text-white font-medium py-3 rounded-lg transition-colors"
          >
            Complete Profile Now
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-lg transition-colors"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  )
}
