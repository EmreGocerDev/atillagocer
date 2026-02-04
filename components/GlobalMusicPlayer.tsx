'use client'

import { useState, useRef, useEffect } from 'react'
import { generateShareUrl } from '@/lib/utils'
import { 
  FaPlay, FaPause, FaStepBackward, FaStepForward, 
  FaVolumeUp, FaVolumeMute, FaRandom, FaRedo,
  FaMusic, FaShare, FaHeart, FaRegHeart, FaChevronDown
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import { usePlayer } from '@/contexts/PlayerContext'
import toast from 'react-hot-toast'

export default function GlobalMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

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
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, song])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setIsMuted(vol === 0)
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
    const url = generateShareUrl(song.id)
    
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

  // Expanded Full Screen Player (Mobile)
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-spotify-gray to-black flex flex-col">
        <audio
          ref={audioRef}
          src={song.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setIsExpanded(false)} className="text-white p-2">
            <FaChevronDown className="text-xl" />
          </button>
          <span className="text-xs text-spotify-light-gray uppercase tracking-wider">Şimdi Çalıyor</span>
          <button onClick={handleShare} className="text-white p-2">
            <FaShare />
          </button>
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <div className={`w-full max-w-[300px] aspect-square bg-spotify-dark rounded-lg overflow-hidden shadow-2xl ${isPlaying ? 'playing-glow' : ''}`}>
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
        <div className="px-8 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-xl font-bold text-white truncate">{song.title}</h2>
              <p className="text-spotify-light-gray truncate">{song.artist}</p>
            </div>
            <button 
              onClick={handleLike}
              className={`text-2xl transition-colors ${liked ? 'text-spotify-green' : 'text-spotify-light-gray'}`}
            >
              {liked ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 mb-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 accent-spotify-green"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-spotify-light-gray">{formatTime(currentTime)}</span>
            <span className="text-xs text-spotify-light-gray">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-8 pb-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-3 transition-colors ${isShuffle ? 'text-spotify-green' : 'text-spotify-light-gray'}`}
            >
              <FaRandom className="text-xl" />
            </button>
            <button 
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="p-3 text-white disabled:opacity-30"
            >
              <FaStepBackward className="text-2xl" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
            >
              {isPlaying ? (
                <FaPause className="text-black text-2xl" />
              ) : (
                <FaPlay className="text-black text-2xl ml-1" />
              )}
            </button>
            <button 
              onClick={onNext}
              disabled={!hasNext}
              className="p-3 text-white disabled:opacity-30"
            >
              <FaStepForward className="text-2xl" />
            </button>
            <button 
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-3 transition-colors ${isRepeat ? 'text-spotify-green' : 'text-spotify-light-gray'}`}
            >
              <FaRedo className="text-xl" />
            </button>
          </div>
        </div>

        {/* Safe area padding for mobile */}
        <div className="pb-safe"></div>
      </div>
    )
  }

  // Mini Player (Default - both mobile and desktop)
  return (
    <>
      {/* Mobile Mini Player */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-spotify-gray border-t border-black/40 z-50"
        onClick={() => setIsExpanded(true)}
      >
        <audio
          ref={audioRef}
          src={song.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
        
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

          {/* Controls */}
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

      {/* Desktop Player */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-r from-spotify-gray via-[#181818] to-spotify-gray border-t border-black/40 z-50">
        <audio
          ref={audioRef}
          src={song.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
        
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
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-spotify-light-gray w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 accent-spotify-green"
              />
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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-spotify-light-gray hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 accent-spotify-green"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
