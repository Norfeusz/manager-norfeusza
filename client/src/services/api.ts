import type {
  Album,
  Project,
  CreateProjectRequest,
  CreateAlbumRequest,
  ApiResponse,
} from '../../../shared/src/types'

const API_BASE = '/api'

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Wystąpił błąd')
  }

  return data.data as T
}

export const api = {
  // Albumy
  async getAlbums(): Promise<Album[]> {
    const response = await fetch(`${API_BASE}/albums`)
    return handleResponse<Album[]>(response)
  },

  async createAlbum(request: CreateAlbumRequest): Promise<Album> {
    const response = await fetch(`${API_BASE}/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return handleResponse<Album>(response)
  },

  // Projekty
  async getProjectsByAlbum(albumId: string): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/albums/${albumId}/projects`)
    return handleResponse<Project[]>(response)
  },

  async createProject(request: CreateProjectRequest): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return handleResponse<Project>(response)
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/health`)
    return response.json()
  },
}
