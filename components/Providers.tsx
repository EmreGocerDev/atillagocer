'use client'

import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { PlayerProvider } from '@/contexts/PlayerContext'
import GlobalMusicPlayer from '@/components/GlobalMusicPlayer'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#282828',
              color: '#fff',
            },
          }}
        />
        {children}
        <GlobalMusicPlayer />
      </PlayerProvider>
    </AuthProvider>
  )
}
