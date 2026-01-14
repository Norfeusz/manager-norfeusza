import { useState } from 'react'
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
  folderType?: string
  projectName?: string
  albumId?: string
}

interface AllFilesModalProps {
  show: boolean
  onClose: () => void
  files: FileInfo[]
  title: string
  level: 'project' | 'album' | 'all'
}

export default function AllFilesModal({ show, onClose, files, title, level }: AllFilesModalProps) {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<'folder' | 'date' | 'size' | 'project' | 'album'>('date')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [showZipModal, setShowZipModal] = useState(false)
  const [zipArchives, setZipArchives] = useState<any[]>([])
  const [zipMode, setZipMode] = useState<'new' | 'existing' | null>(null)
  const [newZipName, setNewZipName] = useState('')
  const [selectedZip, setSelectedZip] = useState('')
  const [loadingZip, setLoadingZip] = useState(false)

  if (!show) return null

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

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pl-PL')
  }

  function getSortedFiles(): FileInfo[] {
    const sorted = [...files]
    
    switch (sortBy) {
      case 'folder':
        return sorted.sort((a, b) => {
          const folderCompare = (a.folderType || '').localeCompare(b.folderType || '')
          if (folderCompare !== 0) return folderCompare
          return a.name.localeCompare(b.name)
        })
      case 'project':
        return sorted.sort((a, b) => {
          const projectCompare = (a.projectName || '').localeCompare(b.projectName || '')
          if (projectCompare !== 0) return projectCompare
          return a.name.localeCompare(b.name)
        })
      case 'album':
        return sorted.sort((a, b) => {
          const albumCompare = (a.albumId || '').localeCompare(b.albumId || '')
          if (albumCompare !== 0) return albumCompare
          const projectCompare = (a.projectName || '').localeCompare(b.projectName || '')
          if (projectCompare !== 0) return projectCompare
          return a.name.localeCompare(b.name)
        })
      case 'date':
        return sorted.sort((a, b) => 
          new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
        )
      case 'size':
        return sorted.sort((a, b) => b.size - a.size)
      default:
        return sorted
    }
  }

  async function openZipModal() {
    try {
      setLoadingZip(true)
      const archives = await api.listZipArchives()
      setZipArchives(archives)
      setShowZipModal(true)
      setZipMode(null)
      setNewZipName('')
      setSelectedZip('')
    } catch (error: any) {
      alert(`Błąd: ${error.message}`)
    } finally {
      setLoadingZip(false)
    }
  }

  async function addToZipArchive() {
    if (!zipMode) {
      alert('Wybierz opcję: nowy lub istniejący ZIP')
      return
    }

    if (zipMode === 'new' && !newZipName.trim()) {
      alert('Podaj nazwę nowego archiwum')
      return
    }

    if (zipMode === 'existing' && !selectedZip) {
      alert('Wybierz archiwum z listy')
      return
    }

    try {
      setLoadingZip(true)
      const filePaths = Array.from(selectedFiles)
      const zipName = zipMode === 'new' ? newZipName : selectedZip

      const result = await api.addFilesToZip(filePaths, zipName, zipMode === 'new')
      
      alert(`✅ Pomyślnie dodano ${result.filesAdded} plików do archiwum`)
      setShowZipModal(false)
      setSelectedFiles(new Set())
      setMultiSelectMode(false)
    } catch (error: any) {
      alert(`❌ Błąd: ${error.message}`)
    } finally {
      setLoadingZip(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 50 }}>
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <p className="text-gray-600">Znaleziono {files.length} plików</p>
                {multiSelectMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Zaznaczono: {selectedFiles.size}</span>
                    <button
                      onClick={selectAllFiles}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Zaznacz wszystkie
                    </button>
                    <button
                      onClick={deselectAllFiles}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Odznacz wszystkie
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setMultiSelectMode(!multiSelectMode)
                    if (multiSelectMode) {
                      setSelectedFiles(new Set())
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    multiSelectMode
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {multiSelectMode ? '✓ Zaznaczanie aktywne' : '☑ Zaznacz wiele'}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sortuj po:</span>
                  <div className="flex gap-2">
                    {level !== 'project' && (
                      <>
                        {level === 'all' && (
                          <button
                            onClick={() => setSortBy('album')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                              sortBy === 'album'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            💿 Album
                          </button>
                        )}
                        <button
                          onClick={() => setSortBy('project')}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                            sortBy === 'project'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          🎵 Projekt
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSortBy('folder')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        sortBy === 'folder'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📁 Folder
                    </button>
                    <button
                      onClick={() => setSortBy('date')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        sortBy === 'date'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📅 Data
                    </button>
                    <button
                      onClick={() => setSortBy('size')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        sortBy === 'size'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      💾 Rozmiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {files.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-xl">Brak plików</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getSortedFiles().map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg transition ${
                      selectedFiles.has(file.path)
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {multiSelectMode && (
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.path)}
                          onChange={() => toggleFileSelection(file.path)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">
                          {file.extension.replace('.', '').toUpperCase() || '📄'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{file.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          {file.albumId && <span className="font-medium text-purple-600">💿 {file.albumId}</span>}
                          {file.projectName && <span className="font-medium text-green-600">🎵 {file.projectName}</span>}
                          {file.folderType && <span className="font-medium text-blue-600">📁 {file.folderType}</span>}
                          <span>{formatFileSize(file.size)}</span>
                          <span>{formatDate(file.modifiedAt)}</span>
                        </div>
                      </div>
                    </div>
                    {!multiSelectMode && file.albumId && file.projectName && file.folderType && (
                      <button
                        onClick={() => navigate(`/folder/${file.albumId}/${file.projectName}/${encodeURIComponent(file.folderType || '')}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                      >
                        Otwórz folder
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            {multiSelectMode && selectedFiles.size > 0 && (
              <div className="flex gap-2 mr-auto">
                <button
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  onClick={openZipModal}
                  disabled={loadingZip}
                >
                  📦 Przenieś do ZIP składu ({selectedFiles.size})
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>

      {/* Modal ZIP składu */}
      {showZipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  📦 Przenieś do ZIP składu
                </h2>
                <button
                  onClick={() => setShowZipModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Wybrano {selectedFiles.size} plików do zapakowania
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <button
                    onClick={() => setZipMode('new')}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      zipMode === 'new'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        zipMode === 'new' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                      }`}>
                        {zipMode === 'new' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">📝 Utwórz nowy ZIP</h3>
                        <p className="text-sm text-gray-600">Stwórz nowe archiwum z wybranych plików</p>
                      </div>
                    </div>
                  </button>

                  {zipMode === 'new' && (
                    <div className="ml-9 mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nazwa archiwum:
                      </label>
                      <input
                        type="text"
                        value={newZipName}
                        onChange={(e) => setNewZipName(e.target.value)}
                        placeholder="np. moje_archiwum"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Rozszerzenie .zip zostanie dodane automatycznie
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setZipMode('existing')}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      zipMode === 'existing'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        zipMode === 'existing' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                      }`}>
                        {zipMode === 'existing' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">➕ Dodaj do istniejącego ZIP</h3>
                        <p className="text-sm text-gray-600">Dodaj pliki do już utworzonego archiwum</p>
                      </div>
                    </div>
                  </button>

                  {zipMode === 'existing' && (
                    <div className="ml-9 mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wybierz archiwum:
                      </label>
                      {zipArchives.length === 0 ? (
                        <p className="text-gray-500 text-sm">Brak istniejących archiwów</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {zipArchives.map((zip, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedZip(zip.name)}
                              className={`w-full p-3 rounded-lg border text-left transition ${
                                selectedZip === zip.name
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-400'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-gray-800">{zip.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(zip.size)} • {formatDate(zip.modifiedAt)}
                                  </p>
                                </div>
                                {selectedZip === zip.name && (
                                  <span className="text-blue-600">✓</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowZipModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Anuluj
              </button>
              <button
                onClick={addToZipArchive}
                disabled={loadingZip || !zipMode}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingZip ? 'Pakowanie...' : '📦 Zapakuj pliki'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
