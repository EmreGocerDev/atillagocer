'use client'

import { useState, useEffect } from 'react'
import { supabase, Song } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SongCard from '@/components/SongCard'
import Header from '@/components/Header'
import { usePlayer } from '@/contexts/PlayerContext'
import { FaPlay, FaMusic, FaHeadphones } from 'react-icons/fa'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  
  const { currentSong, isPlaying, playSong, setQueue } = usePlayer()

  useEffect(() => {
    fetchSongs()
  }, [])

  async function fetchSongs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching songs:', error)
    } else {
      setSongs(data || [])
    }
    setLoading(false)
  }

  const handlePlaySong = (song: Song) => {
    playSong(song, songs)
  }

  const playAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs)
    }
  }

  const popularSongs = [...songs].sort((a, b) => b.play_count - a.play_count).slice(0, 5)

  return (
    <div className="flex h-screen bg-spotify-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-32 lg:pb-24">
        <Header />
        
        {/* Hero Section */}
        <div className="gradient-bg px-4 lg:px-8 pt-4 lg:pt-8 pb-8 lg:pb-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 lg:gap-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-gradient-to-br from-spotify-green to-green-700 rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0">
              <FaMusic className="text-4xl sm:text-5xl lg:text-6xl text-white" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs lg:text-sm font-bold uppercase mb-1 lg:mb-2">Sanatçı</p>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-2 lg:mb-4">Atilla Göçer</h1>
              <p className="text-spotify-light-gray mb-2 lg:mb-4 text-sm lg:text-base">Şiir & Şarkı Yazarı</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs lg:text-sm text-spotify-light-gray">
                <FaHeadphones className="text-spotify-green" />
                <span>{songs.reduce((acc, s) => acc + s.play_count, 0).toLocaleString()} dinlenme</span>
                <span className="mx-1 lg:mx-2">•</span>
                <span>{songs.length} şarkı</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 lg:mt-8 flex items-center justify-center sm:justify-start gap-4">
            <button 
              onClick={playAll}
              className="bg-spotify-green hover:scale-105 transition-transform text-black font-bold py-3 px-6 lg:px-8 rounded-full flex items-center gap-2 text-sm lg:text-base"
            >
              <FaPlay /> Tümünü Çal
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
          </div>
        ) : (
          <div className="px-4 lg:px-8 py-4 lg:py-6">
            {/* Popüler Şarkılar */}
            {popularSongs.length > 0 && (
              <section className="mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">Popüler</h2>
                <div className="space-y-2">
                  {popularSongs.map((song, index) => (
                    <div 
                      key={song.id}
                      onClick={() => handlePlaySong(song)}
                      className={`flex items-center gap-3 lg:gap-4 p-2 lg:p-3 rounded-md cursor-pointer transition-colors ${
                        currentSong?.id === song.id ? 'bg-white/20' : 'hover:bg-white/10'
                      }`}
                    >
                      <span className="w-5 lg:w-6 text-center text-spotify-light-gray text-sm">{index + 1}</span>
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-spotify-gray rounded overflow-hidden flex-shrink-0">
                        {song.cover_image_url ? (
                          <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaMusic className="text-spotify-light-gray text-sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate text-sm lg:text-base ${currentSong?.id === song.id ? 'text-spotify-green' : ''}`}>
                          {song.title}
                        </p>
                        <p className="text-xs lg:text-sm text-spotify-light-gray truncate">{song.artist}</p>
                      </div>
                      <span className="text-spotify-light-gray text-xs lg:text-sm">
                        {song.play_count.toLocaleString()} dinlenme
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tüm Şarkılar */}
            <section>
              <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">Tüm Şarkılar</h2>
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
            </section>

            {songs.length === 0 && (
              <div className="text-center py-20">
                <FaMusic className="text-6xl text-spotify-gray mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Henüz şarkı yok</h3>
                <p className="text-spotify-light-gray">Şarkılar yakında eklenecek</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
