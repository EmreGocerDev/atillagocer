import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Song = {
  id: string
  title: string
  artist: string
  album: string | null
  album_id: string | null
  duration: number | null
  lyrics: string | null
  cover_image_url: string | null
  audio_url: string
  genre: string | null
  release_year: number | null
  play_count: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type Album = {
  id: string
  title: string
  cover_image_url: string | null
  release_year: number | null
  description: string | null
  created_at: string
}

export type Playlist = {
  id: string
  name: string
  description: string | null
  cover_image_url: string | null
  created_at: string
}
