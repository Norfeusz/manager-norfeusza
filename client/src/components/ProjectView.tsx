import { useParams, useNavigate } from 'react-router-dom'

export default function ProjectView() {
  const { albumId, projectName } = useParams<{ albumId: string; projectName: string }>()
  const navigate = useNavigate()

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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/album/${albumId}`)}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Powrót do albumu
          </button>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          {projectName}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folders.map((folder) => (
            <div
              key={folder.name}
              className={`${folder.color} rounded-lg shadow-md hover:shadow-xl transition cursor-pointer p-8 border-2 border-transparent hover:${folder.borderColor}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="text-6xl mb-4">{folder.icon}</div>
                <h3 className={`text-xl font-bold ${folder.textColor}`}>
                  {folder.name}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Kliknij aby otworzyć
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Informacje</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Album:</strong> {albumId}</p>
            <p><strong>Projekt:</strong> {projectName}</p>
            <p className="text-sm mt-4 text-gray-500">
              Funkcjonalność podfolderów zostanie zaimplementowana w kolejnych fazach
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
