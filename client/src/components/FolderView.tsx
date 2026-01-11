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

  useEffect(() => {
    if (albumId && projectName && folderType) {
      loadFiles()
    }
  }, [albumId, projectName, folderType])

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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/project/${albumId}/${projectName}`)}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Powrót do projektu
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{decodedFolder}</h1>
            <p className="text-gray-600 mt-2">
              {projectName} / {albumId}
            </p>
          </div>
          <div>
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
                  className="p-6 hover:bg-gray-50 transition flex items-center justify-between"
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenFile(file)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                    >
                      Otwórz
                    </button>
                    <button
                      onClick={() => openRenameModal(file)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition"
                    >
                      Zmień nazwę
                    </button>
                    <button
                      onClick={() => openMoveModal(file)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
                    >
                      Przenieś
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                    >
                      Usuń
                    </button>
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
