'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/my-masterclasses', label: 'My Masterclasses' },
    { href: '/profile', label: 'Profile' }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav 
        className={`fixed w-full top-0 z-50 transition-all duration-200 ${
          scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <Link 
              href="/dashboard" 
              className="flex-shrink-0 flex items-center transition-transform duration-200 hover:scale-[0.98]"
            >
              <Image
                src="/logo.png"
                alt="Skillyu Logo"
                width={150}
                height={50}
                priority
                className="h-10 w-auto"
                quality={100}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'left'
                }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center">
              <div className="flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      item.href === '/profile'
                        ? 'bg-[#0f1c36] hover:bg-[#0f1c36]/90 text-white flex items-center gap-2 hover:translate-x-0.5'
                        : isActive(item.href)
                        ? 'bg-[#4fcdc4]/10 text-[#0f1c36] font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#4fcdc4]'
                    }`}
                  >
                    <span className={`relative ${item.href === '/profile' ? '' : 'group-hover:after:w-full after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#4fcdc4] after:transition-all after:duration-200'}`}>
                      {item.label}
                    </span>
                    {item.href === '/profile' && (
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-[#4fcdc4] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4fcdc4] transition-all duration-200"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`sm:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[400px] border-t border-gray-100' : 'max-h-0'
          } overflow-hidden bg-white`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                  item.href === '/profile'
                    ? 'bg-[#0f1c36] text-white flex items-center justify-between'
                    : isActive(item.href)
                    ? 'bg-[#4fcdc4]/10 text-[#0f1c36] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#4fcdc4]'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="flex items-center justify-between w-full">
                  {item.label}
                  {(isActive(item.href) || item.href === '/profile') && (
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive(item.href) ? 'opacity-100' : 'opacity-0'}`} />
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-20 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
