import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

interface Album {
  id: string
  name: string
}

interface Project {
  name: string
}

export default function Sortownia() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<FileInfo[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [selectedAlbum, setSelectedAlbum] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedAlbum) {
      loadProjects()
    }
  }, [selectedAlbum])

  async function loadData() {
    try {
      setLoading(true)
      const [filesData, albumsData] = await Promise.all([
        api.getSortowniaFiles(),
        api.getAlbums(),
      ])
      setFiles(filesData)
      setAlbums(albumsData)
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function loadProjects() {
    try {
      const projectsData = await api.getProjectsByAlbum(selectedAlbum)
      setProjects(projectsData)
      setSelectedProject('')
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return

    try {
      setUploading(true)

      for (let i = 0; i < fileList.length; i++) {
        await api.uploadToSortownia(fileList[i])
      }

      loadData()
    } catch (err: any) {
      alert(`Błąd podczas upload: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteFile(file: FileInfo) {
    if (!confirm(`Czy na pewno usunąć plik "${file.name}"?`)) return

    try {
      await api.deleteSortowniaFile(file.path)
      loadData()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  async function handleOpenFile(file: FileInfo) {
    try {
      await api.openSortowniaFile(file.path)
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  function openMoveModal(file: FileInfo) {
    setSelectedFile(file)
    setSelectedAlbum('')
    setSelectedProject('')
    setSelectedFolder('')
    setSelectedType('')
    setShowMoveModal(true)
  }

  async function handleMoveFile() {
    if (!selectedFile || !selectedAlbum || !selectedProject || !selectedFolder) {
      alert('Wybierz album, projekt i folder docelowy')
      return
    }

    const needsType = ['Demo bit', 'Demo nawijka', 'Demo utwor', 'Gotowe'].includes(selectedFolder)
    if (needsType && !selectedType) {
      alert('Wybierz typ pliku')
      return
    }

    try {
      await api.moveFromSortownia(
        selectedFile.name,
        selectedAlbum,
        selectedProject,
        selectedFolder,
        selectedType || undefined
      )
      setShowMoveModal(false)
      setSelectedFile(null)
      loadData()
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
        <div className="text-xl text-gray-600">Ładowanie sortowni...</div>
      </div>
    )
  }

  const folders = [
    'Projekt FL',
    'Projekt Reaper',
    'Tekst',
    'Demo bit',
    'Demo nawijka',
    'Demo utwor',
    'Gotowe',
    'Pliki',
  ]

  const needsTypeSelection = ['Demo bit', 'Demo nawijka', 'Demo utwor', 'Gotowe'].includes(
    selectedFolder
  )

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Powrót do albumów
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">📦 Sortownia</h1>
            <p className="text-gray-600 mt-2">
              Miejsce na pliki oczekujące na przypisanie do projektów
            </p>
          </div>
          <div>
            <label className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer">
              {uploading ? 'Przesyłanie...' : '+ Dodaj Pliki'}
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
              <p className="text-xl">Brak plików w sortowni</p>
              <p className="mt-2">Dodaj pliki, aby później przypisać je do projektów</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="p-6 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-xs">
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
                      onClick={() => openMoveModal(file)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
                    >
                      Przypisz do projektu
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

      {/* Modal przypisywania do projektu */}
      {showMoveModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Przypisz plik do projektu</h2>
            <p className="text-gray-600 mb-4">
              Plik: <strong>{selectedFile.name}</strong>
            </p>

            <label className="block mb-2 font-semibold">Album:</label>
            <select
              value={selectedAlbum}
              onChange={(e) => setSelectedAlbum(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Wybierz album</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>

            {selectedAlbum && (
              <>
                <label className="block mb-2 font-semibold">Projekt:</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Wybierz projekt</option>
                  {projects.map((project) => (
                    <option key={project.name} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            {selectedProject && (
              <>
                <label className="block mb-2 font-semibold">Folder:</label>
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
              </>
            )}

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
                onClick={handleMoveFile}
                disabled={!selectedFolder}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Przenieś
              </button>
              <button
                onClick={() => {
                  setShowMoveModal(false)
                  setSelectedFile(null)
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
