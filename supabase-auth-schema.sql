-- =====================================================
-- EK SQL - KULLANICI VE BEĞENİ SİSTEMİ
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Kullanıcı profilleri tablosu (auth.users ile ilişkili)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beğeniler tablosu
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Profil otomatik oluşturma trigger'ı
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Şarkı beğeni sayısı view'ı
CREATE OR REPLACE VIEW song_likes_count AS
SELECT song_id, COUNT(*) as like_count
FROM likes
GROUP BY song_id;

-- =====================================================
-- STORAGE POLİCY GÜNCELLEMESİ
-- =====================================================
-- Önce eski policy'leri sil (hata verirse ignore et)
DROP POLICY IF EXISTS "Public Access songs" ON storage.objects;
DROP POLICY IF EXISTS "Public Access covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload songs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload covers" ON storage.objects;

-- Yeni policy'ler - Herkes okuyabilir
CREATE POLICY "Allow public read songs" ON storage.objects
  FOR SELECT USING (bucket_id = 'songs');

CREATE POLICY "Allow public read covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

-- Herkes yükleyebilir (basitlik için)
CREATE POLICY "Allow public upload songs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'songs');

CREATE POLICY "Allow public upload covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'covers');

-- Herkes güncelleyebilir/silebilir
CREATE POLICY "Allow public update songs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'songs');

CREATE POLICY "Allow public delete songs" ON storage.objects
  FOR DELETE USING (bucket_id = 'songs');

CREATE POLICY "Allow public update covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'covers');

CREATE POLICY "Allow public delete covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'covers');
