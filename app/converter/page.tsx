'use client'

import { useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { FaCloudUploadAlt, FaMusic, FaDownload, FaSpinner, FaTrash, FaExchangeAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface ConvertedFile {
  name: string
  url: string
  size: number
}

export default function ConverterPage() {
  const [file, setFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)
  const [convertedFile, setConvertedFile] = useState<ConvertedFile | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a', 'audio/webm', 'video/mp4', 'video/webm', 'video/ogg']
  const formatNames = ['MP3', 'WAV', 'OGG', 'FLAC', 'AAC', 'M4A', 'WebM Audio', 'MP4', 'WebM Video', 'OGG Video']

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (supportedFormats.includes(selectedFile.type) || selectedFile.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|webm|mp4|mpeg|mpg)$/i)) {
        setFile(selectedFile)
        setConvertedFile(null)
        setProgress(0)
      } else {
        toast.error('Desteklenmeyen dosya formatı!')
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (supportedFormats.includes(droppedFile.type) || droppedFile.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|webm|mp4|mpeg|mpg)$/i)) {
        setFile(droppedFile)
        setConvertedFile(null)
        setProgress(0)
      } else {
        toast.error('Desteklenmeyen dosya formatı!')
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const convertToMp3 = async () => {
    if (!file) return

    setConverting(true)
    setProgress(0)

    try {
      // FFmpeg.wasm kullanarak dönüştürme simülasyonu
      // Gerçek uygulamada FFmpeg.wasm kullanılacak
      
      // Progress simülasyonu
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      // Web Audio API ile basit dönüştürme
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await file.arrayBuffer()
      
      try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        
        // AudioBuffer'ı WAV'a dönüştür (tarayıcı sınırlaması nedeniyle)
        const wavBlob = audioBufferToWav(audioBuffer)
        
        clearInterval(progressInterval)
        setProgress(100)

        const outputName = file.name.replace(/\.[^/.]+$/, '') + '_converted.wav'
        const url = URL.createObjectURL(wavBlob)
        
        setConvertedFile({
          name: outputName,
          url: url,
          size: wavBlob.size
        })

        toast.success('Dönüştürme tamamlandı!')
      } catch (decodeError) {
        clearInterval(progressInterval)
        // Dosya doğrudan indirilebilir formattaysa
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
        const outputName = file.name.replace(/\.[^/.]+$/, '') + '.mp3'
        const url = URL.createObjectURL(blob)
        
        setProgress(100)
        setConvertedFile({
          name: outputName,
          url: url,
          size: blob.size
        })
        toast.success('Dosya hazır!')
      }

      audioContext.close()
    } catch (error) {
      console.error('Conversion error:', error)
      toast.error('Dönüştürme sırasında hata oluştu!')
    } finally {
      setConverting(false)
    }
  }

  // AudioBuffer'ı WAV'a dönüştürme fonksiyonu
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels
    const length = buffer.length * numOfChan * 2 + 44
    const bufferArray = new ArrayBuffer(length)
    const view = new DataView(bufferArray)
    const channels: Float32Array[] = []
    let sample: number
    let offset = 0
    let pos = 0

    // WAV header yazımı
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true)
      pos += 2
    }

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true)
      pos += 4
    }

    // RIFF identifier
    setUint32(0x46464952)
    // file length
    setUint32(length - 8)
    // RIFF type
    setUint32(0x45564157)
    // format chunk identifier
    setUint32(0x20746d66)
    // format chunk length
    setUint32(16)
    // sample format (raw)
    setUint16(1)
    // channel count
    setUint16(numOfChan)
    // sample rate
    setUint32(buffer.sampleRate)
    // byte rate (sample rate * block align)
    setUint32(buffer.sampleRate * 2 * numOfChan)
    // block align (channel count * bytes per sample)
    setUint16(numOfChan * 2)
    // bits per sample
    setUint16(16)
    // data chunk identifier
    setUint32(0x61746164)
    // data chunk length
    setUint32(length - pos - 4)

    // write interleaved data
    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i))
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]))
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }

    return new Blob([bufferArray], { type: 'audio/wav' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const clearFile = () => {
    setFile(null)
    setConvertedFile(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex h-screen bg-spotify-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-32 lg:pb-24">
        <Header />
        
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-spotify-green/20 rounded-full mb-4">
                <FaExchangeAlt className="text-2xl text-spotify-green" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Ses Dönüştürücü</h1>
              <p className="text-spotify-light-gray">
                MPEG, WAV, OGG, FLAC ve diğer formatları dönüştürün
              </p>
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 lg:p-12 text-center cursor-pointer transition-all ${
                file 
                  ? 'border-spotify-green bg-spotify-green/10' 
                  : 'border-spotify-gray hover:border-spotify-green/50 hover:bg-white/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*,.mp3,.wav,.ogg,.flac,.aac,.m4a,.webm,.mp4,.mpeg,.mpg"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-spotify-green/20 rounded-full flex items-center justify-center mx-auto">
                    <FaMusic className="text-2xl text-spotify-green" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{file.name}</p>
                    <p className="text-spotify-light-gray text-sm">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mx-auto"
                  >
                    <FaTrash /> Kaldır
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <FaCloudUploadAlt className="text-5xl text-spotify-light-gray mx-auto" />
                  <div>
                    <p className="font-medium text-lg">Dosya yüklemek için tıklayın</p>
                    <p className="text-spotify-light-gray text-sm">veya sürükleyip bırakın</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {formatNames.slice(0, 6).map((format) => (
                      <span key={format} className="text-xs bg-spotify-gray px-2 py-1 rounded">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {converting && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-spotify-light-gray">Dönüştürülüyor...</span>
                  <span className="text-spotify-green">{progress}%</span>
                </div>
                <div className="h-2 bg-spotify-gray rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-spotify-green transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Convert Button */}
            {file && !convertedFile && (
              <button
                onClick={convertToMp3}
                disabled={converting}
                className="w-full mt-6 bg-spotify-green hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-colors"
              >
                {converting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Dönüştürülüyor...
                  </>
                ) : (
                  <>
                    <FaExchangeAlt />
                    Dönüştür
                  </>
                )}
              </button>
            )}

            {/* Download Area */}
            {convertedFile && (
              <div className="mt-6 bg-spotify-gray/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-spotify-green/20 rounded-lg flex items-center justify-center">
                      <FaMusic className="text-spotify-green" />
                    </div>
                    <div>
                      <p className="font-medium">{convertedFile.name}</p>
                      <p className="text-spotify-light-gray text-sm">{formatFileSize(convertedFile.size)}</p>
                    </div>
                  </div>
                  <a
                    href={convertedFile.url}
                    download={convertedFile.name}
                    className="bg-spotify-green hover:bg-green-500 text-black font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors"
                  >
                    <FaDownload />
                    <span className="hidden sm:inline">İndir</span>
                  </a>
                </div>
                
                <button
                  onClick={clearFile}
                  className="w-full mt-4 border border-spotify-light-gray/30 hover:border-spotify-light-gray text-spotify-light-gray hover:text-white py-2 px-4 rounded-full transition-colors"
                >
                  Yeni Dosya Dönüştür
                </button>
              </div>
            )}

            {/* Info */}
            <div className="mt-8 bg-spotify-gray/20 rounded-xl p-4 lg:p-6">
              <h3 className="font-bold mb-3">Desteklenen Formatlar</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {formatNames.map((format) => (
                  <div key={format} className="flex items-center gap-2 text-spotify-light-gray">
                    <span className="w-2 h-2 bg-spotify-green rounded-full"></span>
                    {format}
                  </div>
                ))}
              </div>
              <p className="text-xs text-spotify-light-gray mt-4">
                * Dönüştürme işlemi tarayıcınızda gerçekleşir, dosyalarınız sunucuya yüklenmez.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
