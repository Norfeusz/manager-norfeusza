import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Album } from '../../../shared/src/types'
import { api } from '../services/api'
import AllFilesModal from './AllFilesModal'

export default function AlbumGrid() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [creating, setCreating] = useState(false)
  const [organizingMode, setOrganizingMode] = useState(false)
  const [draggedAlbum, setDraggedAlbum] = useState<Album | null>(null)
  const [dragOverSection, setDragOverSection] = useState<'gotowe' | 'rzezbione' | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [mainCoverUrl, setMainCoverUrl] = useState<string | null>(null)
  const [showAllFilesModal, setShowAllFilesModal] = useState(false)
  const [allFiles, setAllFiles] = useState<any[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const navigate = useNavigate()

  // Filtrowanie albumów
  const gotoweAlbums = albums.filter(album => album.category === 'gotowe')
  const rzezbAlbums = albums.filter(album => album.category !== 'gotowe')

  // Foldery plików
  const fileFolders = [
    { name: 'Bity', icon: '🎵', path: '/pliki/bity' },
    { name: 'Teksty', icon: '📝', path: '/pliki/teksty' },
    { name: 'Pliki', icon: '📁', path: '/pliki/inne' },
    { name: 'Sortownia', icon: '📦', path: '/sortownia' }
  ]

  useEffect(() => {
    loadAlbums()
    loadMainCover()
  }, [])

  async function loadMainCover() {
    try {
      const response = await fetch('/api/files/main-cover')
      if (response.ok) {
        const blob = await response.blob()
        setMainCoverUrl(URL.createObjectURL(blob))
      }
    } catch (err) {
      console.log('Brak głównej okładki')
    }
  }

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

  async function loadAllFiles() {
    try {
      setLoadingFiles(true)
      const files = await api.getAllFiles()
      setAllFiles(files)
      setShowAllFilesModal(true)
    } catch (error: any) {
      alert(`Błąd: ${error.message}`)
    } finally {
      setLoadingFiles(false)
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

  async function handleSaveOrganization() {
    try {
      // Zapisz zmiany kategorii dla wszystkich albumów
      await Promise.all(
        albums.map((album) =>
          api.updateAlbumCategory(album.id, album.category || 'rzezbione')
        )
      )
      setOrganizingMode(false)
      loadAlbums()
    } catch (err: any) {
      alert(`Błąd zapisu: ${err.message}`)
    }
  }

  function handleDragStart(album: Album, e: React.DragEvent) {
    if (!organizingMode) return
    setDraggedAlbum(album)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, section: 'gotowe' | 'rzezbione', index?: number) {
    if (!organizingMode || !draggedAlbum) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSection(section)
    if (index !== undefined) {
      setDragOverIndex(index)
    }
  }

  function handleDrop(e: React.DragEvent, targetSection: 'gotowe' | 'rzezbione', targetIndex?: number) {
    if (!organizingMode || !draggedAlbum) return
    e.preventDefault()
    
    setAlbums(prevAlbums => {
      const updatedAlbums = [...prevAlbums]
      const draggedIndex = updatedAlbums.findIndex(a => a.id === draggedAlbum.id)
      
      if (draggedIndex === -1) return prevAlbums
      
      // Usuń album z obecnej pozycji
      const [removed] = updatedAlbums.splice(draggedIndex, 1)
      
      // Zaktualizuj kategorię
      removed.category = targetSection
      
      // Znajdź albumy w docelowej sekcji
      const sectionAlbums = updatedAlbums.filter(a => 
        (a.category || 'rzezbione') === targetSection
      )
      
      // Oblicz pozycję wstawienia
      let insertIndex = targetIndex !== undefined ? targetIndex : sectionAlbums.length
      
      // Znajdź rzeczywisty indeks w całej tablicy
      if (insertIndex < sectionAlbums.length) {
        const targetAlbum = sectionAlbums[insertIndex]
        insertIndex = updatedAlbums.findIndex(a => a.id === targetAlbum.id)
      } else {
        // Wstaw na końcu sekcji
        const lastInSection = sectionAlbums[sectionAlbums.length - 1]
        if (lastInSection) {
          insertIndex = updatedAlbums.findIndex(a => a.id === lastInSection.id) + 1
        } else {
          // Pusta sekcja - wstaw na początku odpowiedniej sekcji
          insertIndex = targetSection === 'gotowe' ? 0 : updatedAlbums.length
        }
      }
      
      // Wstaw album w nowej pozycji
      updatedAlbums.splice(insertIndex, 0, removed)
      
      return updatedAlbums
    })
    
    setDraggedAlbum(null)
    setDragOverSection(null)
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    setDraggedAlbum(null)
    setDragOverSection(null)
    setDragOverIndex(null)
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
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Tło - główna okładka */}
      {mainCoverUrl && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${mainCoverUrl})`,
              filter: 'blur(10px)',
              transform: 'scale(1.1)'
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-60" />
        </>
      )}
      
      <div className="relative z-10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <img 
            src="http://localhost:4001/api/files/logo" 
            alt="Manager Norfa" 
            className="h-16 drop-shadow-lg"
          />
          <div className="flex gap-3">
            {organizingMode ? (
              <>
                <button
                  onClick={handleSaveOrganization}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  ✓ Zapisz
                </button>
                <button
                  onClick={() => {
                    setOrganizingMode(false)
                    loadAlbums()
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  ✗ Anuluj
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={loadAllFiles}
                  disabled={loadingFiles}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loadingFiles ? 'Ładowanie...' : '📋 Wszystkie pliki'}
                </button>
                <button
                  onClick={() => setOrganizingMode(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  🔄 Organizuj
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  + Nowy Album
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sekcja: Gotowe */}
        <div
          className="mb-12"
          onDragOver={(e) => handleDragOver(e, 'gotowe')}
          onDrop={(e) => handleDrop(e, 'gotowe')}
        >
          <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-6 flex items-center gap-3">
            <span>Gotowe</span>
          </h2>
          {gotoweAlbums.length > 0 ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 rounded-lg transition ${dragOverSection === 'gotowe' ? 'bg-green-100 border-2 border-green-500' : ''}`}>
              {gotoweAlbums.map((album, index) => (
                <div
                  key={album.id}
                  draggable={organizingMode}
                  onDragStart={(e) => handleDragStart(album, e)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, 'gotowe', index)}
                  onDrop={(e) => handleDrop(e, 'gotowe', index)}
                  onClick={() => !organizingMode && navigate(`/album/${album.id}`)}
                  className={`bg-transparent hover:bg-white rounded-lg shadow-md hover:shadow-xl transition p-6 border-2 ${
                    dragOverIndex === index && dragOverSection === 'gotowe' && draggedAlbum?.id !== album.id
                      ? 'border-green-500 border-l-4'
                      : 'border-blue-500 hover:border-blue-500'
                  } ${
                    organizingMode ? 'cursor-move' : 'cursor-pointer'
                  } ${draggedAlbum?.id === album.id ? 'opacity-50' : ''}`}
                >
                  <div className="relative aspect-square bg-blue-50 rounded-lg overflow-hidden mb-4">
                    {album.coverImage ? (
                      <img 
                        src={album.coverImage} 
                        alt={album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-20 h-20 text-blue-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                          />
                        </svg>
                      </div>
                    )}
                    
                    {!organizingMode && (
                      <label 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-lg shadow-md cursor-pointer opacity-0 hover:opacity-100 transition"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              try {
                                await api.uploadAlbumCover(album.id, file)
                                loadAlbums()
                              } catch (err: any) {
                                alert(`Błąd: ${err.message}`)
                              }
                            }
                          }}
                        />
                      </label>
                    )}
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
          ) : (
            <div className="text-center text-gray-500 py-8 bg-white rounded-lg">
              Brak gotowych albumów
            </div>
          )}
        </div>

        {/* Sekcja: Rzeźbione */}
        <div
          className="mb-12"
          onDragOver={(e) => handleDragOver(e, 'rzezbione')}
          onDrop={(e) => handleDrop(e, 'rzezbione')}
        >
          <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-6 flex items-center gap-3">
            <span>Rzeźbione</span>
          </h2>
          {rzezbAlbums.length > 0 ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 rounded-lg transition ${dragOverSection === 'rzezbione' ? 'bg-purple-100 border-2 border-purple-500' : ''}`}>
              {rzezbAlbums.map((album, index) => (
                <div
                  key={album.id}
                  draggable={organizingMode}
                  onDragStart={(e) => handleDragStart(album, e)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, 'rzezbione', index)}
                  onDrop={(e) => handleDrop(e, 'rzezbione', index)}
                  onClick={() => !organizingMode && navigate(`/album/${album.id}`)}
                  className={`bg-transparent hover:bg-white rounded-lg shadow-md hover:shadow-xl transition p-6 border-2 ${
                    dragOverIndex === index && dragOverSection === 'rzezbione' && draggedAlbum?.id !== album.id
                      ? 'border-purple-500 border-l-4'
                      : 'border-blue-500 hover:border-blue-500'
                  } ${
                    organizingMode ? 'cursor-move' : 'cursor-pointer'
                  } ${draggedAlbum?.id === album.id ? 'opacity-50' : ''}`}
                >
                  <div className="relative aspect-square bg-blue-50 rounded-lg overflow-hidden mb-4">
                    {album.coverImage ? (
                      <img 
                        src={album.coverImage} 
                        alt={album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-20 h-20 text-blue-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                          />
                        </svg>
                      </div>
                    )}
                    
                    {!organizingMode && (
                      <label 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-lg shadow-md cursor-pointer opacity-0 hover:opacity-100 transition"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              try {
                                await api.uploadAlbumCover(album.id, file)
                                loadAlbums()
                              } catch (err: any) {
                                alert(`Błąd: ${err.message}`)
                              }
                            }
                          }}
                        />
                      </label>
                    )}
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
          ) : (
            <div className="text-center text-gray-500 py-8 bg-white rounded-lg">
              Brak albumów w trakcie pracy
            </div>
          )}
        </div>

        {/* Sekcja: Pliki */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-6 flex items-center gap-3">
            <span>Pliki</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {fileFolders.map(folder => (
              <div
                key={folder.path}
                onClick={() => navigate(folder.path)}
                className="bg-transparent hover:bg-white rounded-lg shadow-md hover:shadow-xl transition border-2 border-blue-500 hover:border-blue-500 overflow-hidden cursor-pointer p-8"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">{folder.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800">{folder.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
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

      {/* Modal wszystkich plików */}
      <AllFilesModal
        show={showAllFilesModal}
        onClose={() => setShowAllFilesModal(false)}
        files={allFiles}
        title="Wszystkie pliki w systemie"
        level="all"
      />
      </div>
    </div>
  )
}
