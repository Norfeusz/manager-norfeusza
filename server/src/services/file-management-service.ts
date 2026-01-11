import fs from 'fs-extra'
import path from 'path'
import { FileInfo, FolderType } from '../../../shared/src/types'

const BASE_PATH = 'D:\\DATA\\Norfeusz'

export class FileManagementService {
  // Pobierz listę plików w podfolderze projektu
  async getFilesInFolder(
    albumId: string,
    projectName: string,
    folderType: FolderType
  ): Promise<FileInfo[]> {
    const folderPath = path.join(BASE_PATH, albumId, projectName, folderType)

    if (!(await fs.pathExists(folderPath))) {
      return []
    }

    const items = await fs.readdir(folderPath, { withFileTypes: true })
    const files: FileInfo[] = []

    for (const item of items) {
      const itemPath = path.join(folderPath, item.name)
      const stats = await fs.stat(itemPath)

      files.push({
        name: item.name,
        path: itemPath,
        size: stats.size,
        extension: path.extname(item.name).toLowerCase(),
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        isDirectory: item.isDirectory(),
      })
    }

    return files.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Generuj nazwę pliku zgodnie z konwencją
  generateFileName(
    projectName: string,
    fileType: string,
    extension: string,
    existingFiles: string[]
  ): string {
    // Konwersja nazwy projektu na snake_case
    const normalizedProjectName = projectName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    // Znajdź najwyższy numer wersji dla tego typu pliku
    let maxVersion = 0
    const pattern = new RegExp(`^${normalizedProjectName}-${fileType}-(\\d+)\\${extension}$`)

    existingFiles.forEach((fileName) => {
      const match = fileName.match(pattern)
      if (match) {
        const version = parseInt(match[1], 10)
        if (version > maxVersion) {
          maxVersion = version
        }
      }
    })

    const nextVersion = (maxVersion + 1).toString().padStart(3, '0')
    return `${normalizedProjectName}-${fileType}-${nextVersion}${extension}`
  }

  // Uzyskaj typ pliku na podstawie folderu docelowego
  getFileTypeByFolder(folderType: FolderType, specificType?: string): string {
    const typeMap: Record<string, string> = {
      'Projekt FL': 'projekt_bit',
      'Projekt Reaper': 'projekt_nawijka',
      'Tekst': 'tekst',
      'Demo bit': 'bit_demo',
      'Demo nawijka': 'nawijka_demo',
      'Demo utwor': 'utwor_demo',
      'Gotowe': specificType ? `${specificType}_gotowy` : 'gotowy',
      'Pliki': 'plik',
    }

    return typeMap[folderType] || 'plik'
  }

  // Przenieś plik między folderami z automatyczną zmianą nazwy
  async moveFile(
    sourcePath: string,
    albumId: string,
    projectName: string,
    targetFolder: FolderType,
    specificType?: string
  ): Promise<{ newPath: string; newName: string }> {
    if (!(await fs.pathExists(sourcePath))) {
      throw new Error('Plik źródłowy nie istnieje')
    }

    const targetFolderPath = path.join(BASE_PATH, albumId, projectName, targetFolder)
    await fs.ensureDir(targetFolderPath)

    const extension = path.extname(sourcePath)
    const existingFiles = (await fs.readdir(targetFolderPath)).filter((f) =>
      f.endsWith(extension)
    )

    const fileType = this.getFileTypeByFolder(targetFolder, specificType)
    const newFileName = this.generateFileName(projectName, fileType, extension, existingFiles)
    const newPath = path.join(targetFolderPath, newFileName)

    await fs.move(sourcePath, newPath, { overwrite: false })

    return { newPath, newName: newFileName }
  }

  // Zmień nazwę pliku
  async renameFile(filePath: string, newName: string): Promise<string> {
    if (!(await fs.pathExists(filePath))) {
      throw new Error('Plik nie istnieje')
    }

    const dir = path.dirname(filePath)
    const newPath = path.join(dir, newName)

    if (await fs.pathExists(newPath)) {
      throw new Error('Plik o takiej nazwie już istnieje')
    }

    await fs.rename(filePath, newPath)
    return newPath
  }

  // Usuń plik
  async deleteFile(filePath: string): Promise<void> {
    if (!(await fs.pathExists(filePath))) {
      throw new Error('Plik nie istnieje')
    }

    await fs.remove(filePath)
  }

  // Upload pliku
  async uploadFile(
    file: Express.Multer.File,
    albumId: string,
    projectName: string,
    targetFolder: FolderType,
    specificType?: string
  ): Promise<{ path: string; name: string }> {
    const targetFolderPath = path.join(BASE_PATH, albumId, projectName, targetFolder)
    await fs.ensureDir(targetFolderPath)

    const extension = path.extname(file.originalname)
    const existingFiles = (await fs.readdir(targetFolderPath)).filter((f) =>
      f.endsWith(extension)
    )

    const fileType = this.getFileTypeByFolder(targetFolder, specificType)
    const newFileName = this.generateFileName(projectName, fileType, extension, existingFiles)
    const newPath = path.join(targetFolderPath, newFileName)

    await fs.move(file.path, newPath)

    return { path: newPath, name: newFileName }
  }

  // Otwórz plik w systemie Windows
  async openFileInSystem(filePath: string): Promise<void> {
    if (!(await fs.pathExists(filePath))) {
      throw new Error('Plik nie istnieje')
    }

    const { exec } = await import('child_process')
    const command = `start "" "${filePath}"`

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}

export const fileManagementService = new FileManagementService()
