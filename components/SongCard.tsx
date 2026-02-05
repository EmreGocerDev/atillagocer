'use client'

import { Song } from '@/lib/supabase'
import { FaMusic, FaPlay, FaPause, FaHeart, FaRegHeart } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface SongCardProps {
  song: Song
  onPlay: (song: Song) => void
  isPlaying?: boolean
}

export default function SongCard({ song, onPlay, isPlaying }: SongCardProps) {
  const { user, isLiked, toggleLike } = useAuth()

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      toast.error('Beğenmek için giriş yapmalısınız')
      return
    }
    await toggleLike(song.id)
  }

  const liked = isLiked(song.id)

  return (
    <div 
      onClick={() => onPlay(song)}
      className="bg-spotify-gray/40 hover:bg-spotify-gray/80 rounded-lg p-3 lg:p-4 cursor-pointer transition-all duration-300 group card-hover"
    >
      <div className="relative mb-3 lg:mb-4">
        <div className="aspect-square bg-spotify-dark rounded-md overflow-hidden shadow-lg">
          {song.cover_image_url ? (
            <img 
              src={song.cover_image_url} 
              alt={song.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-spotify-gray to-spotify-dark">
              <FaMusic className="text-3xl lg:text-4xl text-spotify-light-gray" />
            </div>
          )}
        </div>
        
        {/* Play button overlay */}
        <button 
          className={`absolute bottom-2 right-2 w-10 h-10 lg:w-12 lg:h-12 bg-spotify-green rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          } hover:scale-105`}
        >
          {isPlaying ? (
            <FaPause className="text-black text-sm lg:text-lg" />
          ) : (
            <FaPlay className="text-black text-sm lg:text-lg ml-0.5 lg:ml-1" />
          )}
        </button>

        {/* Like button */}
        <button
          onClick={handleLike}
          className={`absolute top-2 right-2 w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            liked 
              ? 'opacity-100 text-spotify-green' 
              : 'opacity-0 group-hover:opacity-100 text-white hover:text-spotify-green bg-black/50'
          }`}
        >
          {liked ? <FaHeart className="text-sm" /> : <FaRegHeart className="text-sm" />}
        </button>
      </div>
      
      <h3 className={`font-bold truncate mb-1 text-sm lg:text-base ${isPlaying ? 'text-spotify-green' : 'text-white'}`}>
        {song.title}
      </h3>
      <p className="text-xs lg:text-sm text-spotify-light-gray truncate">
        {song.artist}
      </p>
      
      <div className="flex items-center justify-between mt-2">
        {song.genre ? (
          <span className="text-[10px] lg:text-xs bg-spotify-gray px-2 py-0.5 rounded-full text-spotify-light-gray">
            {song.genre}
          </span>
        ) : (
          <div />
        )}
        <span className="text-[10px] lg:text-xs text-spotify-light-gray">
          {song.play_count?.toLocaleString()} dinlenme
        </span>
      </div>
    </div>
  )
}
