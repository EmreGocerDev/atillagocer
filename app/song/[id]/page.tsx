'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Song } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { usePlayer } from '@/contexts/PlayerContext'
import { FaPlay, FaPause, FaMusic, FaShare, FaHeart, FaRegHeart, FaClock } from 'react-icons/fa'
import { formatDuration, formatDate, generateShareUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SongPage() {
  const params = useParams()
  const songId = params.id as string
  
  const [song, setSong] = useState<Song | null>(null)
  const [relatedSongs, setRelatedSongs] = useState<Song[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayer()

  useEffect(() => {
    if (songId) {
      fetchSong()
    }
  }, [songId])

  async function fetchSong() {
    setLoading(true)
    
    const { data: songData } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()

    if (songData) {
      setSong(songData)
      
      // Fetch related songs
      const { data: related } = await supabase
        .from('songs')
        .select('*')
        .eq('is_published', true)
        .neq('id', songId)
        .limit(5)

      setRelatedSongs(related || [])
    }
    
    setLoading(false)
  }

  const handlePlay = () => {
    if (song) {
      if (currentSong?.id === song.id) {
        togglePlayPause()
      } else {
        playSong(song, relatedSongs.length > 0 ? [song, ...relatedSongs] : [song])
      }
    }
  }

  const handlePlayRelated = (relatedSong: Song) => {
    playSong(relatedSong, [song!, ...relatedSongs])
  }

  const handleShare = async () => {
    if (!song) return
    const url = generateShareUrl(song.id)
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `${song.title} - ${song.artist} | Atilla Göçer Müzik`,
          url: url,
        })
      } catch (err) {
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link kopyalandı!')
  }

  const isSongPlaying = currentSong?.id === song?.id && isPlaying

  if (loading) {
    return (
      <div className="flex h-screen bg-spotify-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
        </main>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="flex h-screen bg-spotify-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <FaMusic className="text-5xl lg:text-6xl text-spotify-gray mx-auto mb-4" />
            <h2 className="text-xl lg:text-2xl font-bold mb-2">Şarkı bulunamadı</h2>
            <p className="text-spotify-light-gray text-sm lg:text-base">Bu şarkı mevcut değil veya kaldırılmış olabilir</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-spotify-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-32 lg:pb-24">
        <Header />
        
        {/* Header */}
        <div className="gradient-bg px-4 lg:px-8 pt-4 lg:pt-8 pb-8 lg:pb-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 lg:gap-6">
            <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-spotify-gray rounded-lg shadow-2xl overflow-hidden flex-shrink-0">
              {song.cover_image_url ? (
                <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-spotify-green/30 to-spotify-dark">
                  <FaMusic className="text-4xl lg:text-6xl text-white/50" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-xs lg:text-sm font-bold uppercase mb-1 lg:mb-2">Şarkı</p>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-2 lg:mb-4 truncate">{song.title}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs lg:text-sm">
                <span className="font-bold">{song.artist}</span>
                {song.album && (
                  <>
                    <span className="text-spotify-light-gray">•</span>
                    <span className="text-spotify-light-gray">{song.album}</span>
                  </>
                )}
                {song.release_year && (
                  <>
                    <span className="text-spotify-light-gray">•</span>
                    <span className="text-spotify-light-gray">{song.release_year}</span>
                  </>
                )}
                {song.duration && (
                  <>
                    <span className="text-spotify-light-gray">•</span>
                    <span className="text-spotify-light-gray flex items-center gap-1">
                      <FaClock className="text-xs" />
                      {formatDuration(song.duration)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 lg:mt-8 flex items-center justify-center sm:justify-start gap-4 lg:gap-6">
            <button 
              onClick={handlePlay}
              className="w-12 h-12 lg:w-14 lg:h-14 bg-spotify-green hover:scale-105 transition-transform rounded-full flex items-center justify-center"
            >
              {isSongPlaying ? (
                <FaPause className="text-black text-lg lg:text-xl" />
              ) : (
                <FaPlay className="text-black text-lg lg:text-xl ml-1" />
              )}
            </button>
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`text-2xl lg:text-3xl transition-colors ${isLiked ? 'text-spotify-green' : 'text-spotify-light-gray hover:text-white'}`}
            >
              {isLiked ? <FaHeart /> : <FaRegHeart />}
            </button>
            <button 
              onClick={handleShare}
              className="text-xl lg:text-2xl text-spotify-light-gray hover:text-white transition-colors"
            >
              <FaShare />
            </button>
          </div>
        </div>

        <div className="px-4 lg:px-8 py-4 lg:py-6">
          {/* Lyrics */}
          {song.lyrics && (
            <section className="mb-8 lg:mb-12">
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Sözler</h2>
              <div className="bg-gradient-to-br from-spotify-gray/50 to-transparent rounded-lg p-4 lg:p-6">
                <pre className="whitespace-pre-wrap font-sans text-spotify-light-gray leading-relaxed text-sm lg:text-base">
                  {song.lyrics}
                </pre>
              </div>
            </section>
          )}

          {/* Song Info */}
          <section className="mb-8 lg:mb-12">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">Bilgiler</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-spotify-gray/30 rounded-lg p-3 lg:p-4">
                <p className="text-spotify-light-gray text-xs lg:text-sm mb-1">Dinlenme</p>
                <p className="text-lg lg:text-xl font-bold">{song.play_count.toLocaleString()}</p>
              </div>
              {song.genre && (
                <div className="bg-spotify-gray/30 rounded-lg p-3 lg:p-4">
                  <p className="text-spotify-light-gray text-xs lg:text-sm mb-1">Tür</p>
                  <p className="text-lg lg:text-xl font-bold">{song.genre}</p>
                </div>
              )}
              {song.release_year && (
                <div className="bg-spotify-gray/30 rounded-lg p-3 lg:p-4">
                  <p className="text-spotify-light-gray text-xs lg:text-sm mb-1">Yıl</p>
                  <p className="text-lg lg:text-xl font-bold">{song.release_year}</p>
                </div>
              )}
              <div className="bg-spotify-gray/30 rounded-lg p-3 lg:p-4">
                <p className="text-spotify-light-gray text-xs lg:text-sm mb-1">Eklenme Tarihi</p>
                <p className="text-base lg:text-lg font-bold">{formatDate(song.created_at)}</p>
              </div>
            </div>
          </section>

          {/* Related Songs */}
          {relatedSongs.length > 0 && (
            <section>
              <h2 className="text-xl lg:text-2xl font-bold mb-4">Diğer Şarkılar</h2>
              <div className="space-y-2">
                {relatedSongs.map((relatedSong) => (
                  <div
                    key={relatedSong.id}
                    onClick={() => handlePlayRelated(relatedSong)}
                    className={`flex items-center gap-3 lg:gap-4 p-2 lg:p-3 rounded-md cursor-pointer transition-colors ${
                      currentSong?.id === relatedSong.id ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-spotify-gray rounded overflow-hidden flex-shrink-0">
                      {relatedSong.cover_image_url ? (
                        <img src={relatedSong.cover_image_url} alt={relatedSong.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaMusic className="text-spotify-light-gray text-sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate text-sm lg:text-base ${currentSong?.id === relatedSong.id ? 'text-spotify-green' : ''}`}>
                        {relatedSong.title}
                      </p>
                      <p className="text-xs lg:text-sm text-spotify-light-gray truncate">{relatedSong.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
