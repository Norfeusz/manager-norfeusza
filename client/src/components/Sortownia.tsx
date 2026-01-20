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
  const [showMainFolderModal, setShowMainFolderModal] = useState(false)
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
  const [namingMode, setNamingMode] = useState<'auto' | 'custom' | 'original' | 'hybrid'>('auto')
  const [customFileName, setCustomFileName] = useState('')
  
  // Ścieżki dla Demo bit
  const [useSciezkiFolder, setUseSciezkiFolder] = useState(false)
  
  // Tworzenie nowego projektu
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  
  // Nawigacja w folderze głównym
  const [mainFolderPath, setMainFolderPath] = useState<string>('')
  const [mainFolderContents, setMainFolderContents] = useState<FileInfo[]>([])
  const [showCreateFolderInput, setShowCreateFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  // Podfoldery
  const subPath = searchParams.get('path') || ''

  // Cover image
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    loadCover()
  }, [subPath])

  async function loadCover() {
    try {
      const pngUrl = `http://localhost:4001/api/covers/simple-folder/Sortownia/cover.png`
      const response = await fetch(pngUrl)
      if (response.ok) {
        setCoverUrl(pngUrl)
      }
    } catch (err) {
      console.log('Brak okładki dla Sortownia')
    }
  }

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
  async function loadMainFolderContents(folderPath: string) {
    try {
      const contents = await api.getSimpleFolderFiles(folderPath)
      setMainFolderContents(contents)
    } catch (err: any) {
      console.error('Błąd wczytywania zawartości:', err)
      setMainFolderContents([])
    }
  }

  function openMainFolderModal() {
    setShowMainFolderModal(true)
    setMainFolderPath('')
    setMainFolderContents([])
  }

  function navigateToMainFolder(folder: 'Bity' | 'Pliki' | 'Teksty') {
    setMainFolderPath(folder)
    loadMainFolderContents(folder)
  }

  function navigateToSubfolder(folderName: string) {
    const newPath = mainFolderPath ? `${mainFolderPath}/${folderName}` : folderName
    setMainFolderPath(newPath)
    loadMainFolderContents(newPath)
  }

  function navigateBack() {
    const parts = mainFolderPath.split('/')
    parts.pop()
    const newPath = parts.join('/')
    setMainFolderPath(newPath)
    if (newPath) {
      loadMainFolderContents(newPath)
    } else {
      setMainFolderContents([])
    }
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

  async function handleCreateProject() {
    if (!newProjectName.trim()) {
      alert('Wpisz nazwę projektu')
      return
    }

    if (!selectedAlbum) {
      alert('Wybierz album')
      return
    }

    try {
      setCreatingProject(true)
      await api.createProject({
        albumId: selectedAlbum,
        name: newProjectName.trim(),
        type: 'standard'
      })
      
      // Odśwież listę projektów
      await loadProjects()
      
      // Wybierz nowo utworzony projekt
      setSelectedProject(newProjectName.trim())
      
      // Zamknij modal tworzenia projektu
      setShowCreateProjectModal(false)
      setNewProjectName('')
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setCreatingProject(false)
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
    // Nie resetuj wyboru projektu i folderu - zachowaj poprzedni wybór
    // setSelectedAlbum('')
    // setSelectedProject('')
    // setSelectedFolder('')
    // setSelectedType('')
    // setNamingMode('auto')
    setCustomFileName('') // Resetuj tylko custom name dla każdego pliku
    setShowMoveModal(true)
  }

  function generateAutoFileName(): string {
    if (!selectedProject || !selectedFolder || !selectedFile) return ''
    
    // Transliteracja polskich znaków
    const transliterate = (text: string): string => {
      const polishMap: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
      }
      return text.split('').map(char => polishMap[char] || char).join('')
    }

    // Normalizacja nazwy projektu
    const normalizedProjectName = transliterate(selectedProject)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    // Mapowanie folderów na typy
    const folderTypeMap: Record<string, string> = {
      'Projekt FL': 'projekt',
      'Projekt Reaper': 'projekt',
      'Tekst': 'tekst',
      'Demo bit': 'bit_demo',
      'Demo nawijka': 'nawijka_demo',
      'Demo utwór': 'utwor_demo',
      'Gotowe': selectedType ? `${selectedType}_gotowy` : 'gotowy',
      'Pliki': 'plik',
    }

    const fileType = folderTypeMap[selectedFolder] || 'plik'
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.'))
    
    return `${normalizedProjectName}-${fileType}_001${extension}`
  }

  async function loadMainFolderContents(folderPath: string) {
    try {
      const contents = await api.getSimpleFolderFiles(folderPath)
      setMainFolderContents(contents)
    } catch (err: any) {
      console.error('Błąd wczytywania zawartości:', err)
      setMainFolderContents([])
    }
  }

  function openMainFolderModal(file?: FileInfo) {
    if (file) setSelectedFile(file)
    setShowMainFolderModal(true)
    setMainFolderPath('')
    setMainFolderContents([])
  }

  function navigateToMainFolder(folder: 'Bity' | 'Pliki' | 'Teksty') {
    setMainFolderPath(folder)
    loadMainFolderContents(folder)
  }

  function navigateToSubfolder(folderName: string) {
    const newPath = mainFolderPath ? `${mainFolderPath}/${folderName}` : folderName
    setMainFolderPath(newPath)
    loadMainFolderContents(newPath)
  }

  function navigateBack() {
    const parts = mainFolderPath.split('/')
    parts.pop()
    const newPath = parts.join('/')
    setMainFolderPath(newPath)
    if (newPath) {
      loadMainFolderContents(newPath)
    } else {
      setMainFolderContents([])
    }
  }
  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      alert('Wpisz nazwę folderu')
      return
    }

    try {
      await api.createSimpleFolder(mainFolderPath, newFolderName.trim())
      setNewFolderName('')
      setShowCreateFolderInput(false)
      // Odśwież zawartość
      await loadMainFolderContents(mainFolderPath)
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  async function handleMoveToMainFolder(targetPath?: string) {
    if (!selectedFile) return

    try {
      // Zapisz aktualną pozycję scrollowania
      const scrollPosition = window.scrollY
      
      const finalPath = targetPath || mainFolderPath
      if (!finalPath) {
        alert('Wybierz folder docelowy')
        return
      }
      
      // Jeśli zaznaczono wiele plików, przenieś wszystkie
      if (selectedFiles.size > 0) {
        const filesToMove = files.filter(f => selectedFiles.has(f.path))
        for (const file of filesToMove) {
          const fileName = subPath ? `${subPath}/${file.name}` : file.name
          await api.moveToMainFolder(fileName, finalPath)
        }
        setSelectedFiles(new Set())
        setIsMultiSelectMode(false)
      } else {
        // Pojedynczy plik
        const fileName = subPath ? `${subPath}/${selectedFile.name}` : selectedFile.name
        await api.moveToMainFolder(fileName, finalPath)
      }
      
      setShowMainFolderModal(false)
      setSelectedFile(null)
      setMainFolderPath('')
      setMainFolderContents([])
      await loadData()
      
      // Przywróć pozycję scrollowania
      window.scrollTo(0, scrollPosition)
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    }
  }

  async function handleMoveFile() {
    if (!selectedFile || !selectedAlbum || !selectedProject || !selectedFolder) {
      alert('Wybierz album, projekt i folder docelowy')
      return
    }

    const needsType = selectedFolder === 'Gotowe'
    if (needsType && !selectedType) {
      alert('Wybierz typ pliku')
      return
    }
    
    if ((namingMode === 'custom' || namingMode === 'hybrid') && !customFileName.trim()) {
      alert('Wpisz nazwę pliku')
      return
    }

    try {
      // Jeśli zaznaczono wiele plików, przenieś wszystkie
      if (selectedFiles.size > 0) {
        const filesToMove = files.filter(f => selectedFiles.has(f.path))
        for (const file of filesToMove) {
          // Jeśli jesteśmy w podfolderze, dodaj ścieżkę relatywną
          const fileName = subPath ? `${subPath}/${file.name}` : file.name
          const customNameToUse = (namingMode === 'custom' || namingMode === 'hybrid') ? customFileName.trim() : 
                                  namingMode === 'original' ? file.name.replace(/\.[^.]+$/, '') : undefined
          await api.moveFromSortownia(
            fileName,
            selectedAlbum,
            selectedProject,
            selectedFolder,
            selectedType || undefined,
            customNameToUse,
            useSciezkiFolder
          )
        }
        setSelectedFiles(new Set())
        setIsMultiSelectMode(false)
      } else {
        // Pojedynczy plik
        // Jeśli jesteśmy w podfolderze, dodaj ścieżkę relatywną
        const fileName = subPath ? `${subPath}/${selectedFile.name}` : selectedFile.name
        const customNameToUse = (namingMode === 'custom' || namingMode === 'hybrid') ? customFileName.trim() : 
                                namingMode === 'original' ? selectedFile.name.replace(/\.[^.]+$/, '') : undefined
        await api.moveFromSortownia(
          fileName,
          selectedAlbum,
          selectedProject,
          selectedFolder,
          selectedType || undefined,
          customNameToUse,
          useSciezkiFolder
        )
      }
      
      // Zapisz aktualną pozycję scrollowania
      const scrollPosition = window.scrollY
      
      setShowMoveModal(false)
      setSelectedFile(null)
      await loadData()
      
      // Przywróć pozycję scrollowania
      window.scrollTo(0, scrollPosition)
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

  const needsTypeSelection = selectedFolder === 'Gotowe'

  return (
    <div 
      className="min-h-screen bg-gray-100 p-8"
      style={
        coverUrl
          ? {
              backgroundImage: `url("${coverUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      {/* Blur overlay */}
      {coverUrl && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 0
          }}
        />
      )}
      
      <div className="max-w-7xl mx-auto relative" style={{ zIndex: 1 }}>
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
                  onClick={() => {
                    // Wybierz pierwszy plik jako reprezentatywny dla modala
                    const firstFile = files.find(f => selectedFiles.has(f.path))
                    if (firstFile) {
                      openMainFolderModal(firstFile)
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  📁 Przenieś do folderu ({selectedFiles.size})
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

        <div 
          className="bg-white rounded-lg shadow-md"
          style={coverUrl ? { backgroundColor: 'rgba(255, 255, 255, 0.95)' } : undefined}
        >
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
                        onClick={() => openMainFolderModal(file)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                      >
                        Przenieś do folderu
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
          <div 
            className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={coverUrl ? { backgroundColor: 'rgba(255, 255, 255, 0.98)' } : undefined}
          >
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
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setShowCreateProjectModal(true)
                    } else {
                      setSelectedProject(e.target.value)
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Wybierz projekt</option>
                  <option value="__CREATE_NEW__" className="font-semibold text-blue-600">+ Stwórz nowy projekt</option>
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
            
            {selectedFolder === 'Demo bit' && (
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSciezkiFolder}
                    onChange={(e) => setUseSciezkiFolder(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-medium text-gray-800">Przenieś do folderu "Ścieżki"</span>
                    <p className="text-sm text-gray-600">Zachowa oryginalną nazwę pliku bez numeracji</p>
                  </div>
                </label>
              </div>
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
                      onChange={(e) => setNamingMode(e.target.value as 'auto' | 'custom' | 'original' | 'hybrid')}
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
                      value="hybrid"
                      checked={namingMode === 'hybrid'}
                      onChange={(e) => {
                        setNamingMode(e.target.value as 'auto' | 'custom' | 'original' | 'hybrid')
                        // Wygeneruj automatyczną nazwę jako domyślną
                        setCustomFileName(generateAutoFileName().replace(/\.[^.]+$/, ''))
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <span className="font-medium text-gray-800">Hybryda</span>
                      <p className="text-sm text-gray-600">Edytuj wygenerowaną nazwę</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="namingMode"
                      value="custom"
                      checked={namingMode === 'custom'}
                      onChange={(e) => setNamingMode(e.target.value as 'auto' | 'custom' | 'original' | 'hybrid')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <span className="font-medium text-gray-800">Niestandardowa nazwa</span>
                      <p className="text-sm text-gray-600">Wpisz własną nazwę pliku</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="namingMode"
                      value="original"
                      checked={namingMode === 'original'}
                      onChange={(e) => setNamingMode(e.target.value as 'auto' | 'custom' | 'original' | 'hybrid')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <span className="font-medium text-gray-800">Oryginalna nazwa</span>
                      <p className="text-sm text-gray-600">Zachowaj nazwę z pliku</p>
                    </div>
                  </label>
                </div>
                
                {(namingMode === 'custom' || namingMode === 'hybrid') && (
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

      {/* Modal przenoszenia do folderu głównego */}
      {showMainFolderModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            style={coverUrl ? { backgroundColor: 'rgba(255, 255, 255, 0.98)' } : undefined}
          >
            <h2 className="text-2xl font-bold mb-4">Przenieś do folderu</h2>
            <p className="text-gray-600 mb-6">
              {selectedFiles.size > 0 ? (
                <span>Plików do przeniesienia: <strong>{selectedFiles.size}</strong></span>
              ) : (
                <span>Plik: <strong>{selectedFile.name}</strong></span>
              )}
            </p>

            {/* Breadcrumb */}
            {mainFolderPath && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <button
                  onClick={() => {
                    setMainFolderPath('')
                    setMainFolderContents([])
                  }}
                  className="hover:text-blue-600 font-semibold"
                >
                  📁 Foldery główne
                </button>
                {mainFolderPath.split('/').map((part, idx, arr) => (
                  <span key={idx} className="flex items-center gap-2">
                    <span>/</span>
                    <button
                      onClick={() => {
                        const newPath = arr.slice(0, idx + 1).join('/')
                        setMainFolderPath(newPath)
                        loadMainFolderContents(newPath)
                      }}
                      className="hover:text-blue-600 font-semibold"
                    >
                      {part}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Wybór folderu głównego */}
            {!mainFolderPath && (
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => navigateToMainFolder('Bity')}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-left flex items-center gap-2"
                >
                  <span>📁</span>
                  <span>Bity</span>
                  <span className="ml-auto">→</span>
                </button>
                <button
                  onClick={() => navigateToMainFolder('Pliki')}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-left flex items-center gap-2"
                >
                  <span>📁</span>
                  <span>Pliki</span>
                  <span className="ml-auto">→</span>
                </button>
                <button
                  onClick={() => navigateToMainFolder('Teksty')}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-left flex items-center gap-2"
                >
                  <span>📁</span>
                  <span>Teksty</span>
                  <span className="ml-auto">→</span>
                </button>
              </div>
            )}

            {/* Lista podfolderów */}
            {mainFolderPath && (
              <div className="space-y-2 mb-6">
                {/* Przycisk przeniesienia do bieżącego folderu */}
                <button
                  onClick={() => handleMoveToMainFolder()}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                >
                  ✓ Przenieś tutaj
                </button>

                {/* Tworzenie nowego folderu */}
                <div className="border-t pt-4 mt-4">
                  {!showCreateFolderInput ? (
                    <button
                      onClick={() => setShowCreateFolderInput(true)}
                      className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition text-sm font-semibold"
                    >
                      + Dodaj podfolder
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateFolder()
                          }
                        }}
                        placeholder="Nazwa folderu..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateFolder}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-semibold"
                        >
                          Utwórz
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateFolderInput(false)
                            setNewFolderName('')
                          }}
                          className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition text-sm font-semibold"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista podfolderów */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Podfoldery:</h3>
                  {mainFolderContents.filter(f => f.isDirectory).length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Brak podfolderów</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {mainFolderContents.filter(f => f.isDirectory).map((folder) => (
                        <button
                          key={folder.name}
                          onClick={() => navigateToSubfolder(folder.name)}
                          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition text-left flex items-center gap-2"
                        >
                          <span>📁</span>
                          <span>{folder.name}</span>
                          <span className="ml-auto">→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Przyciski akcji */}
            <div className="flex gap-3">
              {mainFolderPath && (
                <button
                  onClick={navigateBack}
                  className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                >
                  ← Wstecz
                </button>
              )}
              <button
                onClick={() => {
                  setShowMainFolderModal(false)
                  setSelectedFile(null)
                  setMainFolderPath('')
                  setMainFolderContents([])
                }}
                className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tworzenia nowego projektu */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
            style={coverUrl ? { backgroundColor: 'rgba(255, 255, 255, 0.98)' } : undefined}
          >
            <h2 className="text-2xl font-bold mb-4">Stwórz nowy projekt</h2>
            <p className="text-gray-600 mb-4">
              Album: <strong>{albums.find(a => a.id === selectedAlbum)?.name}</strong>
            </p>

            <label className="block mb-2 font-semibold">Nazwa projektu:</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !creatingProject) {
                  handleCreateProject()
                }
              }}
              placeholder="Wpisz nazwę projektu..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              disabled={creatingProject}
            />

            <div className="flex gap-3">
              <button
                onClick={handleCreateProject}
                disabled={creatingProject || !newProjectName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {creatingProject ? 'Tworzenie...' : 'Utwórz'}
              </button>
              <button
                onClick={() => {
                  setShowCreateProjectModal(false)
                  setNewProjectName('')
                }}
                disabled={creatingProject}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold transition"
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
