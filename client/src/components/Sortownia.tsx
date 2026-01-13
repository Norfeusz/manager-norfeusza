import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()
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
  
  // Multi-select
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  
  // Nazewnictwo plików
  const [namingMode, setNamingMode] = useState<'auto' | 'custom'>('auto')
  const [customFileName, setCustomFileName] = useState('')
  
  // Podfoldery
  const subPath = searchParams.get('path') || ''

  useEffect(() => {
    loadData()
  }, [subPath])

  useEffect(() => {
    if (selectedAlbum) {
      loadProjects()
    }
  }, [selectedAlbum])

  async function loadData() {
    try {
      setLoading(true)
      const folderPath = subPath ? `Sortownia/${subPath}` : 'Sortownia'
      const [filesData, albumsData] = await Promise.all([
        api.getSimpleFolderFiles(folderPath),
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

  function handleFolderClick(folderName: string) {
    const newSubPath = subPath ? `${subPath}/${folderName}` : folderName
    setSearchParams({ path: newSubPath })
  }

  function handleGoBack() {
    if (subPath) {
      const parts = subPath.split('/')
      parts.pop()
      if (parts.length > 0) {
        setSearchParams({ path: parts.join('/') })
      } else {
        setSearchParams({})
      }
    } else {
      navigate('/')
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
    setNamingMode('auto')
    setCustomFileName('')
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
    
    if (namingMode === 'custom' && !customFileName.trim()) {
      alert('Wpisz niestandardową nazwę pliku')
      return
    }

    try {
      // Jeśli zaznaczono wiele plików, przenieś wszystkie
      if (selectedFiles.size > 0) {
        const filesToMove = files.filter(f => selectedFiles.has(f.path))
        for (const file of filesToMove) {
          await api.moveFromSortownia(
            file.name,
            selectedAlbum,
            selectedProject,
            selectedFolder,
            selectedType || undefined,
            namingMode === 'custom' ? customFileName.trim() : undefined
          )
        }
        setSelectedFiles(new Set())
        setIsMultiSelectMode(false)
      } else {
        // Pojedynczy plik
        await api.moveFromSortownia(
          selectedFile.name,
          selectedAlbum,
          selectedProject,
          selectedFolder,
          selectedType || undefined,
          namingMode === 'custom' ? customFileName.trim() : undefined
        )
      }
      
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

  function toggleFileSelection(filePath: string) {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath)
    } else {
      newSelected.add(filePath)
    }
    setSelectedFiles(newSelected)
  }

  function selectAllFiles() {
    setSelectedFiles(new Set(files.map(f => f.path)))
  }

  function deselectAllFiles() {
    setSelectedFiles(new Set())
  }

  function toggleMultiSelectMode() {
    setIsMultiSelectMode(!isMultiSelectMode)
    if (isMultiSelectMode) {
      setSelectedFiles(new Set())
    }
  }

  async function handleDeleteSelected() {
    if (selectedFiles.size === 0) return
    if (!confirm(`Czy na pewno usunąć ${selectedFiles.size} plików?`)) return

    try {
      for (const filePath of selectedFiles) {
        await api.deleteSortowniaFile(filePath)
      }
      setSelectedFiles(new Set())
      setIsMultiSelectMode(false)
      loadData()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  function openMoveModalForSelected() {
    if (selectedFiles.size === 0) return
    // Ustaw pierwszy plik jako reprezentacyjny dla modalnego
    const firstFile = files.find(f => selectedFiles.has(f.path))
    if (firstFile) {
      setSelectedFile(firstFile)
      setShowMoveModal(true)
    }
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
            onClick={handleGoBack}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Powrót
          </button>
          <span className="text-gray-600">
            Sortownia{subPath && <span> / {subPath}</span>}
          </span>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">📦 Sortownia</h1>
            <p className="text-gray-600 mt-2">
              Miejsce na pliki oczekujące na przypisanie do projektów
            </p>
          </div>
          <div className="flex gap-3">
            {isMultiSelectMode && selectedFiles.size > 0 && (
              <>
                <button
                  onClick={openMoveModalForSelected}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  📎 Przypisz zaznaczone ({selectedFiles.size})
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  🗑️ Usuń zaznaczone ({selectedFiles.size})
                </button>
              </>
            )}
            <button
              onClick={toggleMultiSelectMode}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                isMultiSelectMode 
                  ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isMultiSelectMode ? 'Anuluj zaznaczanie' : '☑️ Zaznacz wiele'}
            </button>
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
            <>
              {isMultiSelectMode && (
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Zaznaczono: {selectedFiles.size} / {files.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllFiles}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Zaznacz wszystkie
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={deselectAllFiles}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Odznacz wszystkie
                    </button>
                  </div>
                </div>
              )}
              <div className="divide-y divide-gray-200">
              {files.map((file) => (
                <div
                  key={file.path}
                  className={`p-6 transition flex items-center justify-between ${
                    selectedFiles.has(file.path) ? 'bg-blue-50' : file.isDirectory ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (file.isDirectory) {
                      handleFolderClick(file.name)
                    }
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {isMultiSelectMode && !file.isDirectory && (
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.path)}
                        onChange={() => toggleFileSelection(file.path)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    <div className={`w-12 h-12 ${file.isDirectory ? 'bg-blue-100' : 'bg-orange-100'} rounded-lg flex items-center justify-center`}>
                      {file.isDirectory ? (
                        <span className="text-2xl">📁</span>
                      ) : (
                        <span className="text-orange-600 font-bold text-xs">
                          {(file.extension || '').replace('.', '').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{file.name}</h3>
                      <p className="text-sm text-gray-600">
                        {file.isDirectory ? 'Folder' : `${formatFileSize(file.size)} • ${new Date(file.modifiedAt).toLocaleString('pl-PL')}`}
                      </p>
                    </div>
                  </div>
                  {!isMultiSelectMode && !file.isDirectory && (
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
                  )}
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Modal przypisywania do projektu */}
      {showMoveModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Przypisz plik do projektu</h2>
            <p className="text-gray-600 mb-4">
              {selectedFiles.size > 0 ? (
                <span>Plików do przeniesienia: <strong>{selectedFiles.size}</strong></span>
              ) : (
                <span>Plik: <strong>{selectedFile.name}</strong></span>
              )}
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
            
            {selectedFolder && (
              <>
                <label className="block mb-4 font-semibold">Nazewnictwo pliku:</label>
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="namingMode"
                      value="auto"
                      checked={namingMode === 'auto'}
                      onChange={(e) => setNamingMode(e.target.value as 'auto' | 'custom')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <span className="font-medium text-gray-800">Automatyczna nazwa</span>
                      <p className="text-sm text-gray-600">Numeracja 001, 002, 003...</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="namingMode"
                      value="custom"
                      checked={namingMode === 'custom'}
                      onChange={(e) => setNamingMode(e.target.value as 'auto' | 'custom')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <span className="font-medium text-gray-800">Niestandardowa nazwa</span>
                      <p className="text-sm text-gray-600">Wpisz własną nazwę pliku</p>
                    </div>
                  </label>
                </div>
                
                {namingMode === 'custom' && (
                  <>
                    <label className="block mb-2 font-semibold">Nazwa pliku:</label>
                    <input
                      type="text"
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      placeholder="Wpisz nazwę (bez rozszerzenia)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    />
                  </>
                )}
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
