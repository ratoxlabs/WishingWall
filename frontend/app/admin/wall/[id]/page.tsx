'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

interface Wall {
  id: number
  title: string
  description: string | null
  unique_url: string
  passcode: string
  is_public: boolean
}

interface Contributor {
  id: number
  email: string
  is_active: boolean
  invited_at: string
  accepted_at: string | null
}

export default function AdminWallPage() {
  const router = useRouter()
  const params = useParams()
  const wallId = params?.id as string
  const { isAuthenticated } = useAuthStore()
  const [wall, setWall] = useState<Wall | null>(null)
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchWall()
    fetchContributors()
  }, [isAuthenticated, router, wallId])

  const fetchWall = async () => {
    try {
      const response = await api.get(`/api/v1/walls/${wallId}`)
      setWall(response.data)
      setIsPublic(response.data.is_public)
    } catch (error) {
      console.error('Failed to fetch wall:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchContributors = async () => {
    try {
      const response = await api.get(`/api/v1/contributors/wall/${wallId}`)
      setContributors(response.data)
    } catch (error) {
      console.error('Failed to fetch contributors:', error)
    }
  }

  const handleInviteContributor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/v1/contributors/invite', {
        email: inviteEmail,
        wall_id: parseInt(wallId),
      })
      setInviteEmail('')
      setShowInviteModal(false)
      fetchContributors()
      alert('Invite sent successfully!')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to send invite')
    }
  }

  const handleRemoveContributor = async (contributorId: number) => {
    if (!confirm('Are you sure you want to remove this contributor?')) return
    try {
      await api.delete(`/api/v1/contributors/${contributorId}`)
      fetchContributors()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to remove contributor')
    }
  }

  const handleTogglePublic = async () => {
    try {
      const response = await api.put(`/api/v1/walls/${wallId}`, {
        is_public: !isPublic,
      })
      setWall(response.data)
      setIsPublic(response.data.is_public)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update wall')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!wall) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-primary-700">{wall.title}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Wall Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unique URL
              </label>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1">
                  {wall.unique_url}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/wall/${wall.unique_url}`)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Copy URL
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passcode
              </label>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1">
                  {wall.passcode}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(wall.passcode)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Copy Passcode
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Share Link for Contributors
              </label>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 px-3 py-2 rounded flex-1 truncate">
                  {`${window.location.origin}/contribute?url=${wall.unique_url}&passcode=${wall.passcode}`}
                </code>
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/contribute?url=${wall.unique_url}&passcode=${wall.passcode}`
                    navigator.clipboard.writeText(shareUrl)
                    alert('Share link copied! Contributors can use this link to add content directly.')
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 whitespace-nowrap"
                >
                  Copy Share Link
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this link with contributors. They can add content directly without email invites.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Visibility:</span>
              <span className={`px-3 py-1 rounded text-sm ${
                isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isPublic ? 'Public' : 'Private'}
              </span>
              <button
                onClick={handleTogglePublic}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
              >
                {isPublic ? 'Make Private' : 'Make Public'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Contributors</h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Invite Contributor
            </button>
          </div>

          {contributors.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No contributors yet. Invite someone to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contributors.map((contributor) => (
                    <tr key={contributor.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contributor.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          contributor.accepted_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {contributor.accepted_at ? 'Accepted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(contributor.invited_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveContributor(contributor.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Invite Contributor</h2>
            <form onSubmit={handleInviteContributor}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="contributor@example.com"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

