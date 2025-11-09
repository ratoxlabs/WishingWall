'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'

// Image Carousel Component
function ImageCarousel({ images, alt, apiUrl }: { images: string[]; alt: string; apiUrl: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="relative">
      <img
        src={`${apiUrl}${images[currentIndex]}`}
        alt={`${alt} ${currentIndex + 1}`}
        className="w-full h-auto rounded-md mb-2"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition"
            aria-label="Previous image"
          >
            ←
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition"
            aria-label="Next image"
          >
            →
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}

// Truncated Text Component
function TruncatedText({ text, maxLength = 200 }: { text: string; maxLength?: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : text.substring(0, maxLength) + '...'

  if (!shouldTruncate) {
    return <p className="text-gray-800 whitespace-pre-wrap">{text}</p>
  }

  return (
    <div>
      <p className="text-gray-800 whitespace-pre-wrap">{displayText}</p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-primary-600 hover:text-primary-700 text-sm mt-1 font-medium"
      >
        {isExpanded ? 'Read Less' : 'Read More...'}
      </button>
    </div>
  )
}

interface Content {
  id: number
  content_type: 'text' | 'image' | 'text_image' | 'images' | 'images_text'
  text: string | null
  image_url: string | null
  image_urls: string[] | null
  author_name: string | null
  created_at: string
}

interface Wall {
  id: number
  title: string
  description: string | null
  unique_url: string
  is_public: boolean
  contents: Content[]
}

// Helper function to get API URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
    if (window.location.hostname === 'wishingwall.app' || window.location.hostname === 'www.wishingwall.app') {
      return 'https://api.wishingwall.app'
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export default function WallPage() {
  const params = useParams()
  const router = useRouter()
  const url = params?.url as string
  const [wall, setWall] = useState<Wall | null>(null)
  const [loading, setLoading] = useState(true)
  const [passcode, setPasscode] = useState('')
  const [showPasscodeModal, setShowPasscodeModal] = useState(true)
  const [error, setError] = useState('')
  const apiUrl = getApiUrl()

  useEffect(() => {
    const savedPasscode = localStorage.getItem(`wall_passcode_${url}`)
    if (savedPasscode) {
      setPasscode(savedPasscode)
      setShowPasscodeModal(false)
      fetchWall(savedPasscode)
    }
  }, [url])

  const fetchWall = async (code: string) => {
    try {
      const response = await api.get(`/api/v1/walls/public/${url}`, {
        params: { passcode: code },
      })
      setWall(response.data)
      localStorage.setItem(`wall_passcode_${url}`, code)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load wall')
      setShowPasscodeModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    fetchWall(passcode)
  }

  if (loading && !wall) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Enter Passcode</h2>
            <form onSubmit={handlePasscodeSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passcode
                </label>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
              >
                View Wall
              </button>
            </form>
          </div>
        </div>
      )}

      {wall && (
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-700 mb-2">{wall.title}</h1>
            {wall.description && (
              <p className="text-gray-600 text-lg">{wall.description}</p>
            )}
          </div>

          {wall.contents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg">No contributions yet. Be the first to add your wishes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wall.contents.map((content) => (
                <div
                  key={content.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {content.content_type === 'text' && (
                    <div>
                      <p className="text-gray-800 whitespace-pre-wrap mb-4">{content.text}</p>
                      {content.author_name && (
                        <p className="text-sm text-gray-500 italic">— {content.author_name}</p>
                      )}
                    </div>
                  )}

                  {content.content_type === 'image' && content.image_url && (
                    <div>
                      <img
                        src={`${apiUrl}${content.image_url}`}
                        alt="Contribution"
                        className="w-full h-auto rounded-md mb-4"
                      />
                      {content.author_name && (
                        <p className="text-sm text-gray-500 italic">— {content.author_name}</p>
                      )}
                    </div>
                  )}

                  {content.content_type === 'text_image' && (
                    <div>
                      {content.image_url && (
                        <img
                          src={`${apiUrl}${content.image_url}`}
                          alt="Contribution"
                          className="w-full h-auto rounded-md mb-4"
                        />
                      )}
                      {content.text && (
                        <p className="text-gray-800 whitespace-pre-wrap mb-4">{content.text}</p>
                      )}
                      {content.author_name && (
                        <p className="text-sm text-gray-500 italic">— {content.author_name}</p>
                      )}
                    </div>
                  )}

                  {content.content_type === 'images' && content.image_urls && content.image_urls.length > 0 && (
                    <div>
                      <ImageCarousel images={content.image_urls} alt="Contribution" apiUrl={apiUrl} />
                      {content.author_name && (
                        <p className="text-sm text-gray-500 italic mt-2">— {content.author_name}</p>
                      )}
                    </div>
                  )}

                  {content.content_type === 'images_text' && content.image_urls && content.image_urls.length > 0 && (
                    <div>
                      <ImageCarousel images={content.image_urls} alt="Contribution" apiUrl={apiUrl} />
                      {content.text && (
                        <div className="mt-4">
                          <TruncatedText text={content.text} maxLength={200} />
                        </div>
                      )}
                      {content.author_name && (
                        <p className="text-sm text-gray-500 italic mt-2">— {content.author_name}</p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-4">
                    {new Date(content.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

