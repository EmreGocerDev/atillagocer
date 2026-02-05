'use client'

import { useState, useRef, useEffect } from 'react'
import { generateShareUrl } from '@/lib/utils'
import { 
  FaPlay, FaPause, FaStepBackward, FaStepForward, 
  FaRandom, FaRedo,
  FaMusic, FaShare, FaHeart, FaRegHeart, FaChevronDown,
  FaInstagram, FaTwitter, FaWhatsapp, FaCopy
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import { usePlayer } from '@/contexts/PlayerContext'
import toast from 'react-hot-toast'

export default function GlobalMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const { user, isLiked, toggleLike } = useAuth()
  const { 
    currentSong: song, 
    isPlaying, 
    setIsPlaying, 
    playNext: onNext, 
    playPrevious: onPrevious,
    hasNext,
    hasPrevious
  } = usePlayer()

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1 // Always full volume
      if (isPlaying) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Playback error:', error)
          })
        }
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, song])

  // Reset time when song changes
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
  }, [song?.id])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * duration
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleEnded = () => {
    if (isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    } else if (hasNext) {
      onNext()
    } else {
      setIsPlaying(false)
    }
  }

  const handleShare = async () => {
    if (!song) return
    setShowShareMenu(true)
  }

  const shareToSocial = async (platform: string) => {
    if (!song) return
    const url = generateShareUrl(song.id)
    const text = `🎵 ${song.title} - ${song.artist}\n\nAtilla Göçer'in bu harika şarkısını dinle!`
    
    switch (platform) {
      case 'download':
        // Create a collage with song info
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 1080
          canvas.height = 1080
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            toast.error('Canvas desteklenmiyor')
            return
          }

          // Background gradient
          const gradient = ctx.createLinearGradient(0, 0, 0, 1080)
          gradient.addColorStop(0, '#1DB954')
          gradient.addColorStop(1, '#121212')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, 1080, 1080)

          // Load and draw cover image
          if (song.cover_image_url) {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
              img.src = song.cover_image_url as string
            })
            
            // Draw cover image centered with shadow
            const imgSize = 700
            const imgX = (1080 - imgSize) / 2
            const imgY = 150
            
            // Shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
            ctx.shadowBlur = 30
            ctx.shadowOffsetY = 15
            
            ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
            
            // Reset shadow
            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0
            ctx.shadowOffsetY = 0
          }

          // Song title
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 60px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(song.title, 540, 920)

          // Artist name
          ctx.fillStyle = '#B3B3B3'
          ctx.font = '40px Arial, sans-serif'
          ctx.fillText(song.artist, 540, 980)

          // Atilla Göçer branding
          ctx.fillStyle = '#1DB954'
          ctx.font = 'bold 32px Arial, sans-serif'
          ctx.fillText('🎵 Atilla Göçer', 540, 1040)

          // Convert to blob and download
          canvas.toBlob((blob) => {
            if (!blob) {
              toast.error('Görsel oluşturulamadı')
              return
            }
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `${song.title} - ${song.artist}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
            toast.success('Görsel indirildi!')
          }, 'image/png')
        } catch (error) {
          console.error('Download error:', error)
          toast.error('İndirme başarısız oldu')
        }
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank')
        break
      case 'copy':
        copyToClipboard(url)
        break
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: song.title,
              text: `${song.title} - ${song.artist}`,
              url: url,
            })
          } catch (err) {
            copyToClipboard(url)
          }
        } else {
          copyToClipboard(url)
        }
        break
    }
    setShowShareMenu(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link kopyalandı!')
  }

  const handleLike = async () => {
    if (!song) return
    if (!user) {
      toast.error('Beğenmek için giriş yapmalısınız')
      return
    }
    await toggleLike(song.id)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const liked = song ? isLiked(song.id) : false

  // No song selected
  if (!song) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-16 lg:h-24 bg-spotify-gray border-t border-black/40 flex items-center justify-center z-50">
        <p className="text-spotify-light-gray text-sm lg:text-base">Çalmak için bir şarkı seçin</p>
      </div>
    )
  }

  return (
    <>
      {/* SINGLE AUDIO ELEMENT - ALWAYS RENDERED */}
      <audio
        ref={audioRef}
        src={song.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Share Menu Modal */}
      {showShareMenu && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowShareMenu(false)}>
      <div className="bg-spotify-gray rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {/* Share Preview Card */}
        <div className="bg-gradient-to-br from-spotify-green/20 to-spotify-dark rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              {song.cover_image_url ? (
                <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-spotify-dark flex items-center justify-center">
                  <FaMusic className="text-2xl text-spotify-light-gray" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{song.title}</p>
              <p className="text-sm text-spotify-light-gray truncate">{song.artist}</p>
              <p className="text-xs text-spotify-green mt-1">🎵 Atilla Göçer Müzik</p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-4 text-center">Paylaş</h3>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <button 
            onClick={() => shareToSocial('whatsapp')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-600/20 hover:bg-green-600/40 transition-colors"
          >
            <FaWhatsapp className="text-2xl text-green-500" />
            <span className="text-xs text-white">WhatsApp</span>
          </button>
          <button 
            onClick={() => shareToSocial('download')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 transition-colors"
          >
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-xs text-white">PNG İndir</span>
          </button>
          <button 
            onClick={() => shareToSocial('twitter')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 transition-colors"
          >
            <FaTwitter className="text-2xl text-blue-400" />
            <span className="text-xs text-white">Twitter</span>
          </button>
          <button 
            onClick={() => shareToSocial('copy')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-600/20 hover:bg-gray-600/40 transition-colors"
          >
            <FaCopy className="text-2xl text-gray-400" />
            <span className="text-xs text-white">Kopyala</span>
          </button>
        </div>

        {typeof window !== 'undefined' && 'share' in navigator && (
          <button 
            onClick={() => shareToSocial('native')}
            className="w-full py-3 bg-spotify-green text-black font-bold rounded-full hover:bg-spotify-green/90 transition-colors"
          >
            Diğer Uygulamalar
          </button>
        )}
      </div>
    </div>
  )}

  {/* Expanded Full Screen Player (Mobile) */}
  {isExpanded && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
          {/* Blurred Background Image */}
          {song.cover_image_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${song.cover_image_url})`,
                filter: 'blur(30px)',
                transform: 'scale(1.2)'
              }}
            />
          )}
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* Gradient from bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Content */}
          <div className="relative z-20 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-safe">
              <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="text-white p-2 bg-white/10 rounded-full backdrop-blur-sm">
                <FaChevronDown className="text-xl" />
              </button>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Şimdi Çalıyor</span>
              <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="text-white p-2 bg-white/10 rounded-full backdrop-blur-sm">
                <FaShare />
              </button>
            </div>

            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center px-8 py-4">
              <div className={`w-full max-w-[280px] aspect-square bg-spotify-dark rounded-2xl overflow-hidden shadow-2xl ${isPlaying ? 'playing-glow' : ''}`}>
                {song.cover_image_url ? (
                  <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-spotify-gray to-spotify-dark">
                    <FaMusic className="text-6xl text-spotify-light-gray" />
                  </div>
                )}
              </div>
            </div>

            {/* Song Info & Like */}
            <div className="px-8 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h2 className="text-2xl font-bold text-white truncate">{song.title}</h2>
                  <p className="text-white/70 truncate text-lg">{song.artist}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLike(); }}
                  className={`text-2xl transition-all transform active:scale-125 ${liked ? 'text-spotify-green' : 'text-white/60'}`}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-8 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60 font-medium min-w-[40px]">{formatTime(currentTime)}</span>
                <div className="flex-1 relative group cursor-pointer" onClick={handleProgressClick}>
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all group-hover:bg-spotify-green"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-white/60 font-medium min-w-[40px] text-right">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="px-8 pb-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle); }}
                  className={`p-3 transition-colors ${isShuffle ? 'text-spotify-green' : 'text-white/60'}`}
                >
                  <FaRandom className="text-xl" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onPrevious(); }}
                  disabled={!hasPrevious}
                  className="p-3 text-white disabled:opacity-30"
                >
                  <FaStepBackward className="text-3xl" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                  className="w-18 h-18 bg-white rounded-full flex items-center justify-center shadow-lg"
                  style={{ width: '72px', height: '72px' }}
                >
                  {isPlaying ? (
                    <FaPause className="text-black text-2xl" />
                  ) : (
                    <FaPlay className="text-black text-2xl ml-1" />
                  )}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onNext(); }}
                  disabled={!hasNext}
                  className="p-3 text-white disabled:opacity-30"
                >
                  <FaStepForward className="text-3xl" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsRepeat(!isRepeat); }}
                  className={`p-3 transition-colors ${isRepeat ? 'text-spotify-green' : 'text-white/60'}`}
                >
                  <FaRedo className="text-xl" />
                </button>
              </div>
            </div>



            {/* Safe area padding for iOS notch/home indicator */}
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}></div>
          </div>
        </div>
  )}

  {/* Mobile Mini Player */}
  {!isExpanded && (
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-spotify-gray border-t border-black/40 z-50"
        onClick={() => setIsExpanded(true)}
      >
        {/* Progress bar at top */}
        <div className="h-1 bg-spotify-dark">
          <div 
            className="h-full bg-spotify-green transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="flex items-center gap-3 p-3">
          {/* Album Art */}
          <div className={`w-12 h-12 bg-spotify-dark rounded flex-shrink-0 overflow-hidden ${isPlaying ? 'playing-glow' : ''}`}>
            {song.cover_image_url ? (
              <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaMusic className="text-spotify-light-gray" />
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm truncate">{song.title}</p>
            <p className="text-xs text-spotify-light-gray truncate">{song.artist}</p>
          </div>

          {/* Play Count & Controls */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-spotify-light-gray mr-1 whitespace-nowrap">
              {song.play_count?.toLocaleString()} dinleme
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                handleLike()
              }}
              className={`p-2 ${liked ? 'text-spotify-green' : 'text-spotify-light-gray'}`}
            >
              {liked ? <FaHeart /> : <FaRegHeart />}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setIsPlaying(!isPlaying)
              }}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
            >
              {isPlaying ? (
                <FaPause className="text-black" />
              ) : (
                <FaPlay className="text-black ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
  )}

      {/* Desktop Player */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-r from-spotify-gray via-[#181818] to-spotify-gray border-t border-black/40 z-50">
        <div className="flex items-center justify-between h-full px-4 max-w-screen-2xl mx-auto">
          {/* Song Info */}
          <div className="flex items-center gap-4 w-1/4 min-w-0">
            <div className={`w-14 h-14 bg-spotify-dark rounded flex-shrink-0 overflow-hidden ${isPlaying ? 'playing-glow' : ''}`}>
              {song.cover_image_url ? (
                <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaMusic className="text-spotify-light-gray text-xl" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white truncate">{song.title}</p>
              <p className="text-sm text-spotify-light-gray truncate">{song.artist}</p>
            </div>
            <button 
              onClick={handleLike}
              className={`ml-2 transition-colors ${liked ? 'text-spotify-green' : 'text-spotify-light-gray hover:text-white'}`}
            >
              {liked ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center w-2/4 max-w-xl">
            <div className="flex items-center gap-6 mb-2">
              <button 
                onClick={() => setIsShuffle(!isShuffle)}
                className={`transition-colors ${isShuffle ? 'text-spotify-green' : 'text-spotify-light-gray hover:text-white'}`}
              >
                <FaRandom />
              </button>
              <button 
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="text-spotify-light-gray hover:text-white disabled:opacity-30 transition-colors"
              >
                <FaStepBackward className="text-xl" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <FaPause className="text-black text-lg" />
                ) : (
                  <FaPlay className="text-black text-lg ml-1" />
                )}
              </button>
              <button 
                onClick={onNext}
                disabled={!hasNext}
                className="text-spotify-light-gray hover:text-white disabled:opacity-30 transition-colors"
              >
                <FaStepForward className="text-xl" />
              </button>
              <button 
                onClick={() => setIsRepeat(!isRepeat)}
                className={`transition-colors ${isRepeat ? 'text-spotify-green' : 'text-spotify-light-gray hover:text-white'}`}
              >
                <FaRedo />
              </button>
            </div>
            
            {/* Progress Bar - Always visible */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-spotify-light-gray w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative h-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
                />
                <div className="absolute inset-0 bg-[#4d4d4d] rounded-full" />
                <div 
                  className="absolute left-0 top-0 h-full bg-white rounded-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-all"
                  style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 6px)` }}
                />
              </div>
              <span className="text-xs text-spotify-light-gray w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Share */}
          <div className="flex items-center gap-4 w-1/4 justify-end">
            <button 
              onClick={handleShare}
              className="text-spotify-light-gray hover:text-white transition-colors"
              title="Paylaş"
            >
              <FaShare />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
