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

  // Pliki
  async getFilesInFolder(albumId: string, projectName: string, folderType: string): Promise<any[]> {
    const response = await fetch(
      `${API_BASE}/files/${albumId}/${encodeURIComponent(projectName)}/files/${folderType}`
    )
    return handleResponse<any[]>(response)
  },

  async moveFile(
    albumId: string,
    projectName: string,
    sourcePath: string,
    targetFolder: string,
    fileType?: string
  ): Promise<{ newPath: string; newName: string }> {
    const response = await fetch(`${API_BASE}/files/${albumId}/${encodeURIComponent(projectName)}/files/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath, targetFolder, fileType }),
    })
    return handleResponse(response)
  },

  async renameFile(albumId: string, projectName: string, filePath: string, newName: string): Promise<{ newPath: string }> {
    const response = await fetch(`${API_BASE}/files/${albumId}/${encodeURIComponent(projectName)}/files/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, newName }),
    })
    return handleResponse(response)
  },

  async deleteFile(albumId: string, projectName: string, filePath: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/files/${albumId}/${encodeURIComponent(projectName)}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    })
    return handleResponse(response)
  },

  async uploadFile(
    albumId: string,
    projectName: string,
    file: File,
    targetFolder: string,
    fileType?: string
  ): Promise<{ path: string; name: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('targetFolder', targetFolder)
    if (fileType) {
      formData.append('fileType', fileType)
    }

    const response = await fetch(`${API_BASE}/files/${albumId}/${encodeURIComponent(projectName)}/files/upload`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  async openFile(albumId: string, projectName: string, filePath: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/files/${albumId}/${encodeURIComponent(projectName)}/files/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    })
    return handleResponse(response)
  },
}
