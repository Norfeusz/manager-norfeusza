import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Project, Album } from '../../../shared/src/types'
import { api } from '../services/api'
import AllFilesModal from './AllFilesModal'

export default function ProjectList() {
  const { albumId } = useParams<{ albumId: string }>()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const [useNumbering, setUseNumbering] = useState(true)
  const [numberingMode, setNumberingMode] = useState<'auto' | 'manual'>('auto')
  const [manualNumber, setManualNumber] = useState('')
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null)
  
  // Tryb organizacji
  const [organizingMode, setOrganizingMode] = useState(false)
  const [tempProjects, setTempProjects] = useState<Project[]>([])
  
  // Akcje zarządzania projektami
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAssignNumberModal, setShowAssignNumberModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [moveTargetAlbum, setMoveTargetAlbum] = useState('')
  const [moveFilesToSortownia, setMoveFilesToSortownia] = useState(true)
  const [assignNumberValue, setAssignNumberValue] = useState('')
  const [actionInProgress, setActionInProgress] = useState(false)
  
  // Zmiana nazwy albumu
  const [showRenameAlbumModal, setShowRenameAlbumModal] = useState(false)
  const [renameAlbumValue, setRenameAlbumValue] = useState('')
  
  // Wszystkie pliki w albumie
  const [showAllFilesModal, setShowAllFilesModal] = useState(false)
  const [allFiles, setAllFiles] = useState<any[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  useEffect(() => {
    if (albumId) {
      loadProjects()
      loadAlbums()
    }
  }, [albumId])

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

  async function loadProjects() {
    try {
      setLoading(true)
      const data = await api.getProjectsByAlbum(albumId!)
      
      // Sortowanie: najpierw projekty z numeracją (01, 02, 03...), potem alfabetycznie reszta
      const sorted = data.sort((a, b) => {
        const numA = extractNumber(a.name)
        const numB = extractNumber(b.name)

        // Oba mają numery - sortuj według numerów
        if (numA !== null && numB !== null) return numA - numB
        
        // Tylko a ma numer - a na początku
        if (numA !== null) return -1
        
        // Tylko b ma numer - b na początku
        if (numB !== null) return 1
        
        // Żaden nie ma numeru - sortuj alfabetycznie
        return a.name.localeCompare(b.name)
      })
      
      setProjects(sorted)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function extractNumber(projectName: string): number | null {
    const match = projectName.match(/^(\d{2})\s*-\s*/)
    return match ? parseInt(match[1], 10) : null
  }

  async function loadAlbums() {
    try {
      const data = await api.getAlbums()
      setAlbums(data.filter(a => a.id !== albumId)) // Wyklucz aktualny album
    } catch (err: any) {
      console.error('Error loading albums:', err)
    }
  }

  function openRenameModal(project: Project) {
    setSelectedProject(project)
    // Wyciągnij nazwę bez numeru jeśli istnieje
    const nameWithoutNumber = project.name.replace(/^\d{2}\s*-\s*/, '')
    setRenameValue(nameWithoutNumber)
    setShowRenameModal(true)
  }

  function openMoveModal(project: Project) {
    setSelectedProject(project)
    setMoveTargetAlbum('')
    setShowMoveModal(true)
  }

  function openDeleteModal(project: Project) {
    setSelectedProject(project)
    setMoveFilesToSortownia(true)
    setShowDeleteModal(true)
  }

  async function loadAllFiles() {
    if (!albumId) return
    try {
      setLoadingFiles(true)
      const files = await api.getAllAlbumFiles(albumId)
      setAllFiles(files)
      setShowAllFilesModal(true)
    } catch (error: any) {
      alert(`Błąd: ${error.message}`)
    } finally {
      setLoadingFiles(false)
    }
  }

  async function handleRenameProject() {
    if (!selectedProject || !renameValue.trim()) return

    try {
      setActionInProgress(true)
      await api.renameProject(albumId!, selectedProject.name, renameValue.trim())
      setShowRenameModal(false)
      setSelectedProject(null)
      setRenameValue('')
      loadProjects()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  async function handleMoveProject() {
    if (!selectedProject || !moveTargetAlbum) return

    try {
      setActionInProgress(true)
      await api.moveProject(albumId!, selectedProject.name, moveTargetAlbum)
      setShowMoveModal(false)
      setSelectedProject(null)
      setMoveTargetAlbum('')
      loadProjects()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  async function handleDeleteProject() {
    if (!selectedProject) return

    try {
      setActionInProgress(true)
      await api.deleteProject(albumId!, selectedProject.name, moveFilesToSortownia)
      setShowDeleteModal(false)
      setSelectedProject(null)
      loadProjects()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  function openAssignNumberModal(project: Project) {
    setSelectedProject(project)
    setAssignNumberValue('')
    setShowAssignNumberModal(true)
  }

  async function handleAssignNumber() {
    if (!selectedProject || !assignNumberValue) return

    const number = parseInt(assignNumberValue)
    if (isNaN(number) || number < 1) {
      alert('Podaj prawidłowy numer (1 lub większy)')
      return
    }

    try {
      setActionInProgress(true)
      await api.assignNumberToProject(albumId!, selectedProject.name, number)
      setShowAssignNumberModal(false)
      setSelectedProject(null)
      setAssignNumberValue('')
      loadProjects()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  async function handleRenameAlbum() {
    if (!renameAlbumValue.trim()) return

    try {
      setActionInProgress(true)
      await api.renameAlbum(albumId!, renameAlbumValue.trim())
      setShowRenameAlbumModal(false)
      setRenameAlbumValue('')
      // Przekieruj do listy albumów po zmianie nazwy
      navigate('/')
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  // Funkcje trybu organizacji
  function startOrganizing() {
    setOrganizingMode(true)
    setTempProjects([...projects])
  }

  function cancelOrganizing() {
    setOrganizingMode(false)
    setTempProjects([])
  }

  function moveProjectUp(index: number) {
    if (index === 0) return
    const newProjects = [...tempProjects]
    ;[newProjects[index - 1], newProjects[index]] = [newProjects[index], newProjects[index - 1]]
    setTempProjects(newProjects)
  }

  function moveProjectDown(index: number) {
    if (index === tempProjects.length - 1) return
    const newProjects = [...tempProjects]
    ;[newProjects[index], newProjects[index + 1]] = [newProjects[index + 1], newProjects[index]]
    setTempProjects(newProjects)
  }

  async function saveOrganization() {
    try {
      setActionInProgress(true)
      
      // Przygotuj mapę tylko dla projektów Z numeracją
      const renumberingMap = tempProjects
        .map((project, index) => {
          const hasNumber = extractNumber(project.name) !== null
          if (!hasNumber) return null
          
          return {
            projectName: project.name,
            newNumber: index + 1
          }
        })
        .filter((item): item is { projectName: string; newNumber: number } => item !== null)

      if (renumberingMap.length > 0) {
        await api.renumberProjects(albumId!, renumberingMap)
      }
      
      setOrganizingMode(false)
      setTempProjects([])
      await loadProjects()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return

    try {
      setCreating(true)
      await api.createProject({
        name: newProjectName.trim(),
        albumId: albumId,
        useNumbering,
        numberingMode,
        projectNumber: numberingMode === 'manual' && manualNumber ? parseInt(manualNumber) : undefined,
      })
      setNewProjectName('')
      setManualNumber('')
      setShowCreateModal(false)
      loadProjects()
    } catch (err: any) {
      alert(`Błąd: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Ładowanie projektów...</div>
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
            onClick={() => navigate('/')}
            className="text-white hover:text-gray-200 font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-lg transition"
          >
            ← Powrót do albumów
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Album: {albumId}
          </h1>
          <div className="flex gap-3">
            {!organizingMode ? (
              <>
                <button
                  onClick={loadAllFiles}
                  disabled={loadingFiles}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loadingFiles ? 'Ładowanie...' : '📋 Wszystkie pliki'}
                </button>
                <button
                  onClick={startOrganizing}
                  disabled={projects.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  🔢 Organizuj
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  + Nowy Projekt
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setRenameAlbumValue(albumId || '')
                    setShowRenameAlbumModal(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  ✏️ Zmień nazwę albumu
                </button>
                <button
                  onClick={cancelOrganizing}
                  disabled={actionInProgress}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveOrganization}
                  disabled={actionInProgress}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  {actionInProgress ? 'Zapisywanie...' : 'Zapisz kolejność'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {(organizingMode ? tempProjects.length === 0 : projects.length === 0) ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-xl">Brak projektów w tym albumie</p>
              <p className="mt-2">Utwórz pierwszy projekt, aby rozpocząć</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {(organizingMode ? tempProjects : projects).map((project, index) => (
                <div
                  key={project.id}
                  className={`p-6 transition flex items-center justify-between ${
                    organizingMode ? 'bg-blue-50' : 'hover:bg-gray-50 group'
                  }`}
                >
                  {organizingMode ? (
                    <>
                      {/* Tryb organizacji - przyciski góra/dół */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveProjectUp(index)}
                            disabled={index === 0}
                            className="p-1 hover:bg-blue-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                          >
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveProjectDown(index)}
                            disabled={index === tempProjects.length - 1}
                            className="p-1 hover:bg-blue-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                          >
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full font-bold text-blue-700 text-xl">
                          {(index + 1).toString().padStart(2, '0')}
                        </div>

                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {project.name.replace(/^\d{2}\s*-\s*/, '')}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Nowy numer: {(index + 1).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Normalny tryb */}
                      <Link 
                        to={`/project/${albumId}/${project.name}`}
                        className="flex items-center gap-4 flex-1 cursor-pointer group/project-item"
                      >
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {project.coverImage ? (
                            <img 
                              src={project.coverImage} 
                              alt={project.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-green-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              </svg>
                            </div>
                          )}
                          
                          {/* Przycisk dodaj okładkę - tylko dla projektów z własną okładką */}
                          {project.hasOwnCover && (
                            <label 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover/project-item:opacity-100 transition cursor-pointer"
                            >
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                      await api.uploadProjectCover(albumId!, project.name, file)
                                      loadProjects()
                                    } catch (err: any) {
                                      alert(`Błąd: ${err.message}`)
                                    }
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Utworzono: {new Date(project.createdAt).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                      </Link>
                  
                  <div className="flex items-center gap-2">
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
                            openRenameModal(project)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-gray-700">Zmień nazwę</span>
                        </button>
                        
                        {/* Opcja "Nadaj numer" tylko dla projektów bez numeru */}
                        {extractNumber(project.name) === null && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openAssignNumberModal(project)
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                          >
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span className="text-gray-700">Nadaj numer</span>
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openMoveModal(project)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                        >
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span className="text-gray-700">Przenieś do albumu</span>
                        </button>
                        <div className="border-t border-gray-200"></div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteModal(project)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 transition"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-red-600 font-medium">Usuń projekt</span>
                        </button>
                      </div>
                    </div>

                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal tworzenia projektu */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Nowy Projekt</h2>
            
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              placeholder="Nazwa projektu (utworu)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />

            {/* Checkbox numeracji */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useNumbering}
                  onChange={(e) => setUseNumbering(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-700 font-medium">Numeracja (01, 02, 03...)</span>
              </label>
            </div>

            {/* Opcje numeracji */}
            {useNumbering && (
              <div className="mb-4 pl-6 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={numberingMode === 'auto'}
                    onChange={() => setNumberingMode('auto')}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-gray-700">Kolejny numer (automatycznie)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={numberingMode === 'manual'}
                    onChange={() => setNumberingMode('manual')}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-gray-700">Nadaj numer ręcznie</span>
                </label>

                {numberingMode === 'manual' && (
                  <input
                    type="number"
                    min="1"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    placeholder="Wpisz numer (np. 5)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg ml-6 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}

                {numberingMode === 'manual' && (
                  <p className="text-xs text-gray-500 ml-6">
                    Jeśli projekt z tym numerem istnieje, wszystkie kolejne zostaną przesunięte
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {creating ? 'Tworzenie...' : 'Utwórz'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewProjectName('')
                  setManualNumber('')
                  setUseNumbering(true)
                  setNumberingMode('auto')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal zmiany nazwy */}
      {showRenameModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Zmień nazwę projektu</h2>
            <p className="text-gray-600 mb-4">
              Obecna nazwa: <strong>{selectedProject.name}</strong>
            </p>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRenameProject()}
              placeholder="Nowa nazwa"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 mb-4">
              Numeracja zostanie zachowana (jeśli istnieje)
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRenameProject}
                disabled={actionInProgress || !renameValue.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {actionInProgress ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setSelectedProject(null)
                  setRenameValue('')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal przenoszenia */}
      {showMoveModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Przenieś projekt do albumu</h2>
            <p className="text-gray-600 mb-4">
              Projekt: <strong>{selectedProject.name}</strong>
            </p>
            <label className="block mb-2 font-semibold">Docelowy album:</label>
            <select
              value={moveTargetAlbum}
              onChange={(e) => setMoveTargetAlbum(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Wybierz album</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleMoveProject}
                disabled={actionInProgress || !moveTargetAlbum}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {actionInProgress ? 'Przenoszenie...' : 'Przenieś'}
              </button>
              <button
                onClick={() => {
                  setShowMoveModal(false)
                  setSelectedProject(null)
                  setMoveTargetAlbum('')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal usuwania */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Usuń projekt</h2>
            <p className="text-gray-800 mb-4">
              Czy na pewno chcesz usunąć projekt:<br />
              <strong className="text-lg">{selectedProject.name}</strong>
            </p>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={moveFilesToSortownia}
                  onChange={(e) => setMoveFilesToSortownia(e.target.checked)}
                  className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div>
                  <span className="text-gray-700 font-medium">Przenieś pliki do sortowni</span>
                  <p className="text-sm text-gray-600 mt-1">
                    {moveFilesToSortownia 
                      ? 'Wszystkie pliki zostaną przeniesione do sortowni przed usunięciem projektu' 
                      : '⚠️ Wszystkie pliki zostaną trwale usunięte razem z projektem'}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteProject}
                disabled={actionInProgress}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {actionInProgress ? 'Usuwanie...' : 'Usuń projekt'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedProject(null)
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nadawania numeru */}
      {showAssignNumberModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Nadaj numer</h2>
            <p className="text-gray-600 mb-4">
              Projekt: <strong>{selectedProject.name}</strong>
            </p>
            
            <label className="block mb-2 font-semibold text-gray-700">Numer projektu:</label>
            <input
              type="number"
              min="1"
              value={assignNumberValue}
              onChange={(e) => setAssignNumberValue(e.target.value)}
              placeholder="Wpisz numer (np. 5)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            
            <p className="text-xs text-gray-500 mb-6">
              Jeśli projekt z tym numerem już istnieje, wszystkie kolejne zostaną przesunięte
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleAssignNumber}
                disabled={actionInProgress || !assignNumberValue}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {actionInProgress ? 'Nadawanie...' : 'Nadaj numer'}
              </button>
              <button
                onClick={() => {
                  setShowAssignNumberModal(false)
                  setSelectedProject(null)
                  setAssignNumberValue('')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal zmiany nazwy albumu */}
      {showRenameAlbumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Zmień nazwę albumu</h2>
            <p className="text-gray-600 mb-4">
              Aktualny album: <strong>{albumId}</strong>
            </p>
            
            <label className="block mb-2 font-semibold text-gray-700">Nowa nazwa:</label>
            <input
              type="text"
              value={renameAlbumValue}
              onChange={(e) => setRenameAlbumValue(e.target.value)}
              placeholder="Wpisz nową nazwę albumu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleRenameAlbum}
                disabled={actionInProgress || !renameAlbumValue.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {actionInProgress ? 'Zmieniam...' : 'Zmień nazwę'}
              </button>
              <button
                onClick={() => {
                  setShowRenameAlbumModal(false)
                  setRenameAlbumValue('')
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
        title={`Wszystkie pliki w albumie "${albumId}"`}
        level="album"
      />
      </div>
    </div>
  )
}
