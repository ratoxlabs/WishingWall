'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import api from '@/lib/api'

interface Contributor {
  id: number
  email: string
  wall_id: number
}

interface Wall {
  id: number
  title: string
  description: string | null
}

export default function ContributePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const wallUrl = searchParams.get('url')
  const passcode = searchParams.get('passcode')
  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [wall, setWall] = useState<Wall | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasscodeForm, setShowPasscodeForm] = useState(false)
  const [inputPasscode, setInputPasscode] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [contributorEmail, setContributorEmail] = useState('')
  const [contentType, setContentType] = useState<'text' | 'image' | 'text_image' | 'images' | 'images_text'>('text')
  const [text, setText] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Method 1: Using invite token
    if (token) {
      verifyToken()
    }
    // Method 2: Using URL + passcode from query params
    else if (wallUrl && passcode) {
      verifyWallAccess(wallUrl, passcode)
    }
    // Method 3: Show form to enter URL + passcode
    else {
      setShowPasscodeForm(true)
      setLoading(false)
    }
  }, [token, wallUrl, passcode])

  const verifyToken = async () => {
    try {
      const response = await api.get(`/api/v1/contributors/verify/${token}`)
      setContributor(response.data)
      // Fetch wall details
      const wallResponse = await api.get(`/api/v1/walls/${response.data.wall_id}`)
      setWall(wallResponse.data)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Invalid invite token')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const verifyWallAccess = async (url: string, code: string) => {
    try {
      const response = await api.get(`/api/v1/walls/verify/${url}`, {
        params: { passcode: code }
      })
      setWall(response.data)
      // For direct access, we don't have a contributor yet - it will be created on submit
      setContributor({ id: 0, email: '', wall_id: response.data.id } as Contributor)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Invalid wall URL or passcode')
      setShowPasscodeForm(true)
    } finally {
      setLoading(false)
    }
  }

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUrl || !inputPasscode) {
      alert('Please enter both wall URL and passcode')
      return
    }
    verifyWallAccess(inputUrl, inputPasscode)
  }

  const onDropSingle = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onDropMultiple = (acceptedFiles: File[]) => {
    const newFiles = [...images, ...acceptedFiles].slice(0, 20) // Max 20 images
    setImages(newFiles)
    const newPreviews: string[] = []
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === newFiles.length) {
          setImagePreviews(newPreviews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const { getRootProps: getRootPropsSingle, getInputProps: getInputPropsSingle, isDragActive: isDragActiveSingle } = useDropzone({
    onDrop: onDropSingle,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
  })

  const { getRootProps: getRootPropsMultiple, getInputProps: getInputPropsMultiple, isDragActive: isDragActiveMultiple } = useDropzone({
    onDrop: onDropMultiple,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wall) return
    
    // For direct access, require author name
    if (!token && !authorName.trim()) {
      alert('Please enter your name')
      return
    }

    // Validate based on content type
    if (contentType === 'text' && !text.trim()) {
      alert('Please enter some text')
      return
    }
    if (contentType === 'image' && !image) {
      alert('Please select an image')
      return
    }
    if (contentType === 'text_image' && (!text.trim() || !image)) {
      alert('Please enter text and select an image')
      return
    }
    if ((contentType === 'images' || contentType === 'images_text') && images.length === 0) {
      alert('Please select at least one image')
      return
    }
    if (contentType === 'images_text' && !text.trim()) {
      alert('Please enter text')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('wall_id', wall.id.toString())
      formData.append('content_type', contentType)
      if (text.trim()) formData.append('text', text)
      
      // Handle single image
      if (contentType === 'image' || contentType === 'text_image') {
        if (image) formData.append('image', image)
      }
      
      // Handle multiple images
      if (contentType === 'images' || contentType === 'images_text') {
        images.forEach((img) => {
          formData.append('images', img)
        })
      }
      
      if (authorName.trim()) formData.append('author_name', authorName)
      
      // Authentication: either token OR URL + passcode
      if (token) {
        formData.append('invite_token', token)
      } else if (wallUrl || inputUrl) {
        formData.append('wall_url', wallUrl || inputUrl)
        formData.append('wall_passcode', passcode || inputPasscode)
        if (contributorEmail.trim()) {
          formData.append('contributor_email', contributorEmail)
        }
      }

      await api.post('/api/v1/content', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      alert('Your contribution has been posted successfully!')
      // Reset form
      setText('')
      setAuthorName('')
      setImage(null)
      setImagePreview(null)
      setImages([])
      setImagePreviews([])
      setContentType('text')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to post content')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Show passcode form if no token and no wall verified
  if (showPasscodeForm && !wall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-primary-700">Access Wall</h1>
            <p className="text-center text-gray-600 mb-8">Enter the wall URL and passcode to contribute</p>
            
            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wall URL *
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter wall URL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passcode *
                </label>
                <input
                  type="text"
                  value={inputPasscode}
                  onChange={(e) => setInputPasscode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (!wall) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-primary-700">Add Your Wishes</h1>
          <p className="text-center text-gray-600 mb-8">Wall: {wall.title}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="text"
                    checked={contentType === 'text'}
                    onChange={(e) => {
                      setContentType(e.target.value as any)
                      setImage(null)
                      setImagePreview(null)
                      setImages([])
                      setImagePreviews([])
                    }}
                    className="mr-2"
                  />
                  Text Only
                </label>
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="image"
                    checked={contentType === 'image'}
                    onChange={(e) => {
                      setContentType(e.target.value as any)
                      setImages([])
                      setImagePreviews([])
                    }}
                    className="mr-2"
                  />
                  Image Only
                </label>
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="text_image"
                    checked={contentType === 'text_image'}
                    onChange={(e) => {
                      setContentType(e.target.value as any)
                      setImages([])
                      setImagePreviews([])
                    }}
                    className="mr-2"
                  />
                  Text + Image
                </label>
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="images"
                    checked={contentType === 'images'}
                    onChange={(e) => {
                      setContentType(e.target.value as any)
                      setImage(null)
                      setImagePreview(null)
                    }}
                    className="mr-2"
                  />
                  Images
                </label>
                <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="images_text"
                    checked={contentType === 'images_text'}
                    onChange={(e) => {
                      setContentType(e.target.value as any)
                      setImage(null)
                      setImagePreview(null)
                    }}
                    className="mr-2"
                  />
                  Images + Text
                </label>
              </div>
            </div>

            {(contentType === 'text' || contentType === 'text_image' || contentType === 'images_text') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required={contentType === 'text' || contentType === 'text_image'}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Write your wishes, greetings, or message here..."
                />
              </div>
            )}

            {(contentType === 'image' || contentType === 'text_image') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image *
                </label>
                {imagePreview ? (
                  <div className="mb-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-64 object-contain rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setImagePreview(null)
                      }}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div
                    {...getRootPropsSingle()}
                    className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${
                      isDragActiveSingle ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                    }`}
                  >
                    <input {...getInputPropsSingle()} />
                    <p className="text-gray-600">
                      {isDragActiveSingle ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(contentType === 'images' || contentType === 'images_text') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images * (Up to 20 images)
                </label>
                {imagePreviews.length > 0 ? (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = images.filter((_, i) => i !== index)
                              const newPreviews = imagePreviews.filter((_, i) => i !== index)
                              setImages(newImages)
                              setImagePreviews(newPreviews)
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {images.length < 20 && (
                      <div
                        {...getRootPropsMultiple()}
                        className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
                          isDragActiveMultiple ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                        }`}
                      >
                        <input {...getInputPropsMultiple()} />
                        <p className="text-gray-600 text-sm">
                          {isDragActiveMultiple ? 'Drop images here' : `Add more images (${images.length}/20)`}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    {...getRootPropsMultiple()}
                    className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${
                      isDragActiveMultiple ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                    }`}
                  >
                    <input {...getInputPropsMultiple()} />
                    <p className="text-gray-600">
                      {isDragActiveMultiple ? 'Drop images here' : 'Drag & drop images, or click to select (up to 20)'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name {!token ? '*' : '(Optional)'}
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required={!token}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={token ? "Leave blank to use your email" : "Enter your name"}
              />
            </div>

            {!token && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email (Optional)
                </label>
                <input
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="your@email.com (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">Email helps us identify your contributions</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 font-semibold"
            >
              {submitting ? 'Posting...' : 'Post to Wall'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

