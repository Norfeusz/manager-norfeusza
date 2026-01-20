import fs from 'fs-extra'
import path from 'path'
import AdmZip from 'adm-zip'
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

  // Pobierz wszystkie pliki z całego projektu
  async getAllProjectFiles(albumId: string, projectName: string): Promise<FileInfo[]> {
    const projectPath = path.join(BASE_PATH, albumId, projectName)

    if (!(await fs.pathExists(projectPath))) {
      throw new Error('Projekt nie istnieje')
    }

    const allFiles: FileInfo[] = []
    const folders: FolderType[] = [
      'Projekt FL',
      'Projekt Reaper',
      'Tekst',
      'Demo bit',
      'Demo nawijka',
      'Demo utwor',
      'Gotowe',
      'Pliki'
    ]

    for (const folderType of folders) {
      const folderPath = path.join(projectPath, folderType)

      if (await fs.pathExists(folderPath)) {
        const items = await fs.readdir(folderPath, { withFileTypes: true })

        for (const item of items) {
          if (!item.isDirectory()) {
            const itemPath = path.join(folderPath, item.name)
            const stats = await fs.stat(itemPath)

            allFiles.push({
              name: item.name,
              path: itemPath,
              size: stats.size,
              extension: path.extname(item.name).toLowerCase(),
              createdAt: stats.birthtime.toISOString(),
              modifiedAt: stats.mtime.toISOString(),
              isDirectory: false,
              folderType: folderType // Dodajemy informację z którego folderu pochodzi
            })
          }
        }
      }
    }

    // Sortuj po dacie modyfikacji (najnowsze pierwsze)
    return allFiles.sort((a, b) => 
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    )
  }

  // Pobierz wszystkie pliki z całego albumu
  async getAllAlbumFiles(albumId: string): Promise<FileInfo[]> {
    const albumPath = path.join(BASE_PATH, albumId)

    if (!(await fs.pathExists(albumPath))) {
      throw new Error('Album nie istnieje')
    }

    const allFiles: FileInfo[] = []
    const projects = await fs.readdir(albumPath, { withFileTypes: true })

    for (const project of projects) {
      if (project.isDirectory()) {
        const projectFiles = await this.getAllProjectFiles(albumId, project.name)
        // Dodaj nazwę projektu do każdego pliku
        projectFiles.forEach(file => {
          file.projectName = project.name
        })
        allFiles.push(...projectFiles)
      }
    }

    // Sortuj po dacie modyfikacji (najnowsze pierwsze)
    return allFiles.sort((a, b) => 
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    )
  }

  // Pobierz wszystkie pliki ze wszystkich albumów
  async getAllFiles(): Promise<FileInfo[]> {
    if (!(await fs.pathExists(BASE_PATH))) {
      throw new Error('Ścieżka bazowa nie istnieje')
    }

    const allFiles: FileInfo[] = []
    const albums = await fs.readdir(BASE_PATH, { withFileTypes: true })

    for (const album of albums) {
      if (album.isDirectory() && !album.name.startsWith('.')) {
        try {
          const albumFiles = await this.getAllAlbumFiles(album.name)
          // Dodaj nazwę albumu do każdego pliku
          albumFiles.forEach(file => {
            file.albumId = album.name
          })
          allFiles.push(...albumFiles)
        } catch (error) {
          console.warn(`Skipping album ${album.name}:`, error)
        }
      }
    }

    // Sortuj po dacie modyfikacji (najnowsze pierwsze)
    return allFiles.sort((a, b) => 
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    )
  }

  // Generuj nazwę pliku zgodnie z konwencją
  generateFileName(
    projectName: string,
    fileType: string,
    extension: string,
    existingFiles: string[]
  ): string {
    // Funkcja transliteracji polskich znaków
    const transliterate = (text: string): string => {
      const polishMap: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
      }
      return text.split('').map(char => polishMap[char] || char).join('')
    }

    // Konwersja nazwy projektu na snake_case
    const normalizedProjectName = transliterate(projectName)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    // Znajdź najwyższy numer wersji dla tego typu pliku
    let maxVersion = 0
    const pattern = new RegExp(`^${normalizedProjectName}-${fileType}_(\\d+)\\${extension}$`)

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
    return `${normalizedProjectName}-${fileType}_${nextVersion}${extension}`
  }

  // Uzyskaj typ pliku na podstawie folderu docelowego
  getFileTypeByFolder(folderType: FolderType, specificType?: string): string {
    const typeMap: Record<string, string> = {
      'Projekt FL': 'projekt',
      'Projekt Reaper': 'projekt',
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
    customName?: string,
    useSciezkiFolder?: boolean
  ): Promise<{ newPath: string; newName: string }> {
    const sourcePath = path.join(BASE_PATH, 'Sortownia', fileName)

    if (!(await fs.pathExists(sourcePath))) {
      throw new Error('Plik nie istnieje w sortowni')
    }

    let targetFolderPath = path.join(BASE_PATH, albumId, projectName, targetFolder)
    
    // Jeśli wybrano Ścieżki dla Demo bit, dodaj podfolder
    if (useSciezkiFolder && targetFolder === 'Demo bit') {
      targetFolderPath = path.join(targetFolderPath, 'Ścieżki')
    }
    
    await fs.ensureDir(targetFolderPath)

    const extension = path.extname(sourcePath)
    const originalFileName = path.basename(sourcePath)
    let newFileName: string
    
    if (useSciezkiFolder && targetFolder === 'Demo bit') {
      // W folderze Ścieżki zachowaj oryginalną nazwę
      newFileName = originalFileName
      
      // Sprawdź czy plik o takiej nazwie już istnieje
      const targetPath = path.join(targetFolderPath, newFileName)
      if (await fs.pathExists(targetPath)) {
        throw new Error(`Plik o nazwie "${newFileName}" już istnieje w folderze Ścieżki`)
      }
    } else if (customName) {
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

  // Pobierz listę archiwów ZIP w folderze ZIP Skład
  async listZipArchives(): Promise<FileInfo[]> {
    const zipFolderPath = path.join('D:\\DATA\\Norfeusz\\Pliki\\ZIP Skład')

    // Upewnij się, że folder istnieje
    await fs.ensureDir(zipFolderPath)

    const items = await fs.readdir(zipFolderPath, { withFileTypes: true })
    const zipFiles: FileInfo[] = []

    for (const item of items) {
      if (!item.isDirectory() && item.name.toLowerCase().endsWith('.zip')) {
        const itemPath = path.join(zipFolderPath, item.name)
        const stats = await fs.stat(itemPath)

        zipFiles.push({
          name: item.name,
          path: itemPath,
          size: stats.size,
          extension: '.zip',
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          isDirectory: false,
        })
      }
    }

    return zipFiles.sort((a, b) => 
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    )
  }

  // Dodaj pliki do archiwum ZIP
  async addFilesToZipArchive(
    filePaths: string[],
    zipName: string,
    createNew: boolean
  ): Promise<{ zipPath: string; filesAdded: number }> {
    console.log('[ZIP] Start - filePaths:', filePaths)
    console.log('[ZIP] zipName:', zipName, 'createNew:', createNew)
    
    const zipFolderPath = path.join('D:\\DATA\\Norfeusz\\Pliki\\ZIP Skład')
    console.log('[ZIP] zipFolderPath:', zipFolderPath)
    
    await fs.ensureDir(zipFolderPath)
    console.log('[ZIP] Folder ensured')

    // Upewnij się, że nazwa ma rozszerzenie .zip
    const zipFileName = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`
    const zipPath = path.join(zipFolderPath, zipFileName)
    console.log('[ZIP] zipPath:', zipPath)

    // Sprawdź czy plik istnieje jeśli createNew = true
    if (createNew && await fs.pathExists(zipPath)) {
      throw new Error('Archiwum o tej nazwie już istnieje')
    }

    // Jeśli nie tworzymy nowego, sprawdź czy istnieje
    if (!createNew && !(await fs.pathExists(zipPath))) {
      throw new Error('Wybrane archiwum nie istnieje')
    }

    let filesAdded = 0

    // Użyj adm-zip do tworzenia/modyfikowania archiwum
    let zip: AdmZip

    if (createNew) {
      console.log('[ZIP] Creating new archive')
      zip = new AdmZip()
    } else {
      console.log('[ZIP] Opening existing archive')
      zip = new AdmZip(zipPath)
    }

    // Dodaj każdy plik do archiwum
    for (const filePath of filePaths) {
      console.log('[ZIP] Checking file:', filePath)
      if (await fs.pathExists(filePath)) {
        const fileName = path.basename(filePath)
        console.log('[ZIP] Adding file:', fileName)
        const fileBuffer = await fs.readFile(filePath)
        console.log('[ZIP] File buffer size:', fileBuffer.length)
        zip.addFile(fileName, fileBuffer)
        filesAdded++
      } else {
        console.log('[ZIP] File does not exist:', filePath)
      }
    }

    console.log('[ZIP] Total files added:', filesAdded)
    console.log('[ZIP] Saving to:', zipPath)
    
    // Zapisz archiwum
    const zipBuffer = zip.toBuffer()
    console.log('[ZIP] ZIP buffer size:', zipBuffer.length)
    
    await fs.writeFile(zipPath, zipBuffer)
    console.log('[ZIP] Saved successfully')
    
    // Weryfikacja zapisu
    const exists = await fs.pathExists(zipPath)
    console.log('[ZIP] File exists after save:', exists)
    if (exists) {
      const stats = await fs.stat(zipPath)
      console.log('[ZIP] File size on disk:', stats.size)
    }

    return {
      zipPath,
      filesAdded
    }
  }
}

export const fileManagementService = new FileManagementService()
