'use client'

import { useState, useEffect } from 'react'
import { supabase, Song, Album } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SongCard from '@/components/SongCard'
import Header from '@/components/Header'
import { usePlayer } from '@/contexts/PlayerContext'
import { FaMusic, FaPlay, FaCompactDisc } from 'react-icons/fa'

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [albumSongs, setAlbumSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  
  const { currentSong, isPlaying, playSong } = usePlayer()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    const [albumsRes, songsRes] = await Promise.all([
      supabase.from('albums').select('*').order('created_at', { ascending: false }),
      supabase.from('songs').select('*').eq('is_published', true).order('title')
    ])

    if (albumsRes.data) setAlbums(albumsRes.data)
    if (songsRes.data) setSongs(songsRes.data)
    
    setLoading(false)
  }

  const selectAlbum = (album: Album) => {
    setSelectedAlbum(album)
    const filtered = songs.filter(s => s.album_id === album.id)
    setAlbumSongs(filtered)
  }

  const handlePlaySong = (song: Song, songList?: Song[]) => {
    const list = songList || albumSongs
    playSong(song, list)
  }

  const playAlbum = (album: Album) => {
    const filtered = songs.filter(s => s.album_id === album.id)
    if (filtered.length > 0) {
      playSong(filtered[0], filtered)
    }
  }

  // Albümsüz şarkıları grupla
  const songsWithoutAlbum = songs.filter(s => !s.album_id)

  return (
    <div className="flex h-screen bg-spotify-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-32 lg:pb-24">
        <Header />
        
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
            </div>
          ) : selectedAlbum ? (
            // Album Detail View
            <div>
              {/* Back Button */}
              <button 
                onClick={() => setSelectedAlbum(null)}
                className="text-spotify-light-gray hover:text-white mb-4 lg:mb-6 flex items-center gap-2 text-sm lg:text-base"
              >
                ← Tüm Albümler
              </button>

              {/* Album Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 lg:gap-6 mb-6 lg:mb-8">
                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-spotify-gray rounded-lg shadow-2xl overflow-hidden flex-shrink-0">
                  {selectedAlbum.cover_image_url ? (
                    <img src={selectedAlbum.cover_image_url} alt={selectedAlbum.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
                      <FaCompactDisc className="text-4xl lg:text-6xl text-white/50" />
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs lg:text-sm font-bold uppercase mb-1 lg:mb-2">Albüm</p>
                  <h1 className="text-3xl lg:text-5xl font-bold mb-2 lg:mb-4">{selectedAlbum.title}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs lg:text-sm text-spotify-light-gray">
                    <span className="font-bold text-white">Atilla Göçer</span>
                    {selectedAlbum.release_year && (
                      <>
                        <span>•</span>
                        <span>{selectedAlbum.release_year}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{albumSongs.length} şarkı</span>
                  </div>
                  {selectedAlbum.description && (
                    <p className="text-spotify-light-gray mt-4 max-w-xl text-sm lg:text-base">{selectedAlbum.description}</p>
                  )}
                </div>
              </div>

              {/* Play Button */}
              <div className="flex justify-center sm:justify-start mb-6 lg:mb-8">
                <button 
                  onClick={() => playAlbum(selectedAlbum)}
                  className="bg-spotify-green hover:scale-105 transition-transform text-black font-bold py-3 px-6 lg:px-8 rounded-full flex items-center gap-2 text-sm lg:text-base"
                >
                  <FaPlay /> Albümü Çal
                </button>
              </div>

              {/* Songs List */}
              {albumSongs.length > 0 ? (
                <div className="space-y-2">
                  {albumSongs.map((song, index) => (
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
              ) : (
                <div className="text-center py-12">
                  <FaMusic className="text-4xl text-spotify-gray mx-auto mb-4" />
                  <p className="text-spotify-light-gray">Bu albümde henüz şarkı yok</p>
                </div>
              )}
            </div>
          ) : (
            // Albums Grid View
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">Albümler</h1>
              
              {albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4 mb-8 lg:mb-12">
                  {albums.map((album) => {
                    const albumSongCount = songs.filter(s => s.album_id === album.id).length
                    return (
                      <div 
                        key={album.id}
                        onClick={() => selectAlbum(album)}
                        className="bg-spotify-gray/40 hover:bg-spotify-gray/80 rounded-lg p-3 lg:p-4 cursor-pointer transition-all duration-300 group card-hover"
                      >
                        <div className="relative mb-3 lg:mb-4">
                          <div className="aspect-square bg-spotify-dark rounded-md overflow-hidden shadow-lg">
                            {album.cover_image_url ? (
                              <img 
                                src={album.cover_image_url} 
                                alt={album.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
                                <FaCompactDisc className="text-3xl lg:text-4xl text-white/50" />
                              </div>
                            )}
                          </div>
                          
                          {/* Play button overlay */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); playAlbum(album); }}
                            className="absolute bottom-2 right-2 w-10 h-10 lg:w-12 lg:h-12 bg-spotify-green rounded-full flex items-center justify-center shadow-xl transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105"
                          >
                            <FaPlay className="text-black text-sm lg:text-lg ml-0.5 lg:ml-1" />
                          </button>
                        </div>
                        
                        <h3 className="font-bold truncate mb-1 text-white text-sm lg:text-base">
                          {album.title}
                        </h3>
                        <p className="text-xs lg:text-sm text-spotify-light-gray">
                          {album.release_year && `${album.release_year} • `}{albumSongCount} şarkı
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 mb-8 lg:mb-12">
                  <FaCompactDisc className="text-5xl lg:text-6xl text-spotify-gray mx-auto mb-4" />
                  <h3 className="text-lg lg:text-xl font-bold mb-2">Henüz albüm yok</h3>
                  <p className="text-spotify-light-gray text-sm lg:text-base">Albümler yakında eklenecek</p>
                </div>
              )}

              {/* Songs Without Album */}
              {songsWithoutAlbum.length > 0 && (
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold mb-4">Tekli Şarkılar</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
                    {songsWithoutAlbum.map((song) => (
                      <SongCard 
                        key={song.id} 
                        song={song} 
                        onPlay={(s) => handlePlaySong(s, songsWithoutAlbum)}
                        isPlaying={currentSong?.id === song.id && isPlaying}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
