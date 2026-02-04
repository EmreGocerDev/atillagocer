-- =====================================================
-- ADMIN SİSTEMİ SQL - SUPABASE'DE ÇALIŞTIRILACAK
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Profiles tablosuna is_admin alanı ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Admin kontrolü için fonksiyon
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profil okuma policy güncelle (admin durumu herkes tarafından görülebilir)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- İlk admin kullanıcıyı ayarlamak için (e-posta adresinizi girin)
-- UPDATE profiles 
-- SET is_admin = true 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- Veya doğrudan user_id ile:
-- UPDATE profiles SET is_admin = true WHERE id = 'your-user-uuid-here';

-- =====================================================
-- ADMIN YAPMA YARDIMCI KOMUTLARI
-- =====================================================

-- Tüm kullanıcıları listele (admin yapmak için id'yi bul)
-- SELECT p.id, p.username, au.email, p.is_admin 
-- FROM profiles p 
-- JOIN auth.users au ON p.id = au.id;

-- Belirli e-posta'yı admin yap
-- UPDATE profiles 
-- SET is_admin = true 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'sizin@email.com');
