# Atilla Göçer Müzik Sitesi

Atilla Göçer için hazırlanmış müzik streaming sitesi. Spotify benzeri arayüz ile şarkıları dinleyebilir ve paylaşabilirsiniz.

## Özellikler

- 🎵 Müzik dinleme ve şarkı sözleri görüntüleme
- 🔍 Şarkı arama (isim, sanatçı, tür, söz)
- 📱 Mobil uyumlu tasarım
- 🔗 Sosyal medya paylaşımı
- 🎛️ Admin paneli ile şarkı yönetimi
- ☁️ Supabase ile veritabanı ve dosya depolama

## Kurulum

### 1. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'a gidin ve `supabase-schema.sql` dosyasındaki SQL'i çalıştırın
4. Storage bölümünde iki bucket oluşturun:
   - `songs` (müzik dosyaları için)
   - `covers` (kapak görselleri için)
5. Her iki bucket için de Public Access'i açın

### 2. Storage Bucket Policy'leri

Her bucket için şu policy'leri ekleyin:

**SELECT (Public okuma):**
```sql
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'songs');
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
```

**INSERT (Authenticated yazma):**
```sql
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### 3. Proje Kurulumu

```bash
# Bağımlılıkları yükle
npm install

# .env.local dosyası oluştur
cp .env.local.example .env.local
```

`.env.local` dosyasını düzenleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Çalıştırma

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Admin Paneli

Admin paneline `/admin` adresinden erişebilirsiniz.

**Varsayılan şifre:** `atillagocer2024`

⚠️ Şifreyi `app/admin/page.tsx` dosyasından değiştirin!

## Dosya Yapısı

```
├── app/
│   ├── admin/          # Admin paneli
│   ├── search/         # Arama sayfası
│   ├── song/[id]/      # Şarkı detay sayfası
│   ├── globals.css     # Global stiller
│   ├── layout.tsx      # Ana layout
│   └── page.tsx        # Ana sayfa
├── components/
│   ├── Header.tsx      # Üst menü
│   ├── MusicPlayer.tsx # Müzik çalar
│   ├── Sidebar.tsx     # Yan menü
│   └── SongCard.tsx    # Şarkı kartı
├── lib/
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Yardımcı fonksiyonlar
```

## Deployment

### Vercel

1. GitHub'a push edin
2. Vercel'de import edin
3. Environment variables ekleyin
4. Deploy!

### Diğer Platformlar

Standart Next.js deployment yöntemlerini kullanabilirsiniz.

## Lisans

Bu proje Atilla Göçer için özel olarak geliştirilmiştir.
