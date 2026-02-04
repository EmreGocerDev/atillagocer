-- =====================================================
-- ATILLA GÖÇER MÜZİK SİTESİ - SUPABASE SQL ŞEMASI
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Şarkılar tablosu
CREATE TABLE songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) DEFAULT 'Atilla Göçer',
  album VARCHAR(255),
  duration INTEGER, -- saniye cinsinden
  lyrics TEXT, -- şarkı sözleri/şiir
  cover_image_url TEXT, -- kapak görseli
  audio_url TEXT NOT NULL, -- müzik dosyası URL'i
  genre VARCHAR(100),
  release_year INTEGER,
  play_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albümler tablosu
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  cover_image_url TEXT,
  release_year INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Şarkı-Albüm ilişkisi
ALTER TABLE songs ADD COLUMN album_id UUID REFERENCES albums(id) ON DELETE SET NULL;

-- Çalma listeleri (opsiyonel)
CREATE TABLE playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlist-Song ilişkisi
CREATE TABLE playlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, song_id)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Public songs are viewable by everyone" ON songs
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public albums are viewable by everyone" ON albums
  FOR SELECT USING (true);

CREATE POLICY "Public playlists are viewable by everyone" ON playlists
  FOR SELECT USING (true);

CREATE POLICY "Playlist songs are viewable by everyone" ON playlist_songs
  FOR SELECT USING (true);

-- Sadece authenticated kullanıcılar (admin) yazabilir
CREATE POLICY "Only authenticated users can insert songs" ON songs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update songs" ON songs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete songs" ON songs
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can insert albums" ON albums
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update albums" ON albums
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete albums" ON albums
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- FONKSİYONLAR
-- =====================================================

-- Play count güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION increment_play_count(song_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE songs SET play_count = play_count + 1 WHERE id = song_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET POLİCY'LERİ
-- =====================================================
-- Supabase Dashboard > Storage > New Bucket ile oluşturun:
-- 1. "songs" bucket (audio dosyaları için) - Public: ON
-- 2. "covers" bucket (kapak görselleri için) - Public: ON

-- Storage için policy'ler (SQL Editor'da çalıştırın):

-- Songs bucket - Public okuma
INSERT INTO storage.buckets (id, name, public) VALUES ('songs', 'songs', true);

-- Covers bucket - Public okuma  
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);

-- Public SELECT policy for songs bucket
CREATE POLICY "Public Access songs" ON storage.objects 
  FOR SELECT USING (bucket_id = 'songs');

-- Public SELECT policy for covers bucket
CREATE POLICY "Public Access covers" ON storage.objects 
  FOR SELECT USING (bucket_id = 'covers');

-- Anyone can upload (for simplicity - production'da kısıtlayın)
CREATE POLICY "Anyone can upload songs" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'songs');

CREATE POLICY "Anyone can upload covers" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'covers');

-- =====================================================
-- ÖRNEK VERİ (OPSİYONEL)
-- =====================================================

-- Test için örnek şarkı ekleyebilirsiniz:
-- INSERT INTO songs (title, artist, genre, lyrics, audio_url) VALUES 
-- ('Örnek Şarkı', 'Atilla Göçer', 'Şiir', 'Örnek şiir sözleri...', 'https://example.com/song.mp3');
