import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface FileItem {
  name: string
  path: string
  relativePath: string
  size: number
  extension: string
  createdAt: string
  modifiedAt: string
  isDirectory: boolean
}

export default function TextManager() {
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [multiSelectMode, setMultiSelectMode] = useState(false)

  // Modals
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showMoveToProjectModal, setShowMoveToProjectModal] = useState(false)
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false)

  // Create folder
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  // Rename
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [renaming, setRenaming] = useState(false)

  // Move to project
  const [albums, setAlbums] = useState<any[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [projectMode, setProjectMode] = useState<'existing' | 'new'>('existing')
  const [newProjectName, setNewProjectName] = useState('')
  const [movingToProject, setMovingToProject] = useState(false)

  // Move to folder
  const [availableFolders, setAvailableFolders] = useState<FileItem[]>([])
  const [selectedTargetFolder, setSelectedTargetFolder] = useState('')
  const [folderMode, setFolderMode] = useState<'existing' | 'new'>('existing')
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [movingToFolder, setMovingToFolder] = useState(false)

  // Unpack texts
  const [unpacking, setUnpacking] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [currentPath])

  async function loadFiles() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getTextFiles(currentPath)
      setFiles(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getBreadcrumbs(): string[] {
    if (!currentPath) return ['Teksty']
    return ['Teksty', ...currentPath.split('\\').filter(Boolean)]
  }

  function navigateToFolder(folderRelativePath: string) {
    setCurrentPath(folderRelativePath)
    setSelectedFiles(new Set())
  }

  function navigateUp() {
    if (!currentPath) return
    const parts = currentPath.split('\\').filter(Boolean)
    parts.pop()
    setCurrentPath(parts.join('\\'))
    setSelectedFiles(new Set())
  }

  function navigateToBreadcrumb(index: number) {
    if (index === 0) {
      setCurrentPath('')
    } else {
      const parts = currentPath.split('\\').filter(Boolean)
      setCurrentPath(parts.slice(0, index).join('\\'))
    }
    setSelectedFiles(new Set())
  }

  function toggleFileSelection(relativePath: string) {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(relativePath)) {
      newSelected.delete(relativePath)
    } else {
      newSelected.add(relativePath)
    }
    setSelectedFiles(newSelected)
  }

  function selectAllFiles() {
    const txtFiles = files.filter(f => !f.isDirectory)
    setSelectedFiles(new Set(txtFiles.map(f => f.relativePath)))
  }

  function deselectAllFiles() {
    setSelectedFiles(new Set())
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      alert('Podaj nazwę folderu')
      return
    }

    try {
      setCreatingFolder(true)
      await api.createTextFolder(currentPath, newFolderName.trim())
      setShowCreateFolderModal(false)
      setNewFolderName('')
      loadFiles()
    } catch (error: any) {
      alert(`Błąd: ${error.message}`)
    } finally {
      setCreatingFolder(false)
    }
  }

  function openRenameModal(file: FileItem) {
    setRenameTarget(file)
    setNewFileName(file.name)
    setShowRenameModal(true)
  }

  async function handleRename() {
    if (!renameTarget || !newFileName.trim()) {
      alert('Podaj nową nazwę')
      return
    }

    try {
      setRenaming(true)
      await api.renameTextFile(renameTarget.relativePath, newFileName.trim())
      setShowRenameModal(false)
      setRenameTarget(null)
      setNewFileName('')
      loadFiles()
    } catch (error: any) {
      alert(`Błąd: ${error.message}`)
    } finally {
      setRenaming(false)
    }
  }

  async function handleDelete() {
    if (selectedFiles.size === 0) {
      alert('Nie zaznaczono żadnych plików')
      return
    }

    if (!confirm(`Czy na pewno usunąć ${selectedFiles.size} plików?`)) {
      return
    }

    try {
      const result = await api.deleteTextFiles(Array.from(selectedFiles))
      alert(`✅ ${result.message}`)
      setSelectedFiles(new Set())
      setMultiSelectMode(false)
      loadFiles()
    } catch (error: any) {
      alert(`❌ Błąd: ${error.message}`)
    }
  }

  async function openMoveToProjectModal() {
    if (selectedFiles.size === 0) {
      alert('Nie zaznaczono żadnych plików')
      return
    }

    try {
      const albumsData = await api.getTextManagerAlbums()
      console.log('[TextManager] Loaded albums:', albumsData)
      setAlbums(albumsData)
      setShowMoveToProjectModal(true)
      setSelectedAlbum('')
      setProjects([])
      setSelectedProject('')
      setProjectMode('existing')
      setNewProjectName('')
    } catch (error: any) {
      alert(`Błąd: ${error.message}`)
    }
  }

  async function handleAlbumChange(albumId: string) {
    setSelectedAlbum(albumId)
    setSelectedProject('')

    if (!albumId) {
      setProjects([])
      return
    }

    try {
      const projectsData = await api.getTextManagerProjects(albumId)
      setProjects(projectsData)
    } catch (error: any) {
      alert(`Błąd: ${error.message}`)
      setProjects([])
    }
  }

  async function handleMoveToProject() {
    if (!selectedAlbum) {
      alert('Wybierz album')
      return
    }

    let projectName = selectedProject

    // Jeśli tryb "nowy projekt" - najpierw utwórz projekt
    if (projectMode === 'new') {
      if (!newProjectName.trim()) {
        alert('Podaj nazwę nowego projektu')
        return
      }

      try {
        setMovingToProject(true)
        await api.createProject({
          name: newProjectName.trim(),
          albumId: selectedAlbum,
          useNumbering: false
        })
        projectName = newProjectName.trim()
      } catch (error: any) {
        alert(`❌ Błąd tworzenia projektu: ${error.message}`)
        setMovingToProject(false)
        return
      }
    } else {
      if (!selectedProject) {
        alert('Wybierz projekt')
        return
      }
    }

    try {
      setMovingToProject(true)
      const result = await api.moveTextsToProject(
        Array.from(selectedFiles),
        selectedAlbum,
        projectName
      )
      alert(`✅ ${result.message}`)
      setShowMoveToProjectModal(false)
      setSelectedFiles(new Set())
      setMultiSelectMode(false)
      loadFiles()
    } catch (error: any) {
      alert(`❌ Błąd: ${error.message}`)
    } finally {
      setMovingToProject(false)
    }
  }

  async function openMoveToFolderModal(singleFile?: FileItem) {
    // Jeśli jest pojedynczy plik, ustawiamy go jako zaznaczony
    if (singleFile) {
      setSelectedFiles(new Set([singleFile.relativePath]))
    } else if (selectedFiles.size === 0) {
      alert('Nie zaznaczono żadnych plików')
      return
    }

    // Załaduj listę WSZYSTKICH folderów z głównego katalogu Teksty (rekurencyjnie)
    // aby użytkownik mógł przenosić pliki między dowolnymi folderami
    try {
      const rootFiles = await api.getTextFiles('') // Główny folder Teksty
      const rootFolders = rootFiles.filter(f => f.isDirectory)
      
      // Dodatkowo, jeśli jesteśmy w podfolderze, załaduj też jego podfoldery
      let subfolders: any[] = []
      if (currentPath) {
        const currentFiles = await api.getTextFiles(currentPath)
        subfolders = currentFiles.filter(f => f.isDirectory)
      }
      
      // Połącz: foldery z głównego katalogu + ewentualne podfoldery z bieżącego
      const allFolders = [...rootFolders, ...subfolders]
      
      // Usuń duplikaty (jeśli bieżący folder jest już w rootFolders)
      const uniqueFolders = Array.from(
        new Map(allFolders.map(f => [f.relativePath, f])).values()
      )
      
      console.log('📁 Dostępne foldery:', uniqueFolders.map(f => f.relativePath))
      
      setAvailableFolders(uniqueFolders)
      setShowMoveToFolderModal(true)
      setSelectedTargetFolder('')
      setFolderMode('existing')
      setNewSubfolderName('')
    } catch (err: any) {
      alert(`Błąd ładowania folderów: ${err.message}`)
      return
    }
  }

  async function handleMoveToFolder() {
    let targetPath = selectedTargetFolder

    // Jeśli tryb "nowy podfolder" - najpierw utwórz folder
    if (folderMode === 'new') {
      if (!newSubfolderName.trim()) {
        alert('Podaj nazwę nowego podfolderu')
        return
      }

      try {
        setMovingToFolder(true)
        await api.createTextFolder(currentPath, newSubfolderName.trim())
        // Ścieżka do nowego folderu względem głównego folderu Teksty
        targetPath = currentPath ? `${currentPath}\\${newSubfolderName.trim()}` : newSubfolderName.trim()
      } catch (error: any) {
        alert(`❌ Błąd tworzenia folderu: ${error.message}`)
        setMovingToFolder(false)
        return
      }
    } else {
      if (targetPath === null || targetPath === undefined) {
        alert('Wybierz folder docelowy')
        return
      }
    }

    try {
      setMovingToFolder(true)
      const result = await api.moveTextsToFolder(
        Array.from(selectedFiles),
        targetPath
      )
      alert(`✅ ${result.message}`)
      setShowMoveToFolderModal(false)
      setSelectedFiles(new Set())
      setMultiSelectMode(false)
      loadFiles()
    } catch (error: any) {
      alert(`❌ Błąd: ${error.message}`)
    } finally {
      setMovingToFolder(false)
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pl-PL')
  }

  async function handleUnpackTexts() {
    if (!confirm('Czy na pewno chcesz wypakować teksty z backupu FastNotepad?\n\nProces może zająć kilka minut.')) {
      return
    }

    try {
      setUnpacking(true)
      const result = await api.unpackTexts()
      
      const stats = result.stats
      const message = `✅ Teksty rozpakowane i zorganizowane!\n\n` +
        `⏭️  Pominiętych (100% zgodność): ${stats.skipped}\n` +
        `📝 Dodanych jako wersje (30-99%): ${stats.addedAsVersion}\n` +
        `✨ Dodanych jako nowe (0-29%): ${stats.addedAsNew}`
      
      alert(message)
      loadFiles() // Odśwież listę plików
    } catch (error: any) {
      alert(`❌ Błąd: ${error.message}`)
    } finally {
      setUnpacking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl text-gray-600">Ładowanie...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl text-red-600">Błąd: {error}</div>
      </div>
    )
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-800">📝 Zarządzanie Tekstami</h1>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              ← Powrót
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-blue-600 transition ${
                    index === breadcrumbs.length - 1 ? 'font-bold text-blue-600' : ''
                  }`}
                >
                  {crumb}
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {currentPath && (
                <button
                  onClick={navigateUp}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  ⬆ Katalog nadrzędny
                </button>
              )}
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                📁 Utwórz podfolder
              </button>
              {!currentPath && (
                <button
                  onClick={handleUnpackTexts}
                  disabled={unpacking}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50"
                  title="Wypakuj teksty z backupu FastNotepad"
                >
                  {unpacking ? '⏳ Rozpakowywanie...' : '📦 Wypakuj teksty'}
                </button>
              )}
              <button
                onClick={() => {
                  setMultiSelectMode(!multiSelectMode)
                  if (multiSelectMode) {
                    setSelectedFiles(new Set())
                  }
                }}
                className={`px-4 py-2 rounded-lg transition ${
                  multiSelectMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {multiSelectMode ? '✓ Zaznaczanie aktywne' : '☑ Zaznacz wiele'}
              </button>
            </div>

            {multiSelectMode && selectedFiles.size > 0 && (
              <div className="flex gap-3">
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                  Zaznaczono: {selectedFiles.size}
                </span>
                <button
                  onClick={selectAllFiles}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                >
                  Zaznacz wszystkie
                </button>
                <button
                  onClick={deselectAllFiles}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                >
                  Odznacz wszystkie
                </button>
                <button
                  onClick={openMoveToProjectModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  🎵 Przypisz do projektu
                </button>
                <button
                  onClick={openMoveToFolderModal}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition"
                >
                  📂 Przenieś do folderu
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  🗑️ Usuń ({selectedFiles.size})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Files list */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {files.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-xl">Brak plików w tym folderze</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg transition ${
                    selectedFiles.has(file.relativePath)
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {multiSelectMode && !file.isDirectory && (
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.relativePath)}
                        onChange={() => toggleFileSelection(file.relativePath)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        file.isDirectory ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}
                    >
                      <span className="text-2xl">
                        {file.isDirectory ? '📁' : '📄'}
                      </span>
                    </div>
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        if (file.isDirectory) {
                          navigateToFolder(file.relativePath)
                        }
                      }}
                      onDoubleClick={async () => {
                        if (!file.isDirectory) {
                          try {
                            await api.openTextFile(file.relativePath)
                          } catch (error: any) {
                            alert(`Błąd: ${error.message}`)
                          }
                        }
                      }}
                    >
                      <h3 className="text-lg font-semibold text-gray-800">
                        {file.name}
                      </h3>
                      {!file.isDirectory && (
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{formatDate(file.modifiedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!multiSelectMode && !file.isDirectory && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openRenameModal(file)}
                        className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm transition"
                        title="Zmień nazwę"
                      >
                        ✏️ Zmień nazwę
                      </button>
                      <button
                        onClick={async () => {
                          setSelectedFiles(new Set([file.relativePath]))
                          // Załaduj albumy przed otwarciem modalu
                          try {
                            const albumsData = await api.getTextManagerAlbums()
                            console.log('[TextManager] Loaded albums for single file:', albumsData)
                            setAlbums(albumsData)
                            setShowMoveToProjectModal(true)
                            setSelectedAlbum('')
                            setProjects([])
                            setSelectedProject('')
                            setProjectMode('existing')
                            setNewProjectName('')
                          } catch (error: any) {
                            alert(`Błąd: ${error.message}`)
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                        title="Przypisz do projektu"
                      >
                        🎵 Do projektu
                      </button>
                      <button
                        onClick={() => {
                          openMoveToFolderModal(file)
                        }}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
                        title="Przenieś do folderu"
                      >
                        📁 Do folderu
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Czy na pewno chcesz usunąć plik "${file.name}"?`)) {
                            try {
                              await api.deleteTextFiles([file.relativePath])
                              alert('✅ Plik usunięty')
                              loadFiles()
                            } catch (error: any) {
                              alert(`❌ Błąd: ${error.message}`)
                            }
                          }
                        }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                        title="Usuń plik"
                      >
                        🗑️ Usuń
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Utwórz folder */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 50 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📁 Utwórz nowy podfolder</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa folderu:
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="np. Zwrotki"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateFolderModal(false)
                  setNewFolderName('')
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {creatingFolder ? 'Tworzenie...' : 'Utwórz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Zmień nazwę */}
      {showRenameModal && renameTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 50 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✏️ Zmień nazwę pliku</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obecna nazwa: <span className="font-bold">{renameTarget.name}</span>
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                Nowa nazwa:
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setRenameTarget(null)
                  setNewFileName('')
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleRename}
                disabled={renaming}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {renaming ? 'Zmiana...' : 'Zmień nazwę'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Przypisz do projektu */}
      {showMoveToProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 50 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎵 Przypisz do projektu ({selectedFiles.size} plików)
            </h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Wybierz album:
                </label>
                <select
                  value={selectedAlbum}
                  onChange={(e) => handleAlbumChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Wybierz album --</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAlbum && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2. Wybierz tryb:
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setProjectMode('existing')
                        setNewProjectName('')
                      }}
                      className={`flex-1 p-3 rounded-lg border-2 transition ${
                        projectMode === 'existing'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      📁 Istniejący projekt
                    </button>
                    <button
                      onClick={() => {
                        setProjectMode('new')
                        setSelectedProject('')
                      }}
                      className={`flex-1 p-3 rounded-lg border-2 transition ${
                        projectMode === 'new'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      ✨ Utwórz nowy projekt
                    </button>
                  </div>

                  {projectMode === 'existing' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                        Wybierz projekt:
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">-- Wybierz projekt --</option>
                        {projects.map((project) => (
                          <option key={project.name} value={project.name}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                        Nazwa nowego projektu:
                      </label>
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="np. Nowy utwór"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedAlbum && ((projectMode === 'existing' && selectedProject) || (projectMode === 'new' && newProjectName)) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Pliki zostaną przeniesione do:</strong>
                  </p>
                  <p className="text-sm font-mono text-blue-800 mt-1">
                    {selectedAlbum} → {projectMode === 'existing' ? selectedProject : newProjectName} → Tekst/
                  </p>
                  {projectMode === 'new' && (
                    <p className="text-xs text-green-700 mt-2">
                      ✨ Projekt zostanie utworzony automatycznie
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMoveToProjectModal(false)
                  setSelectedAlbum('')
                  setProjects([])
                  setSelectedProject('')
                  setProjectMode('existing')
                  setNewProjectName('')
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleMoveToProject}
                disabled={movingToProject || !selectedAlbum || (projectMode === 'existing' && !selectedProject) || (projectMode === 'new' && !newProjectName.trim())}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {movingToProject ? 'Przenoszenie...' : (projectMode === 'new' ? 'Utwórz projekt i przenieś' : 'Przenieś pliki')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Przenieś do folderu */}
      {showMoveToFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 50 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📂 Przenieś do folderu ({selectedFiles.size} plików)
            </h2>
            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz tryb:
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setFolderMode('existing')
                      setNewSubfolderName('')
                    }}
                    className={`flex-1 p-3 rounded-lg border-2 transition ${
                      folderMode === 'existing'
                        ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                        : 'border-gray-300 hover:border-cyan-400'
                    }`}
                  >
                    📁 Istniejący folder
                  </button>
                  <button
                    onClick={() => {
                      setFolderMode('new')
                      setSelectedTargetFolder('')
                    }}
                    className={`flex-1 p-3 rounded-lg border-2 transition ${
                      folderMode === 'new'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    ✨ Utwórz nowy podfolder
                  </button>
                </div>
              </div>

              {folderMode === 'existing' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wybierz folder docelowy:
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {/* Opcja: główny folder Teksty */}
                    <button
                      onClick={() => setSelectedTargetFolder('')}
                      className={`w-full p-3 rounded-lg border text-left transition ${
                        selectedTargetFolder === ''
                          ? 'border-cyan-600 bg-cyan-50'
                          : 'border-gray-200 hover:border-cyan-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏠</span>
                        <div>
                          <p className="font-medium text-gray-800">Główny folder Teksty</p>
                          <p className="text-xs text-gray-500">D:\DATA\Norfeusz\Teksty\</p>
                        </div>
                        {selectedTargetFolder === '' && <span className="ml-auto text-cyan-600">✓</span>}
                      </div>
                    </button>

                    {/* Subfoldery z aktualnego widoku */}
                    {availableFolders.map((folder, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTargetFolder(folder.relativePath)}
                        className={`w-full p-3 rounded-lg border text-left transition ${
                          selectedTargetFolder === folder.relativePath
                            ? 'border-cyan-600 bg-cyan-50'
                            : 'border-gray-200 hover:border-cyan-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📁</span>
                          <div>
                            <p className="font-medium text-gray-800">{folder.name}</p>
                            <p className="text-xs text-gray-500">{folder.relativePath}</p>
                          </div>
                          {selectedTargetFolder === folder.relativePath && (
                            <span className="ml-auto text-cyan-600">✓</span>
                          )}
                        </div>
                      </button>
                    ))}

                    {availableFolders.length === 0 && currentPath && (
                      <p className="text-gray-500 text-sm p-3">
                        Brak podfolderów w tym katalogu. Możesz przenieść do głównego folderu Teksty.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwa nowego podfolderu:
                  </label>
                  <input
                    type="text"
                    value={newSubfolderName}
                    onChange={(e) => setNewSubfolderName(e.target.value)}
                    placeholder="np. Zwrotki"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Folder zostanie utworzony w: {currentPath || 'Teksty (główny folder)'}
                  </p>
                </div>
              )}

              {((folderMode === 'existing' && selectedTargetFolder !== null) || (folderMode === 'new' && newSubfolderName.trim())) && (
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Pliki zostaną przeniesione do:</strong>
                  </p>
                  <p className="text-sm font-mono text-cyan-800 mt-1">
                    Teksty\ {folderMode === 'existing' ? (selectedTargetFolder || '(główny folder)') : (currentPath ? `${currentPath}\\${newSubfolderName}` : newSubfolderName)}
                  </p>
                  {folderMode === 'new' && (
                    <p className="text-xs text-green-700 mt-2">
                      ✨ Podfolder zostanie utworzony automatycznie
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMoveToFolderModal(false)
                  setFolderMode('existing')
                  setNewSubfolderName('')
                  setSelectedTargetFolder(null)
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleMoveToFolder}
                disabled={
                  movingToFolder ||
                  (folderMode === 'existing' && selectedTargetFolder === null) ||
                  (folderMode === 'new' && !newSubfolderName.trim())
                }
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {movingToFolder
                  ? 'Przenoszenie...'
                  : folderMode === 'new'
                  ? '✨ Utwórz folder i przenieś'
                  : '📤 Przenieś pliki'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
