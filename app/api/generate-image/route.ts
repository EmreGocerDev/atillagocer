import { NextRequest, NextResponse } from 'next/server'

// HF_TOKEN environment variable'dan alınır - .env.local dosyasında tanımlı olmalı
const HF_TOKEN = process.env.HF_TOKEN

export async function POST(request: NextRequest) {
  try {
    // HF_TOKEN kontrolü
    if (!HF_TOKEN) {
      return NextResponse.json({ 
        error: 'AI görsel oluşturma servisi yapılandırılmamış. HF_TOKEN environment variable tanımlı değil.' 
      }, { status: 500 })
    }

    const { prompt, style } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt gerekli' }, { status: 400 })
    }

    // Stil bazlı prompt zenginleştirme
    let enhancedPrompt = prompt
    
    const stylePrompts: Record<string, string> = {
      'album-cover': `${prompt}, album cover art style, professional music artwork, high quality, 4k, detailed`,
      'rock': `${prompt}, rock music aesthetic, electric guitar, dark atmosphere, concert vibes, dramatic lighting`,
      'pop': `${prompt}, pop music style, vibrant colors, modern design, catchy visual, bright and energetic`,
      'jazz': `${prompt}, jazz music atmosphere, saxophone, smoky club, vintage feel, warm tones, sophisticated`,
      'classical': `${prompt}, classical music inspired, orchestra, elegant, timeless, artistic, refined`,
      'electronic': `${prompt}, electronic music visual, neon lights, futuristic, digital art, synthwave`,
      'folk': `${prompt}, folk music aesthetic, acoustic guitar, nature, warm earthy tones, rustic`,
      'hiphop': `${prompt}, hip hop style, urban, street art influence, bold typography, graffiti elements`,
      'blues': `${prompt}, blues music mood, emotional, soulful, vintage, deep colors, melancholic`,
      'turkish': `${prompt}, Turkish music inspired, cultural elements, bağlama saz, traditional motifs, Anatolian`,
      'custom': prompt, // Özel mod - prompt olduğu gibi kullanılır
    }

    enhancedPrompt = stylePrompts[style] || `${prompt}, professional quality, realistic, detailed`

    // Hugging Face Inference API - Stable Diffusion kullanarak
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: 'blurry, bad quality, distorted, ugly, deformed, low resolution, text, watermark',
            num_inference_steps: 30,
            guidance_scale: 7.5,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('HuggingFace API Error:', errorText)
      
      // Model yükleniyor olabilir
      if (response.status === 503) {
        return NextResponse.json({ 
          error: 'Model yükleniyor, lütfen 20-30 saniye bekleyin ve tekrar deneyin.',
          loading: true 
        }, { status: 503 })
      }
      
      return NextResponse.json({ 
        error: 'Görsel oluşturulamadı: ' + errorText 
      }, { status: response.status })
    }

    // Görsel blob olarak geliyor
    const imageBlob = await response.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const imageUrl = `data:image/png;base64,${base64}`

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      prompt: enhancedPrompt 
    })

  } catch (error) {
    console.error('AI Image Generation Error:', error)
    return NextResponse.json({ 
      error: 'Bir hata oluştu: ' + (error as Error).message 
    }, { status: 500 })
  }
}
