'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaHome, FaSearch, FaCompactDisc, FaHeart, FaCog, FaBars, FaTimes, FaMusic, FaExchangeAlt } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, isAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: '/', icon: FaHome, label: 'Ana Sayfa' },
    { href: '/search', icon: FaSearch, label: 'Ara' },
    { href: '/albums', icon: FaCompactDisc, label: 'Albümler' },
    { href: '/converter', icon: FaExchangeAlt, label: 'Dönüştürücü' },
  ]

  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-spotify-gray p-3 rounded-full text-white"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 bg-black p-6 flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button 
          onClick={closeSidebar}
          className="lg:hidden absolute top-4 right-4 text-spotify-light-gray hover:text-white"
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <FaMusic className="text-spotify-green" />
            <span>Atilla Göçer</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-spotify-gray text-white' 
                    : 'text-spotify-light-gray hover:text-white'
                }`}
              >
                <item.icon className="text-xl" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <hr className="border-spotify-gray my-6" />

        {/* Library Section */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-spotify-light-gray text-sm font-bold uppercase tracking-wider">
              Kütüphane
            </span>
          </div>
          
          <div className="space-y-1">
            <Link
              href="/favorites"
              onClick={closeSidebar}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                pathname === '/favorites' 
                  ? 'bg-spotify-gray text-white' 
                  : 'text-spotify-light-gray hover:text-white'
              }`}
            >
              <FaHeart className={pathname === '/favorites' ? 'text-spotify-green' : ''} />
              <span>Beğenilenler</span>
            </Link>
          </div>
        </div>

        {/* Admin Link - Only for admins (from Supabase) */}
        {isAdmin && (
          <div className="mt-auto pt-4 border-t border-spotify-gray">
            <Link
              href="/admin"
              onClick={closeSidebar}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                pathname === '/admin' 
                  ? 'bg-yellow-500/20 text-yellow-500' 
                  : 'text-spotify-light-gray hover:text-yellow-500'
              }`}
            >
              <FaCog />
              <span>Yönetim Paneli</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
