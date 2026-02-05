'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Song } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

interface PlayerContextType {
  currentSong: Song | null
  isPlaying: boolean
  queue: Song[]
  currentIndex: number
  setCurrentSong: (song: Song | null) => void
  setIsPlaying: (playing: boolean) => void
  setQueue: (songs: Song[]) => void
  playSong: (song: Song, songList?: Song[]) => void
  playNext: () => void
  playPrevious: () => void
  togglePlayPause: () => void
  hasNext: boolean
  hasPrevious: boolean
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<Song[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const playSong = (song: Song, songList?: Song[]) => {
    // Eğer yeni bir liste verilmişse queue'yu güncelle
    if (songList) {
      setQueue(songList)
      const index = songList.findIndex(s => s.id === song.id)
      setCurrentIndex(index !== -1 ? index : 0)
    } else if (queue.length > 0) {
      // Mevcut queue'da şarkıyı bul
      const index = queue.findIndex(s => s.id === song.id)
      if (index !== -1) {
        setCurrentIndex(index)
      }
    }
    
    setCurrentSong(song)
    setIsPlaying(true)
    
    // Play count güncelle
    incrementPlayCount(song.id)
  }

  const incrementPlayCount = async (songId: string) => {
    try {
      // Önce RPC fonksiyonunu dene
      const { error: rpcError } = await supabase.rpc('increment_play_count', { song_id: songId })
      
      if (rpcError) {
        // RPC yoksa manuel güncelle
        const { data: currentSong } = await supabase
          .from('songs')
          .select('play_count')
          .eq('id', songId)
          .single()
        
        if (currentSong) {
          await supabase
            .from('songs')
            .update({ play_count: (currentSong.play_count || 0) + 1 })
            .eq('id', songId)
        }
      }
    } catch (e) {
      console.error('Play count güncellenemedi:', e)
    }
  }

  const playNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextSong = queue[currentIndex + 1]
      setCurrentSong(nextSong)
      setCurrentIndex(currentIndex + 1)
    }
  }

  const playPrevious = () => {
    if (currentIndex > 0) {
      const prevSong = queue[currentIndex - 1]
      setCurrentSong(prevSong)
      setCurrentIndex(currentIndex - 1)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const hasNext = currentIndex < queue.length - 1
  const hasPrevious = currentIndex > 0

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      queue,
      currentIndex,
      setCurrentSong,
      setIsPlaying,
      setQueue,
      playSong,
      playNext,
      playPrevious,
      togglePlayPause,
      hasNext,
      hasPrevious
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
