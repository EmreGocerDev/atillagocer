'use client'

import { useState, useEffect } from 'react'
import { supabase, Song } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SongCard from '@/components/SongCard'
import Header from '@/components/Header'
import { usePlayer } from '@/contexts/PlayerContext'
import { FaSearch, FaMusic } from 'react-icons/fa'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  
  const { currentSong, isPlaying, playSong } = usePlayer()

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    if (query.trim()) {
      const filtered = songs.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase()) ||
        song.genre?.toLowerCase().includes(query.toLowerCase()) ||
        song.lyrics?.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSongs(filtered)
    } else {
      setFilteredSongs([])
    }
  }, [query, songs])

  async function fetchSongs() {
    setLoading(true)
    const { data } = await supabase
      .from('songs')
      .select('*')
      .eq('is_published', true)
      .order('title')

    if (data) {
      setSongs(data)
    }
    setLoading(false)
  }

  const handlePlaySong = (song: Song) => {
    const searchResults = query ? filteredSongs : songs
    playSong(song, searchResults)
  }

  const genres = Array.from(new Set(songs.map(s => s.genre).filter(Boolean))) as string[]

  return (
    <div className="flex h-screen bg-spotify-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-32 lg:pb-24">
        <Header />
        
        <div className="p-4 lg:p-8">
          {/* Search Input */}
          <div className="relative mb-6 lg:mb-8">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-spotify-light-gray" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Şarkı, sanatçı veya şiir ara..."
              className="w-full max-w-xl bg-white rounded-full py-3 pl-12 pr-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green text-sm lg:text-base"
              autoFocus
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
            </div>
          ) : query ? (
            // Search Results
            <div>
              <h2 className="text-xl lg:text-2xl font-bold mb-4">
                "{query}" için sonuçlar ({filteredSongs.length})
              </h2>
              {filteredSongs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
                  {filteredSongs.map((song) => (
                    <SongCard 
                      key={song.id} 
                      song={song} 
                      onPlay={handlePlaySong}
                      isPlaying={currentSong?.id === song.id && isPlaying}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <FaMusic className="text-5xl lg:text-6xl text-spotify-gray mx-auto mb-4" />
                  <h3 className="text-lg lg:text-xl font-bold mb-2">Sonuç bulunamadı</h3>
                  <p className="text-spotify-light-gray text-sm lg:text-base">Farklı anahtar kelimeler deneyin</p>
                </div>
              )}
            </div>
          ) : (
            // Browse Genres
            <div>
              <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Türlere Göz At</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:gap-4">
                {genres.map((genre, index) => (
                  <button
                    key={genre}
                    onClick={() => setQuery(genre || '')}
                    className={`h-24 lg:h-32 rounded-lg p-3 lg:p-4 text-left font-bold text-lg lg:text-xl transition-transform hover:scale-105`}
                    style={{
                      background: `linear-gradient(135deg, ${
                        ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'][index % 6]
                      } 0%, ${
                        ['#6366f1', '#be185d', '#d97706', '#059669', '#2563eb', '#dc2626'][index % 6]
                      } 100%)`
                    }}
                  >
                    {genre}
                  </button>
                ))}
                <button
                  onClick={() => setQuery('')}
                  className="h-24 lg:h-32 rounded-lg p-3 lg:p-4 text-left font-bold text-lg lg:text-xl bg-gradient-to-br from-spotify-gray to-spotify-dark hover:scale-105 transition-transform"
                >
                  Tümü
                </button>
              </div>

              {/* All Songs */}
              <h2 className="text-xl lg:text-2xl font-bold mt-8 lg:mt-12 mb-4">Tüm Şarkılar</h2>
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
          )}
        </div>
      </main>
    </div>
  )
}
