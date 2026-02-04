'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  likedSongs: string[]
  toggleLike: (songId: string) => Promise<void>
  isLiked: (songId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [likedSongs, setLikedSongs] = useState<string[]>([])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchLikedSongs(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchLikedSongs(session.user.id)
      } else {
        setProfile(null)
        setLikedSongs([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setProfile(data)
    }
  }

  const fetchLikedSongs = async (userId: string) => {
    const { data } = await supabase
      .from('likes')
      .select('song_id')
      .eq('user_id', userId)
    
    if (data) {
      setLikedSongs(data.map(like => like.song_id))
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: username,
        }
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setLikedSongs([])
  }

  const toggleLike = async (songId: string) => {
    if (!user) return

    const isCurrentlyLiked = likedSongs.includes(songId)

    if (isCurrentlyLiked) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId)
      
      setLikedSongs(prev => prev.filter(id => id !== songId))
    } else {
      // Like
      await supabase
        .from('likes')
        .insert({ user_id: user.id, song_id: songId })
      
      setLikedSongs(prev => [...prev, songId])
    }
  }

  const isLiked = (songId: string) => likedSongs.includes(songId)

  const isAdmin = profile?.is_admin ?? false

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isAdmin,
      signUp,
      signIn,
      signOut,
      likedSongs,
      toggleLike,
      isLiked
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
