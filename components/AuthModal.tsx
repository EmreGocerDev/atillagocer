'use client'

import { useState } from 'react'
import { FaTimes, FaMusic, FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('E-posta veya şifre hatalı')
          } else {
            toast.error(error.message)
          }
        } else {
          toast.success('Giriş başarılı!')
          onClose()
          resetForm()
        }
      } else {
        if (password.length < 6) {
          toast.error('Şifre en az 6 karakter olmalı')
          setLoading(false)
          return
        }
        const { error } = await signUp(email, password, username)
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Bu e-posta zaten kayıtlı')
          } else {
            toast.error(error.message)
          }
        } else {
          toast.success('Kayıt başarılı! E-postanızı kontrol edin.')
          setMode('login')
        }
      }
    } catch (error: any) {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    resetForm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-spotify-gray rounded-lg w-full max-w-md mx-4 p-8 shadow-2xl">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-spotify-light-gray hover:text-white transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-spotify-green rounded-full mb-4">
            <FaMusic className="text-3xl text-black" />
          </div>
          <h2 className="text-2xl font-bold">
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </h2>
          <p className="text-spotify-light-gray mt-2">
            {mode === 'login' 
              ? 'Atilla Göçer müziklerini keşfedin' 
              : 'Şarkıları beğenmek için kayıt olun'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-spotify-light-gray" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adı"
                required
                className="w-full bg-spotify-dark rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-spotify-green"
              />
            </div>
          )}

          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-spotify-light-gray" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              required
              className="w-full bg-spotify-dark rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-spotify-green"
            />
          </div>

          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-spotify-light-gray" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              required
              className="w-full bg-spotify-dark rounded-full py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-spotify-green"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-spotify-light-gray hover:text-white"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-spotify-green text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                {mode === 'login' ? 'Giriş yapılıyor...' : 'Kayıt olunuyor...'}
              </span>
            ) : (
              mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-spotify-dark"></div>
          <span className="px-4 text-spotify-light-gray text-sm">veya</span>
          <div className="flex-1 border-t border-spotify-dark"></div>
        </div>

        {/* Switch Mode */}
        <p className="text-center text-spotify-light-gray">
          {mode === 'login' ? (
            <>
              Hesabınız yok mu?{' '}
              <button 
                onClick={switchMode}
                className="text-white hover:text-spotify-green transition-colors underline"
              >
                Kayıt Ol
              </button>
            </>
          ) : (
            <>
              Zaten hesabınız var mı?{' '}
              <button 
                onClick={switchMode}
                className="text-white hover:text-spotify-green transition-colors underline"
              >
                Giriş Yap
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
