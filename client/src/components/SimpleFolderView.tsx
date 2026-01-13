import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

interface FileItem {
  name: string
  path: string
  size: number
  modifiedAt: string
  isDirectory: boolean
}

const folderConfig: Record<string, { title: string; icon: string; path: string }> = {
  bity: { title: 'Bity', icon: '🎵', path: 'Bity' },
  teksty: { title: 'Teksty', icon: '📝', path: 'Teksty' },
  inne: { title: 'Pliki', icon: '📁', path: 'Pliki' },
  sortownia: { title: 'Sortownia', icon: '📦', path: 'Sortownia' }
}

export default function SimpleFolderView() {
  const { folderType } = useParams<{ folderType: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = folderType ? folderConfig[folderType] : null
  const subPath = searchParams.get('path') || ''

  useEffect(() => {
    if (config) {
      loadFiles()
    }
  }, [folderType, subPath])

  async function loadFiles() {
    try {
      setLoading(true)
      const fullPath = subPath ? `${config!.path}/${subPath}` : config!.path
      const response = await api.getSimpleFolderFiles(fullPath)
      setFiles(response)
      setError(null)
    } catch (err: any) {
      setError(err.message)
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

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center text-red-600">Nieznany folder</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center">Ładowanie plików...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center text-red-600">Błąd: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-5xl">{config.icon}</span>
            {config.title}
            {subPath && <span className="text-2xl text-gray-500">/ {subPath}</span>}
          </h1>
        </div>

        {/* Lista plików */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {files.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Folder jest pusty
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => file.isDirectory && handleFolderClick(file.name)}
                  className={`p-4 transition flex items-center justify-between ${
                    file.isDirectory ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-3xl">
                      {file.isDirectory ? '📁' : '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">
                        {file.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(file.modifiedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 ml-4">
                    {!file.isDirectory && formatFileSize(file.size)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
