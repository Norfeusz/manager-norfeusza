import type {
  Album,
  Project,
  CreateProjectRequest,
  CreateAlbumRequest,
  ApiResponse,
  AlbumCategory,
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

  async renameAlbum(albumId: string, newName: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/albums/${encodeURIComponent(albumId)}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    })
    return handleResponse(response)
  },

  async updateAlbumCategory(albumId: string, category: AlbumCategory): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/albums/${encodeURIComponent(albumId)}/category`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    })
    return handleResponse(response)
  },

  async updateAlbumOrder(albumId: string, order: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/albums/${encodeURIComponent(albumId)}/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })
    return handleResponse(response)
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

  async renameProject(albumId: string, projectName: string, newName: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects/${albumId}/${encodeURIComponent(projectName)}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    })
    return handleResponse<Project>(response)
  },

  async moveProject(albumId: string, projectName: string, targetAlbumId: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects/${albumId}/${encodeURIComponent(projectName)}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetAlbumId }),
    })
    return handleResponse<Project>(response)
  },

  async deleteProject(albumId: string, projectName: string, moveFilesToSortownia: boolean): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/projects/${albumId}/${encodeURIComponent(projectName)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moveFilesToSortownia }),
    })
    return handleResponse(response)
  },

  async assignNumberToProject(albumId: string, projectName: string, number: number): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects/${albumId}/${encodeURIComponent(projectName)}/assign-number`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    })
    return handleResponse<Project>(response)
  },

  async renumberProjects(
    albumId: string, 
    renumberingMap: Array<{ projectName: string; newNumber: number }>
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/projects/${albumId}/renumber`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renumberingMap }),
    })
    return handleResponse(response)
  },

  // Okładki
  async uploadAlbumCover(albumId: string, file: File): Promise<{ message: string; coverUrl: string }> {
    const formData = new FormData()
    formData.append('cover', file)

    const response = await fetch(`${API_BASE}/covers/albums/${albumId}/cover`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  async uploadProjectCover(albumId: string, projectName: string, file: File): Promise<{ message: string; coverUrl: string }> {
    const formData = new FormData()
    formData.append('cover', file)

    const response = await fetch(`${API_BASE}/covers/projects/${albumId}/${encodeURIComponent(projectName)}/cover`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  async deleteAlbumCover(albumId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/covers/albums/${albumId}/cover`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  async deleteProjectCover(albumId: string, projectName: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/covers/projects/${albumId}/${encodeURIComponent(projectName)}/cover`, {
      method: 'DELETE',
    })
    return handleResponse(response)
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

  async getAllProjectFiles(albumId: string, projectName: string): Promise<any[]> {
    const response = await fetch(
      `${API_BASE}/files/${albumId}/${encodeURIComponent(projectName)}/all-files`
    )
    return handleResponse<any[]>(response)
  },

  async getAllAlbumFiles(albumId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/files/album/${albumId}/all-files`)
    return handleResponse<any[]>(response)
  },

  async getAllFiles(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/files/all-files`)
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

  // Sortownia
  async getSortowniaFiles(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/sortownia`)
    return handleResponse<any[]>(response)
  },

  async uploadToSortownia(file: File): Promise<{ path: string; name: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE}/sortownia/upload`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  async moveFromSortownia(
    fileName: string,
    albumId: string,
    projectName: string,
    targetFolder: string,
    fileType?: string,
    customName?: string
  ): Promise<{ newPath: string; newName: string }> {
    const response = await fetch(`${API_BASE}/sortownia/move-to-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, albumId, projectName, targetFolder, fileType, customName }),
    })
    return handleResponse(response)
  },

  async deleteSortowniaFile(filePath: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/sortownia`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    })
    return handleResponse(response)
  },

  async openSortowniaFile(filePath: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/sortownia/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    })
    return handleResponse(response)
  },

  async arrangeVersions(
    albumId: string,
    projectName: string,
    folderType: string
  ): Promise<{ message: string; filesRenamed: number }> {
    const response = await fetch(`${API_BASE}/files/arrange-versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumId, projectName, folderType }),
    })
    return handleResponse(response)
  },

  // Proste foldery (Bity, Teksty, Pliki, Sortownia)
  async getSimpleFolderFiles(folderPath: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/simple-folders/${encodeURIComponent(folderPath)}/files`)
    return handleResponse(response)
  },

  // Archiwum ZIP
  async listZipArchives(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/files/zip-archive/list`)
    return handleResponse(response)
  },

  async addFilesToZip(
    filePaths: string[],
    zipName: string,
    createNew: boolean
  ): Promise<{ zipPath: string; filesAdded: number }> {
    const response = await fetch(`${API_BASE}/files/zip-archive/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePaths, zipName, createNew }),
    })
    return handleResponse(response)
  },

  // Text Manager - Zarządzanie tekstami
  async getTextFiles(relativePath: string = ''): Promise<any[]> {
    const response = await fetch(`${API_BASE}/text-manager/files?path=${encodeURIComponent(relativePath)}`)
    return handleResponse(response)
  },

  async createTextFolder(relativePath: string, folderName: string): Promise<{ message: string; path: string }> {
    const response = await fetch(`${API_BASE}/text-manager/create-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath, folderName }),
    })
    return handleResponse(response)
  },

  async renameTextFile(relativePath: string, newName: string): Promise<{ message: string; newPath: string }> {
    const response = await fetch(`${API_BASE}/text-manager/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath, newName }),
    })
    return handleResponse(response)
  },

  async deleteTextFiles(relativePaths: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await fetch(`${API_BASE}/text-manager/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePaths }),
    })
    return handleResponse(response)
  },

  async moveTextsToProject(
    relativePaths: string[],
    albumId: string,
    projectName: string
  ): Promise<{ message: string; movedCount: number; targetPath: string }> {
    const response = await fetch(`${API_BASE}/text-manager/move-to-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePaths, albumId, projectName }),
    })
    return handleResponse(response)
  },

  async moveTextsToFolder(
    relativePaths: string[],
    targetRelativePath: string
  ): Promise<{ message: string; movedCount: number }> {
    const response = await fetch(`${API_BASE}/text-manager/move-to-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePaths, targetRelativePath }),
    })
    return handleResponse(response)
  },

  async getTextManagerAlbums(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/text-manager/albums`)
    return handleResponse(response)
  },

  async getTextManagerProjects(albumId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/text-manager/albums/${encodeURIComponent(albumId)}/projects`)
    return handleResponse(response)
  },

  async openTextFile(relativePath: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/text-manager/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath }),
    })
    return handleResponse(response)
  },
}

