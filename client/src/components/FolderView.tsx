import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

interface FileInfo {
  name: string
  path: string
  size: number
  extension: string
  createdAt: string
  modifiedAt: string
  isDirectory: boolean
}

export default function FolderView() {
  const { albumId, projectName, folderType } = useParams<{
    albumId: string
    projectName: string
    folderType: string
  }>()
  const navigate = useNavigate()
  const [files, setFiles] = useState<FileInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null)
  const [arranging, setArranging] = useState(false)

  useEffect(() => {
    if (albumId && projectName && folderType) {
      loadFiles()
    }
  }, [albumId, projectName, folderType])

  useEffect(() => {
    const checkAlbumCover = async () => {
      if (!albumId) return
      
      try {
        // Próbujemy załadować okładkę JPG
        const jpgUrl = `http://localhost:4001/api/covers/albums/${encodeURIComponent(albumId)}/cover.jpg`
        const jpgResponse = await fetch(jpgUrl)
        if (jpgResponse.ok) {
          setAlbumCoverUrl(jpgUrl)
          return
        }
        // Próbujemy JPEG
        const jpegUrl = `http://localhost:4001/api/covers/albums/${encodeURIComponent(albumId)}/cover.jpeg`
        const jpegResponse = await fetch(jpegUrl)
        if (jpegResponse.ok) {
          setAlbumCoverUrl(jpegUrl)
          return
        }
        // Jeśli JPG/JPEG nie istnieje, próbujemy PNG
        const pngUrl = `http://localhost:4001/api/covers/albums/${encodeURIComponent(albumId)}/cover.png`
        const pngResponse = await fetch(pngUrl)
        if (pngResponse.ok) {
          setAlbumCoverUrl(pngUrl)
        }
      } catch (error) {
        console.error('Error checking album cover:', error)
      }
    }
    checkAlbumCover()
  }, [albumId])

  async function loadFiles() {
    try {
      setLoading(true)
      const decodedFolder = decodeURIComponent(folderType!)
      const data = await api.getFilesInFolder(albumId!, projectName!, decodedFolder)
      setFiles(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return

    try {
      setUploading(true)
      const decodedFolder = decodeURIComponent(folderType!)

      for (let i = 0; i < fileList.length; i++) {
        await api.uploadFile(albumId!, projectName!, fileList[i], decodedFolder)
      }

      loadFiles()
    } catch (err: any) {
      alert(`Błąd podczas upload: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteFile(file: FileInfo) {
    if (!confirm(`Czy na pewno usunąć plik "${file.name}"?`)) return

    try {
      await api.deleteFile(albumId!, projectName!, file.path)
      loadFiles()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }
  async function handleArrangeVersions() {
    if (!confirm('Czy na pewno chcesz szeregowa\u0107 wersje? Pliki zostan\u0105 przenumerowane od najstarszej do najnowszej.')) return

    try {
      setArranging(true)
      await api.arrangeVersions(albumId!, projectName!, decodeURIComponent(folderType!))
      await loadFiles()
      alert('Wersje zosta\u0142y pomy\u015blnie zszeregowane')
    } catch (err: any) {
      alert(`B\u0142\u0105d podczas szeregowania: ${err.message}`)
    } finally {
      setArranging(false)
    }
  }
  async function handleOpenFile(file: FileInfo) {
    try {
      await api.openFile(albumId!, projectName!, file.path)
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  function openMoveModal(file: FileInfo) {
    setSelectedFile(file)
    setShowMoveModal(true)
  }

  function openRenameModal(file: FileInfo) {
    setSelectedFile(file)
    setNewFileName(file.name)
    setShowRenameModal(true)
  }

  async function handleMoveFile(targetFolder: string, fileType?: string) {
    if (!selectedFile) return

    try {
      await api.moveFile(albumId!, projectName!, selectedFile.path, targetFolder, fileType)
      setShowMoveModal(false)
      setSelectedFile(null)
      loadFiles()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  async function handleRenameFile() {
    if (!selectedFile || !newFileName.trim()) return

    try {
      await api.renameFile(albumId!, projectName!, selectedFile.path, newFileName.trim())
      setShowRenameModal(false)
      setSelectedFile(null)
      setNewFileName('')
      loadFiles()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Ładowanie plików...</div>
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

  const decodedFolder = decodeURIComponent(folderType!)

  return (
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
            onClick={() => navigate(`/project/${albumId}/${projectName}`)}
            className="text-white hover:text-gray-200 font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-lg transition"
          >
            ← Powrót do projektu
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">{decodedFolder}</h1>
            <p className="text-gray-200 mt-2">
              {projectName} / {albumId}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleArrangeVersions}
              disabled={arranging || files.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {arranging ? 'Szeregowanie...' : '\ud83d\udd22 Szereguj wersje'}
            </button>
            <label className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer">
              {uploading ? 'Przesyłanie...' : '+ Upload Pliki'}
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {files.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-xl">Brak plików w tym folderze</p>
              <p className="mt-2">Prześlij pliki, aby rozpocząć</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="p-6 hover:bg-gray-50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xs">
                        {file.extension.replace('.', '').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{file.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(file.size)} • {new Date(file.modifiedAt).toLocaleString('pl-PL')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Menu akcji */}
                  <div className="relative group/menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenFile(file)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-gray-700">Otwórz</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openRenameModal(file)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                      >
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-gray-700">Zmień nazwę</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openMoveModal(file)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                      >
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="text-gray-700">Przenieś</span>
                      </button>
                      
                      <div className="border-t border-gray-200"></div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(file)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 transition"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-red-600 font-medium">Usuń</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal przenoszenia */}
      {showMoveModal && selectedFile && (
        <MoveFileModal
          file={selectedFile}
          currentFolder={decodedFolder}
          onMove={handleMoveFile}
          onClose={() => {
            setShowMoveModal(false)
            setSelectedFile(null)
          }}
        />
      )}

      {/* Modal zmiany nazwy */}
      {showRenameModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Zmień nazwę pliku</h2>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRenameFile()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleRenameFile}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Zmień
              </button>
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setSelectedFile(null)
                  setNewFileName('')
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
    </div>
  )
}

// Komponent modalu przenoszenia
function MoveFileModal({
  file,
  currentFolder,
  onMove,
  onClose,
}: {
  file: FileInfo
  currentFolder: string
  onMove: (targetFolder: string, fileType?: string) => void
  onClose: () => void
}) {
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')

  const folders = [
    'Projekt FL',
    'Projekt Reaper',
    'Tekst',
    'Demo bit',
    'Demo nawijka',
    'Demo utwor',
    'Gotowe',
    'Pliki',
  ].filter((f) => f !== currentFolder)

  const needsTypeSelection =
    selectedFolder === 'Demo bit' ||
    selectedFolder === 'Demo nawijka' ||
    selectedFolder === 'Demo utwor' ||
    selectedFolder === 'Gotowe'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Przenieś plik</h2>
        <p className="text-gray-600 mb-4">
          Plik: <strong>{file.name}</strong>
        </p>

        <label className="block mb-2 font-semibold">Folder docelowy:</label>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Wybierz folder</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>

        {needsTypeSelection && (
          <>
            <label className="block mb-2 font-semibold">Typ pliku:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Wybierz typ</option>
              <option value="bit">Bit</option>
              <option value="nawijka">Nawijka</option>
              <option value="utwor">Utwór</option>
            </select>
          </>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onMove(selectedFolder, selectedType || undefined)}
            disabled={!selectedFolder || (needsTypeSelection && !selectedType)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Przenieś
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}
