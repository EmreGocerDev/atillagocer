'use client'

import { useState, useEffect } from 'react'
import { supabase, Song } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SongCard from '@/components/SongCard'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { usePlayer } from '@/contexts/PlayerContext'
import { FaHeart, FaMusic } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

export default function FavoritesPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  
  const { user, likedSongs, loading: authLoading } = useAuth()
  const { currentSong, isPlaying, playSong } = usePlayer()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }
    
    if (user && likedSongs.length > 0) {
      fetchLikedSongs()
    } else if (user) {
      setLoading(false)
    }
  }, [user, authLoading, likedSongs])

  async function fetchLikedSongs() {
    setLoading(true)
    
    const { data } = await supabase
      .from('songs')
      .select('*')
      .in('id', likedSongs)
      .eq('is_published', true)

    if (data) {
      setSongs(data)
    }
    setLoading(false)
  }

  const handlePlaySong = (song: Song) => {
    playSong(song, songs)
  }

  if (authLoading) {
    return (
      <div className="flex h-screen bg-spotify-dark items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-spotify-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-32 lg:pb-24">
        <Header />
        
        {/* Hero Section */}
        <div className="gradient-bg px-4 lg:px-8 pt-4 lg:pt-8 pb-8 lg:pb-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 lg:gap-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0">
              <FaHeart className="text-4xl sm:text-5xl lg:text-6xl text-white" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs lg:text-sm font-bold uppercase mb-1 lg:mb-2">Çalma Listesi</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 lg:mb-4">Beğendiklerim</h1>
              <p className="text-spotify-light-gray text-sm lg:text-base">
                {user?.user_metadata?.username || user?.email?.split('@')[0]} • {songs.length} şarkı
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
          </div>
        ) : songs.length > 0 ? (
          <div className="px-4 lg:px-8 py-4 lg:py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
              {songs.map((song) => (
                <SongCard 
                  key={song.id} 
                  song={song} 
                  onPlay={handlePlaySong}
                  isPlaying={currentSong?.id === song.id && isPlaying}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <FaMusic className="text-5xl lg:text-6xl text-spotify-gray mb-4" />
            <h3 className="text-lg lg:text-xl font-bold mb-2 text-center">Henüz beğendiğiniz şarkı yok</h3>
            <p className="text-spotify-light-gray text-sm lg:text-base text-center">
              Şarkıları beğenmeye başlayın ve burada görün
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
