import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Project } from '../../../shared/src/types'
import { api } from '../services/api'

export default function ProjectList() {
  const { albumId } = useParams<{ albumId: string }>()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const [useNumbering, setUseNumbering] = useState(true)
  const [numberingMode, setNumberingMode] = useState<'auto' | 'manual'>('auto')
  const [manualNumber, setManualNumber] = useState('')

  useEffect(() => {
    if (albumId) {
      loadProjects()
    }
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
          <h1 className="text-4xl font-bold text-gray-800">
            Album: {albumId}
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + Nowy Projekt
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-xl">Brak projektów w tym albumie</p>
              <p className="mt-2">Utwórz pierwszy projekt, aby rozpocząć</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${albumId}/${project.name}`)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
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
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Utworzono: {new Date(project.createdAt).toLocaleDateString('pl-PL')}
                      </p>
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
    </div>
  )
}
