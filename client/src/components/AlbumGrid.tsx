import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Album } from '../../../shared/src/types'
import { api } from '../services/api'

export default function AlbumGrid() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadAlbums()
  }, [])

  async function loadAlbums() {
    try {
      setLoading(true)
      const data = await api.getAlbums()
      setAlbums(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAlbum() {
    if (!newAlbumName.trim()) return

    try {
      setCreating(true)
      await api.createAlbum({ name: newAlbumName.trim() })
      setNewAlbumName('')
      setShowCreateModal(false)
      loadAlbums()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Ładowanie albumów...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Błąd: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Manager Norfa</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/sortownia')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              📦 Sortownia
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              + Nowy Album
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => navigate(`/album/${album.id}`)}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition cursor-pointer p-6 border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
                {album.name}
              </h2>
              <p className="text-center text-gray-600 text-sm">
                {album.projectCount || 0} {album.projectCount === 1 ? 'projekt' : 'projektów'}
              </p>
            </div>
          ))}
        </div>

        {albums.length === 0 && (
          <div className="text-center text-gray-600 mt-12">
            <p className="text-xl">Brak albumów</p>
            <p className="mt-2">Utwórz pierwszy album, aby rozpocząć</p>
          </div>
        )}
      </div>

      {/* Modal tworzenia albumu */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Nowy Album</h2>
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateAlbum()}
              placeholder="Nazwa albumu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreateAlbum}
                disabled={creating || !newAlbumName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {creating ? 'Tworzenie...' : 'Utwórz'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewAlbumName('')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
