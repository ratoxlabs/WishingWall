'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

interface Wall {
  id: number
  title: string
  description: string | null
  unique_url: string
  passcode: string
  is_public: boolean
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const [walls, setWalls] = useState<Wall[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWallTitle, setNewWallTitle] = useState('')
  const [newWallDescription, setNewWallDescription] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchWalls()
  }, [isAuthenticated, router])

  const fetchWalls = async () => {
    try {
      const response = await api.get('/api/v1/walls')
      setWalls(response.data)
    } catch (error) {
      console.error('Failed to fetch walls:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWall = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post('/api/v1/walls', {
        title: newWallTitle,
        description: newWallDescription || null,
      })
      setWalls([...walls, response.data])
      setShowCreateModal(false)
      setNewWallTitle('')
      setNewWallDescription('')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create wall')
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-700">WishingWall Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.full_name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Your Walls</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
          >
            Create New Wall
          </button>
        </div>

        {walls.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't created any walls yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
            >
              Create Your First Wall
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {walls.map((wall) => (
              <div key={wall.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{wall.title}</h3>
                {wall.description && (
                  <p className="text-gray-600 mb-4">{wall.description}</p>
                )}
                <div className="space-y-2 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">URL:</label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                        {wall.unique_url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/wall/${wall.unique_url}`)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Passcode:</label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                        {wall.passcode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(wall.passcode)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      wall.is_public ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {wall.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/wall/${wall.id}`)}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/contribute?url=${wall.unique_url}&passcode=${wall.passcode}`
                      navigator.clipboard.writeText(shareUrl)
                      alert('Share link copied to clipboard!')
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                    title="Copy share link for contributors"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => router.push(`/wall/${wall.unique_url}`)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Create New Wall</h2>
            <form onSubmit={handleCreateWall}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newWallTitle}
                  onChange={(e) => setNewWallTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Birthday Wishes for John"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newWallDescription}
                  onChange={(e) => setNewWallDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewWallTitle('')
                    setNewWallDescription('')
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

