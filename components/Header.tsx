'use client'

import { useState } from 'react'
import { FaUser, FaChevronDown, FaSignOutAlt, FaHeart, FaCog } from 'react-icons/fa'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from './AuthModal'

export default function Header() {
  const [showMenu, setShowMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const { user, signOut, loading, isAdmin } = useAuth()

  const openLogin = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const openRegister = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  const handleSignOut = async () => {
    await signOut()
    setShowMenu(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-end px-4 lg:px-8 py-4 bg-spotify-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-2 lg:gap-4">
          {loading ? (
            <div className="w-8 h-8 animate-pulse bg-spotify-gray rounded-full"></div>
          ) : user ? (
            // Logged in state
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 rounded-full py-1 px-2 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-yellow-500' : 'bg-spotify-green'}`}>
                  <span className="text-black font-bold text-sm">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm max-w-[100px] lg:max-w-[120px] truncate">
                  {user.user_metadata?.username || user.email?.split('@')[0]}
                </span>
                {isAdmin && <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full hidden sm:block">Admin</span>}
                <FaChevronDown className={`text-white text-sm transition-transform ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-spotify-gray rounded-md shadow-xl z-50 overflow-hidden">
                    <Link 
                      href="/favorites"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <FaHeart className="text-spotify-green" />
                      Beğendiklerim
                    </Link>
                    {isAdmin && (
                      <Link 
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <FaCog className="text-yellow-500" />
                        Yönetim Paneli
                      </Link>
                    )}
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors border-t border-spotify-dark text-left"
                    >
                      <FaSignOutAlt />
                      Çıkış Yap
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Logged out state
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={openRegister}
                className="text-spotify-light-gray hover:text-white font-medium transition-colors text-sm hidden sm:block"
              >
                Kayıt Ol
              </button>
              <button
                onClick={openLogin}
                className="bg-white text-black font-bold py-2 px-4 lg:px-6 rounded-full hover:scale-105 transition-transform text-sm"
              >
                Giriş Yap
              </button>
            </div>
          )}
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  )
}
