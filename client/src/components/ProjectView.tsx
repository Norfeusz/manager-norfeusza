import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import AllFilesModal from './AllFilesModal'

interface FileInfo {
  name: string
  path: string
  size: number
  extension: string
  createdAt: string
  modifiedAt: string
  isDirectory: boolean
  folderType?: string
}

export default function ProjectView() {
  const { albumId, projectName } = useParams<{ albumId: string; projectName: string }>()
  const navigate = useNavigate()
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null)
  const [showAllFilesModal, setShowAllFilesModal] = useState(false)
  const [allFiles, setAllFiles] = useState<FileInfo[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [editedMetadata, setEditedMetadata] = useState<Record<string, string>>({})
  const [allMetadataKeys, setAllMetadataKeys] = useState<string[]>([])
  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')

  useEffect(() => {
    const checkAlbumCover = async () => {
      if (!albumId) return
      
      try {
        console.log('Checking album cover for:', albumId)
        // Próbujemy załadować okładkę JPG
        const jpgUrl = `http://localhost:4001/api/covers/albums/${encodeURIComponent(albumId)}/cover.jpg`
        const jpgResponse = await fetch(jpgUrl)
        console.log('JPG response status:', jpgResponse.status)
        if (jpgResponse.ok) {
          console.log('Setting album cover URL (JPG):', jpgUrl)
          setAlbumCoverUrl(jpgUrl)
          return
        }
        // Próbujemy JPEG
        const jpegUrl = `http://localhost:4001/api/covers/albums/${encodeURIComponent(albumId)}/cover.jpeg`
        const jpegResponse = await fetch(jpegUrl)
        console.log('JPEG response status:', jpegResponse.status)
        if (jpegResponse.ok) {
          console.log('Setting album cover URL (JPEG):', jpegUrl)
          setAlbumCoverUrl(jpegUrl)
          return
        }
        // Jeśli JPG/JPEG nie istnieje, próbujemy PNG
        const pngUrl = `http://localhost:4001/api/covers/albums/${encodeURIComponent(albumId)}/cover.png`
        const pngResponse = await fetch(pngUrl)
        console.log('PNG response status:', pngResponse.status)
        if (pngResponse.ok) {
          console.log('Setting album cover URL (PNG):', pngUrl)
          setAlbumCoverUrl(pngUrl)
        } else {
          console.log('No album cover found')
        }
      } catch (error) {
        console.error('Error checking album cover:', error)
      }
    }
    checkAlbumCover()
  }, [albumId])

  // Load metadata
  useEffect(() => {
    const loadMetadata = async () => {
      if (!albumId || !projectName) return
      
      try {
        const data = await api.getProjectMetadata(albumId, projectName)
        setMetadata(data)
        setEditedMetadata(data)
        
        const keys = await api.getAllMetadataKeys()
        setAllMetadataKeys(keys)
      } catch (error) {
        console.error('Error loading metadata:', error)
      }
    }
    loadMetadata()
  }, [albumId, projectName])

  const folders = [
    {
      name: 'Projekt FL',
      icon: '🎹',
      color: 'bg-purple-100',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500',
    },
    {
      name: 'Projekt Reaper',
      icon: '🎙️',
      color: 'bg-red-100',
      textColor: 'text-red-600',
      borderColor: 'border-red-500',
    },
    {
      name: 'Tekst',
      icon: '📝',
      color: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
    },
    {
      name: 'Demo bit',
      icon: '🎵',
      color: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500',
    },
    {
      name: 'Demo nawijka',
      icon: '🎤',
      color: 'bg-green-100',
      textColor: 'text-green-600',
      borderColor: 'border-green-500',
    },
    {
      name: 'Demo utwor',
      icon: '🎧',
      color: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-500',
    },
    {
      name: 'Gotowe',
      icon: '✅',
      color: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-500',
    },
    {
      name: 'Pliki',
      icon: '📁',
      color: 'bg-gray-100',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-500',
    },
  ]

  console.log('Current albumCoverUrl:', albumCoverUrl)

  async function loadAllFiles() {
    if (!albumId || !projectName) return
    
    try {
      setLoadingFiles(true)
      const files = await api.getAllProjectFiles(albumId, projectName)
      setAllFiles(files)
      setShowAllFilesModal(true)
    } catch (error: any) {
      alert(`Błąd: ${error.message}`)
    } finally {
      setLoadingFiles(false)
    }
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden">
        {/* Tło z okładką albumu */}
        {albumCoverUrl ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${albumCoverUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(10px)',
                transform: 'scale(1.1)',
                zIndex: 0,
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-60" style={{ zIndex: 1 }} />
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-100" style={{ zIndex: 0 }} />
        )}
        
        {/* Zawartość strony */}
        <div className="relative p-8" style={{ zIndex: 10 }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => navigate(`/album/${albumId}`)}
                className="text-white hover:text-gray-200 font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-lg transition"
              >
                ← Powrót do albumu
              </button>
              <button
                onClick={loadAllFiles}
                disabled={loadingFiles}
                className="text-white hover:text-gray-200 font-semibold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {loadingFiles ? 'Ładowanie...' : '📋 Pokaż wszystkie pliki'}
              </button>
            </div>

            <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-8">
              {projectName}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folders.map((folder) => (
                <Link
                  key={folder.name}
                  to={`/folder/${albumId}/${projectName}/${encodeURIComponent(folder.name)}`}
                  className="block bg-transparent hover:bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-8 border-2 border-blue-500"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="text-6xl mb-4 drop-shadow-lg">{folder.icon}</div>
                    <h3 className="text-xl font-bold text-blue-600 drop-shadow-md">
                      {folder.name}
                    </h3>
                    <p className="text-sm text-blue-600 drop-shadow-md mt-2">
                      Kliknij aby otworzyć
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Informacje</h2>
                {!isEditingMetadata ? (
                  <button
                    onClick={() => {
                      setIsEditingMetadata(true)
                      setEditedMetadata({...metadata})
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Edytuj
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const updated = await api.updateProjectMetadata(albumId!, projectName!, editedMetadata)
                          setMetadata(updated)
                          setEditedMetadata(updated)
                          setIsEditingMetadata(false)
                        } catch (error: any) {
                          alert(`Błąd: ${error.message}`)
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Zapisz
                    </button>
                    <button
                      onClick={() => {
                        setEditedMetadata({...metadata})
                        setIsEditingMetadata(false)
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      Anuluj
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {Object.entries(isEditingMetadata ? editedMetadata : metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="w-32 font-semibold text-gray-700">{key}:</label>
                    {isEditingMetadata ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setEditedMetadata({
                            ...editedMetadata,
                            [key]: e.target.value
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => {
                            const newMetadata = {...editedMetadata}
                            delete newMetadata[key]
                            setEditedMetadata(newMetadata)
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                          Usuń
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-600">{value}</span>
                    )}
                  </div>
                ))}
              </div>

              {isEditingMetadata && (
                <button
                  onClick={() => setShowAddFieldModal(true)}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  + Dodaj pole
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal wszystkich plików */}
      <AllFilesModal
        show={showAllFilesModal}
        onClose={() => setShowAllFilesModal(false)}
        files={allFiles}
        title={`Wszystkie pliki w projekcie "${projectName}"`}
        level="project"
      />

      {/* Modal dodawania pola */}
      {showAddFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Dodaj pole</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wybierz istniejące pole lub wpisz nowe
              </label>
              <select
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              >
                <option value="">-- Wybierz lub wpisz --</option>
                {allMetadataKeys
                  .filter(key => !Object.keys(editedMetadata).includes(key))
                  .map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))
                }
                <option value="__custom__">✏️ Nowe pole...</option>
              </select>
              
              {newFieldName === '__custom__' && (
                <input
                  type="text"
                  value=""
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Nazwa nowego pola"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddFieldModal(false)
                  setNewFieldName('')
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  if (newFieldName && newFieldName !== '__custom__') {
                    setEditedMetadata({
                      ...editedMetadata,
                      [newFieldName]: ''
                    })
                    setShowAddFieldModal(false)
                    setNewFieldName('')
                  }
                }}
                disabled={!newFieldName || newFieldName === '__custom__'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

