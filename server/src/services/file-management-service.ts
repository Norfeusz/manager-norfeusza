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

  // SORTOWNIA - Pobierz pliki z sortowni
  async getSortowniaFiles(): Promise<FileInfo[]> {
    const sortowniaPath = path.join(BASE_PATH, 'Sortownia')
    
    if (!(await fs.pathExists(sortowniaPath))) {
      await fs.ensureDir(sortowniaPath)
      return []
    }

    const items = await fs.readdir(sortowniaPath, { withFileTypes: true })
    const files: FileInfo[] = []

    for (const item of items) {
      const itemPath = path.join(sortowniaPath, item.name)
      const stats = await fs.stat(itemPath)

      files.push({
        name: item.name,
        path: itemPath,
        size: item.isDirectory() ? 0 : stats.size,
        extension: item.isDirectory() ? '' : path.extname(item.name).toLowerCase(),
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        isDirectory: item.isDirectory(),
      })
    }

    // Sortuj: foldery najpierw, potem pliki, alfabetycznie
    return files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
  }

  // SORTOWNIA - Przenieś plik z sortowni do projektu
  async moveFromSortownia(
    fileName: string,
    albumId: string,
    projectName: string,
    targetFolder: FolderType,
    specificType?: string,
    customName?: string
  ): Promise<{ newPath: string; newName: string }> {
    const sourcePath = path.join(BASE_PATH, 'Sortownia', fileName)

    if (!(await fs.pathExists(sourcePath))) {
      throw new Error('Plik nie istnieje w sortowni')
    }

    const targetFolderPath = path.join(BASE_PATH, albumId, projectName, targetFolder)
    await fs.ensureDir(targetFolderPath)

    const extension = path.extname(sourcePath)
    let newFileName: string
    
    if (customName) {
      // Użyj niestandardowej nazwy (dodaj rozszerzenie jeśli nie ma)
      newFileName = customName.endsWith(extension) ? customName : `${customName}${extension}`
      
      // Sprawdź czy plik o takiej nazwie już istnieje
      const targetPath = path.join(targetFolderPath, newFileName)
      if (await fs.pathExists(targetPath)) {
        throw new Error(`Plik o nazwie "${newFileName}" już istnieje w tym folderze`)
      }
    } else {
      // Automatyczna numeracja
      const existingFiles = (await fs.readdir(targetFolderPath)).filter((f) =>
        f.endsWith(extension)
      )
      const fileType = this.getFileTypeByFolder(targetFolder, specificType)
      newFileName = this.generateFileName(projectName, fileType, extension, existingFiles)
    }
    
    const newPath = path.join(targetFolderPath, newFileName)
    await fs.move(sourcePath, newPath, { overwrite: false })

    return { newPath, newName: newFileName }
  }

  // SORTOWNIA - Upload pliku do sortowni
  async uploadToSortownia(file: Express.Multer.File): Promise<{ path: string; name: string }> {
    const sortowniaPath = path.join(BASE_PATH, 'Sortownia')
    await fs.ensureDir(sortowniaPath)

    const fileName = file.originalname
    const filePath = path.join(sortowniaPath, fileName)

    // Jeśli plik o takiej nazwie już istnieje, dodaj timestamp
    let finalPath = filePath
    if (await fs.pathExists(filePath)) {
      const timestamp = Date.now()
      const ext = path.extname(fileName)
      const nameWithoutExt = path.basename(fileName, ext)
      const newFileName = `${nameWithoutExt}_${timestamp}${ext}`
      finalPath = path.join(sortowniaPath, newFileName)
    }

    await fs.move(file.path, finalPath)

    return { path: finalPath, name: path.basename(finalPath) }
  }

  // SZEREGOWANIE WERSJI - sortuj pliki według daty i przenumeruj
  async arrangeVersions(
    albumId: string,
    projectName: string,
    folderType: string
  ): Promise<{ message: string; filesRenamed: number }> {
    const folderPath = path.join(BASE_PATH, albumId, projectName, folderType)

    if (!(await fs.pathExists(folderPath))) {
      throw new Error('Folder nie istnieje')
    }

    // Pobierz wszystkie pliki
    const items = await fs.readdir(folderPath, { withFileTypes: true })
    const allFiles = await Promise.all(
      items
        .filter(item => !item.isDirectory())
        .map(async (item) => {
          const itemPath = path.join(folderPath, item.name)
          const stats = await fs.stat(itemPath)
          return {
            name: item.name,
            path: itemPath,
            modifiedAt: stats.mtime.getTime(),
            extension: path.extname(item.name).toLowerCase()
          }
        })
    )

    // Regex do wykrywania plików zgodnych z konwencją: nazwa-typ-001.ext
    const conventionPattern = /^[a-z0-9_]+-[a-z0-9_]+-\d{3}\./i
    
    // Filtruj tylko pliki zgodne z konwencją
    const files = allFiles.filter(file => conventionPattern.test(file.name))

    if (files.length === 0) {
      throw new Error('Brak plików zgodnych z konwencją do zszeregowania')
    }

    // Sortuj według daty modyfikacji (od najstarszej do najnowszej)
    files.sort((a, b) => a.modifiedAt - b.modifiedAt)

    // Grupuj pliki według rozszerzenia
    const filesByExtension = new Map<string, typeof files>()
    files.forEach(file => {
      const ext = file.extension
      if (!filesByExtension.has(ext)) {
        filesByExtension.set(ext, [])
      }
      filesByExtension.get(ext)!.push(file)
    })

    // Określ typ pliku na podstawie folderu
    const fileType = this.getFileTypeByFolder(folderType as FolderType)

    let filesRenamed = 0
    const tempRenames: Array<{ from: string; to: string }> = []

    // Dla każdego rozszerzenia numeruj zgodnie z konwencją
    for (const [ext, extFiles] of filesByExtension) {
      for (let i = 0; i < extFiles.length; i++) {
        const file = extFiles[i]
        
        // Generuj nową nazwę używając konwencji projektu
        const normalizedProjectName = projectName
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
        
        const versionNumber = (i + 1).toString().padStart(3, '0')
        const newName = `${normalizedProjectName}-${fileType}-${versionNumber}${ext}`
        const newPath = path.join(folderPath, newName)

        // Jeśli nazwa się nie zmienia, pomiń
        if (file.path === newPath) continue

        // Użyj tymczasowej nazwy dla bezpieczeństwa
        const tempName = `temp_${Date.now()}_${i}${ext}`
        const tempPath = path.join(folderPath, tempName)
        
        tempRenames.push({ from: file.path, to: tempPath })
        tempRenames.push({ from: tempPath, to: newPath })
      }
    }

    // Wykonaj wszystkie zmiany nazw
    for (const rename of tempRenames) {
      if (await fs.pathExists(rename.from)) {
        await fs.move(rename.from, rename.to, { overwrite: true })
        filesRenamed++
      }
    }

    const skippedFiles = allFiles.length - files.length

    return {
      message: `Pomyślnie zszeregowano ${Math.floor(filesRenamed / 2)} plików${skippedFiles > 0 ? `, pominięto ${skippedFiles} plików z niestandardowymi nazwami` : ''}`,
      filesRenamed: Math.floor(filesRenamed / 2)
    }
  }
}

export const fileManagementService = new FileManagementService()
