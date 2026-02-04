'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Song, Album } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { 
  FaMusic, FaUpload, FaTrash, FaEdit, FaPlus, 
  FaEye, FaEyeSlash, FaCheck, FaTimes, FaImage,
  FaSignOutAlt, FaExclamationTriangle, FaMagic, FaSpinner, FaRobot
} from 'react-icons/fa'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut, isAdmin } = useAuth()
  
  const [songs, setSongs] = useState<Song[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'songs' | 'albums' | 'add'>('songs')
  const [editingSong, setEditingSong] = useState<Song | null>(null)

  // AI Image Generation States
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStyle, setAiStyle] = useState('album-cover')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [showAiGenerator, setShowAiGenerator] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    artist: 'Atilla Göçer',
    album: '',
    album_id: '',
    genre: '',
    release_year: new Date().getFullYear(),
    lyrics: '',
    duration: 0,
    audio_url: '',
    cover_url: '',
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [useUrlInput, setUseUrlInput] = useState(false)

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchData()
    }
  }, [authLoading, isAdmin])

  async function fetchData() {
    setLoading(true)
    
    const [songsRes, albumsRes] = await Promise.all([
      supabase.from('songs').select('*').order('created_at', { ascending: false }),
      supabase.from('albums').select('*').order('created_at', { ascending: false })
    ])

    if (songsRes.data) setSongs(songsRes.data)
    if (albumsRes.data) setAlbums(albumsRes.data)
    
    setLoading(false)
  }

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // URL modunda URL kontrolü, dosya modunda dosya kontrolü
    if (useUrlInput) {
      if (!formData.audio_url && !editingSong) {
        toast.error('Lütfen bir müzik URL\'i girin')
        return
      }
    } else {
      if (!audioFile && !editingSong) {
        toast.error('Lütfen bir müzik dosyası seçin')
        return
      }
    }

    setUploading(true)

    try {
      let audioUrl = editingSong?.audio_url || ''
      let coverUrl = editingSong?.cover_image_url || ''

      if (useUrlInput) {
        // URL modunda direkt URL kullan
        if (formData.audio_url) audioUrl = formData.audio_url
        if (formData.cover_url) coverUrl = formData.cover_url
      } else {
        // Dosya yükleme modu
        if (audioFile) {
          const url = await uploadFile(audioFile, 'songs')
          if (url) audioUrl = url
          else throw new Error('Müzik dosyası yüklenemedi. Storage ayarlarını kontrol edin.')
        }

        if (coverFile) {
          const url = await uploadFile(coverFile, 'covers')
          if (url) coverUrl = url
        } else if (generatedImage) {
          // AI ile oluşturulan görsel varsa onu kullan
          coverUrl = generatedImage
        }
      }

      // Get audio duration
      let duration = formData.duration
      if (audioFile && !duration) {
        duration = await getAudioDuration(audioFile)
      }

      const songData = {
        title: formData.title,
        artist: formData.artist,
        album: formData.album || null,
        album_id: formData.album_id || null,
        genre: formData.genre || null,
        release_year: formData.release_year || null,
        lyrics: formData.lyrics || null,
        duration: duration,
        audio_url: audioUrl,
        cover_image_url: coverUrl || null,
        is_published: true
      }

      if (editingSong) {
        // Update existing song
        const { error } = await supabase
          .from('songs')
          .update(songData)
          .eq('id', editingSong.id)

        if (error) throw error
        toast.success('Şarkı güncellendi!')
      } else {
        // Insert new song
        const { error } = await supabase
          .from('songs')
          .insert([songData])

        if (error) throw error
        toast.success('Şarkı başarıyla eklendi!')
      }

      // Reset form
      resetForm()
      fetchData()
      setActiveTab('songs')
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration))
      }
      audio.src = URL.createObjectURL(file)
    })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      artist: 'Atilla Göçer',
      album: '',
      album_id: '',
      genre: '',
      release_year: new Date().getFullYear(),
      lyrics: '',
      duration: 0,
      audio_url: '',
      cover_url: '',
    })
    setAudioFile(null)
    setCoverFile(null)
    setEditingSong(null)
    setUseUrlInput(false)
    setGeneratedImage(null)
    setAiPrompt('')
    setShowAiGenerator(false)
  }

  // AI Image Generation Function
  const generateAiImage = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Lütfen bir açıklama girin')
      return
    }

    setGeneratingImage(true)
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, style: aiStyle })
      })

      const data = await response.json()

      if (data.error) {
        if (data.loading) {
          toast.error('Model yükleniyor, lütfen 20-30 saniye bekleyip tekrar deneyin')
        } else {
          toast.error(data.error)
        }
        return
      }

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl)
        setFormData(prev => ({ ...prev, cover_url: data.imageUrl }))
        toast.success('Görsel başarıyla oluşturuldu!')
      }
    } catch (error) {
      toast.error('Görsel oluşturulurken hata oluştu')
      console.error(error)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleEdit = (song: Song) => {
    setEditingSong(song)
    setFormData({
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      album_id: song.album_id || '',
      genre: song.genre || '',
      release_year: song.release_year || new Date().getFullYear(),
      lyrics: song.lyrics || '',
      duration: song.duration || 0,
      audio_url: song.audio_url || '',
      cover_url: song.cover_image_url || '',
    })
    setActiveTab('add')
  }

  const handleDelete = async (songId: string) => {
    if (!confirm('Bu şarkıyı silmek istediğinizden emin misiniz?')) return

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId)

    if (error) {
      toast.error('Silme işlemi başarısız')
    } else {
      toast.success('Şarkı silindi')
      fetchData()
    }
  }

  const togglePublish = async (song: Song) => {
    const { error } = await supabase
      .from('songs')
      .update({ is_published: !song.is_published })
      .eq('id', song.id)

    if (error) {
      toast.error('Güncelleme başarısız')
    } else {
      toast.success(song.is_published ? 'Şarkı gizlendi' : 'Şarkı yayınlandı')
      fetchData()
    }
  }

  // Loading
  if (authLoading) {
    return (
      <div className="flex h-screen bg-spotify-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
        </main>
      </div>
    )
  }

  // Not logged in or not admin
  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen bg-spotify-dark">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-spotify-gray rounded-lg p-6 lg:p-8 w-full max-w-md text-center">
            <FaExclamationTriangle className="text-4xl lg:text-5xl text-yellow-500 mx-auto mb-4" />
            <h1 className="text-xl lg:text-2xl font-bold mb-2">Erişim Engellendi</h1>
            <p className="text-spotify-light-gray mb-6 text-sm lg:text-base">
              Bu sayfaya erişim yetkiniz bulunmuyor.
              <br />
              Sadece yöneticiler bu sayfayı görüntüleyebilir.
            </p>
            {!user ? (
              <p className="text-sm text-spotify-light-gray">
                Yönetici iseniz lütfen giriş yapın.
              </p>
            ) : (
              <div className="text-sm text-spotify-light-gray">
                <p className="mb-2">Mevcut hesap: {user.email}</p>
                <p className="text-yellow-500 mt-2">
                  Admin olmak için Supabase üzerinden profiles tablosunda is_admin alanını true yapın.
                </p>
              </div>
            )}
            <button
              onClick={() => router.push('/')}
              className="mt-6 bg-spotify-green text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-spotify-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Yönetim Paneli</h1>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-spotify-light-gray hover:text-white transition-colors"
            >
              <FaSignOutAlt />
              Çıkış Yap
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => { setActiveTab('songs'); resetForm(); }}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                activeTab === 'songs' 
                  ? 'bg-spotify-green text-black' 
                  : 'bg-spotify-gray text-white hover:bg-spotify-gray/80'
              }`}
            >
              <FaMusic className="inline mr-2" />
              Şarkılar ({songs.length})
            </button>
            <button
              onClick={() => { setActiveTab('add'); resetForm(); }}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                activeTab === 'add' 
                  ? 'bg-spotify-green text-black' 
                  : 'bg-spotify-gray text-white hover:bg-spotify-gray/80'
              }`}
            >
              <FaPlus className="inline mr-2" />
              {editingSong ? 'Düzenle' : 'Yeni Şarkı'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
            </div>
          ) : activeTab === 'songs' ? (
            // Songs List
            <div className="bg-spotify-gray/30 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-spotify-dark text-left text-spotify-light-gray text-sm">
                    <th className="p-4">Kapak</th>
                    <th className="p-4">Başlık</th>
                    <th className="p-4">Tür</th>
                    <th className="p-4">Dinlenme</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song) => (
                    <tr key={song.id} className="border-b border-spotify-dark/50 hover:bg-white/5">
                      <td className="p-4">
                        <div className="w-12 h-12 bg-spotify-dark rounded overflow-hidden">
                          {song.cover_image_url ? (
                            <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaMusic className="text-spotify-light-gray" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{song.title}</p>
                        <p className="text-sm text-spotify-light-gray">{song.artist}</p>
                      </td>
                      <td className="p-4 text-spotify-light-gray">{song.genre || '-'}</td>
                      <td className="p-4 text-spotify-light-gray">{song.play_count.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          song.is_published 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {song.is_published ? <FaCheck /> : <FaTimes />}
                          {song.is_published ? 'Yayında' : 'Gizli'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePublish(song)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title={song.is_published ? 'Gizle' : 'Yayınla'}
                          >
                            {song.is_published ? <FaEyeSlash /> : <FaEye />}
                          </button>
                          <button
                            onClick={() => handleEdit(song)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-blue-400"
                            title="Düzenle"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(song.id)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400"
                            title="Sil"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {songs.length === 0 && (
                <div className="text-center py-12">
                  <FaMusic className="text-4xl text-spotify-gray mx-auto mb-4" />
                  <p className="text-spotify-light-gray">Henüz şarkı eklenmemiş</p>
                </div>
              )}
            </div>
          ) : (
            // Add/Edit Form
            <form onSubmit={handleSubmit} className="max-w-2xl">
              <div className="bg-spotify-gray/30 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingSong ? 'Şarkıyı Düzenle' : 'Yeni Şarkı Ekle'}
                </h2>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Şarkı Adı *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                    placeholder="Şarkı adını girin"
                  />
                </div>

                {/* Artist */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sanatçı</label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                  />
                </div>

                {/* Genre & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tür</label>
                    <input
                      type="text"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                      placeholder="Şiir, Türkü, Pop..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Yıl</label>
                    <input
                      type="number"
                      value={formData.release_year}
                      onChange={(e) => setFormData({ ...formData, release_year: parseInt(e.target.value) })}
                      className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                    />
                  </div>
                </div>

                {/* Lyrics */}
                <div>
                  <label className="block text-sm font-medium mb-2">Şarkı Sözleri / Şiir</label>
                  <textarea
                    value={formData.lyrics}
                    onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                    rows={6}
                    className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-green resize-none"
                    placeholder="Şarkı sözlerini veya şiiri buraya yazın..."
                  />
                </div>

                {/* Upload Mode Toggle */}
                <div className="flex items-center gap-4 p-4 bg-spotify-dark rounded-lg">
                  <span className="text-sm">Yükleme Yöntemi:</span>
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(false)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      !useUrlInput ? 'bg-spotify-green text-black' : 'bg-spotify-gray text-white'
                    }`}
                  >
                    Dosya Yükle
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(true)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      useUrlInput ? 'bg-spotify-green text-black' : 'bg-spotify-gray text-white'
                    }`}
                  >
                    URL Gir
                  </button>
                </div>

                {useUrlInput ? (
                  <>
                    {/* Audio URL */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Müzik URL'i {!editingSong && '*'}
                      </label>
                      <input
                        type="url"
                        value={formData.audio_url}
                        onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                        className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                        placeholder="https://example.com/music.mp3"
                      />
                      <p className="text-xs text-spotify-light-gray mt-1">
                        Direkt müzik dosyası linki girin (MP3, WAV, M4A)
                      </p>
                    </div>

                    {/* Cover URL */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Kapak Görseli URL'i</label>
                      <input
                        type="url"
                        value={formData.cover_url}
                        onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                        className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                        placeholder="https://example.com/cover.jpg"
                      />
                      
                      {/* AI Image Generator Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowAiGenerator(!showAiGenerator)}
                        className="mt-3 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
                      >
                        <FaMagic />
                        {showAiGenerator ? 'AI Görsel Oluşturucuyu Gizle' : 'AI ile Görsel Oluştur'}
                      </button>

                      {/* AI Image Generator Panel */}
                      {showAiGenerator && (
                        <div className="mt-4 p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
                          <div className="flex items-center gap-2 mb-4 text-purple-400">
                            <FaRobot className="text-xl" />
                            <span className="font-medium">AI Görsel Oluşturucu</span>
                          </div>

                          {/* Style Selection */}
                          <div className="mb-4">
                            <label className="block text-sm text-spotify-light-gray mb-2">Stil Seçin</label>
                            <select
                              value={aiStyle}
                              onChange={(e) => setAiStyle(e.target.value)}
                              className="w-full bg-spotify-dark rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            >
                              <option value="album-cover">Albüm Kapağı</option>
                              <option value="turkish">Türk Müziği</option>
                              <option value="rock">Rock</option>
                              <option value="pop">Pop</option>
                              <option value="jazz">Jazz</option>
                              <option value="classical">Klasik</option>
                              <option value="electronic">Elektronik</option>
                              <option value="folk">Folk</option>
                              <option value="blues">Blues</option>
                              <option value="hiphop">Hip Hop</option>
                            </select>
                          </div>

                          {/* Prompt Input */}
                          <div className="mb-4">
                            <label className="block text-sm text-spotify-light-gray mb-2">Görsel Açıklaması</label>
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Örn: Gün batımında bir sahil, romantik hissiyat, pastel renkler..."
                              className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                              rows={3}
                            />
                          </div>

                          {/* Generate Button */}
                          <button
                            type="button"
                            onClick={generateAiImage}
                            disabled={generatingImage || !aiPrompt.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            {generatingImage ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Oluşturuluyor... (20-30 sn)
                              </>
                            ) : (
                              <>
                                <FaMagic />
                                Görsel Oluştur
                              </>
                            )}
                          </button>

                          {/* Generated Image Preview */}
                          {generatedImage && (
                            <div className="mt-4">
                              <p className="text-sm text-spotify-light-gray mb-2">Oluşturulan Görsel:</p>
                              <div className="relative">
                                <img 
                                  src={generatedImage} 
                                  alt="AI Generated" 
                                  className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, cover_url: generatedImage }))
                                    toast.success('Görsel kapak olarak ayarlandı!')
                                  }}
                                  className="mt-2 w-full bg-spotify-green text-black font-medium py-2 rounded-lg text-sm"
                                >
                                  Bu Görseli Kullan
                                </button>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-spotify-light-gray mt-3">
                            💡 İpucu: Türkçe veya İngilizce açıklama yazabilirsiniz. Stil seçimi görselin havasını belirler.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Audio File */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Müzik Dosyası {!editingSong && '*'}
                      </label>
                      <div className="border-2 border-dashed border-spotify-gray rounded-lg p-6 text-center hover:border-spotify-green transition-colors">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="audio-upload"
                        />
                        <label htmlFor="audio-upload" className="cursor-pointer">
                          <FaUpload className="text-3xl text-spotify-light-gray mx-auto mb-2" />
                          {audioFile ? (
                            <p className="text-spotify-green">{audioFile.name}</p>
                          ) : (
                            <p className="text-spotify-light-gray">
                              {editingSong ? 'Yeni dosya seçin (opsiyonel)' : 'MP3, WAV, M4A dosyası seçin'}
                            </p>
                          )}
                        </label>
                      </div>
                      <p className="text-xs text-yellow-500 mt-2">
                        ⚠️ Dosya yükleme çalışmıyorsa "URL Gir" modunu kullanın
                      </p>
                    </div>

                    {/* Cover Image */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Kapak Görseli</label>
                      <div className="border-2 border-dashed border-spotify-gray rounded-lg p-6 text-center hover:border-spotify-green transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="cover-upload"
                        />
                        <label htmlFor="cover-upload" className="cursor-pointer">
                          <FaImage className="text-3xl text-spotify-light-gray mx-auto mb-2" />
                          {coverFile ? (
                            <p className="text-spotify-green">{coverFile.name}</p>
                          ) : generatedImage ? (
                            <p className="text-purple-400">AI ile oluşturulan görsel seçili</p>
                          ) : (
                            <p className="text-spotify-light-gray">
                              {editingSong?.cover_image_url ? 'Yeni görsel seçin (opsiyonel)' : 'JPG, PNG, WebP dosyası seçin'}
                            </p>
                          )}
                        </label>
                      </div>
                      
                      {/* AI Image Generator Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowAiGenerator(!showAiGenerator)}
                        className="mt-3 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
                      >
                        <FaMagic />
                        {showAiGenerator ? 'AI Görsel Oluşturucuyu Gizle' : 'AI ile Görsel Oluştur'}
                      </button>

                      {/* AI Image Generator Panel */}
                      {showAiGenerator && (
                        <div className="mt-4 p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
                          <div className="flex items-center gap-2 mb-4 text-purple-400">
                            <FaRobot className="text-xl" />
                            <span className="font-medium">AI Görsel Oluşturucu</span>
                          </div>

                          {/* Style Selection */}
                          <div className="mb-4">
                            <label className="block text-sm text-spotify-light-gray mb-2">Stil Seçin</label>
                            <select
                              value={aiStyle}
                              onChange={(e) => setAiStyle(e.target.value)}
                              className="w-full bg-spotify-dark rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            >
                              <option value="album-cover">Albüm Kapağı</option>
                              <option value="turkish">Türk Müziği</option>
                              <option value="rock">Rock</option>
                              <option value="pop">Pop</option>
                              <option value="jazz">Jazz</option>
                              <option value="classical">Klasik</option>
                              <option value="electronic">Elektronik</option>
                              <option value="folk">Folk</option>
                              <option value="blues">Blues</option>
                              <option value="hiphop">Hip Hop</option>
                            </select>
                          </div>

                          {/* Prompt Input */}
                          <div className="mb-4">
                            <label className="block text-sm text-spotify-light-gray mb-2">Görsel Açıklaması</label>
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Örn: Gün batımında bir sahil, romantik hissiyat, pastel renkler..."
                              className="w-full bg-spotify-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                              rows={3}
                            />
                          </div>

                          {/* Generate Button */}
                          <button
                            type="button"
                            onClick={generateAiImage}
                            disabled={generatingImage || !aiPrompt.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            {generatingImage ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Oluşturuluyor... (20-30 sn)
                              </>
                            ) : (
                              <>
                                <FaMagic />
                                Görsel Oluştur
                              </>
                            )}
                          </button>

                          {/* Generated Image Preview */}
                          {generatedImage && (
                            <div className="mt-4">
                              <p className="text-sm text-spotify-light-gray mb-2">Oluşturulan Görsel:</p>
                              <img 
                                src={generatedImage} 
                                alt="AI Generated" 
                                className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
                              />
                              <p className="text-xs text-green-400 mt-2 text-center">
                                ✓ Bu görsel kapak olarak kullanılacak
                              </p>
                            </div>
                          )}

                          <p className="text-xs text-spotify-light-gray mt-3">
                            💡 İpucu: Türkçe veya İngilizce açıklama yazabilirsiniz. Stil seçimi görselin havasını belirler.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-spotify-green text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                        Yükleniyor...
                      </span>
                    ) : editingSong ? (
                      'Güncelle'
                    ) : (
                      'Şarkıyı Ekle'
                    )}
                  </button>
                  {editingSong && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-8 py-3 bg-spotify-gray text-white font-bold rounded-full hover:bg-spotify-gray/80 transition-colors"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
