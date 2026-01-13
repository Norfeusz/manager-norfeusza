import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Album, Project, FolderStructure, AlbumCategory } from '../../../shared/src/types'

const BASE_PATH = 'D:\\DATA\\Norfeusz'

interface AlbumMetadata {
  category?: AlbumCategory
  order?: number
}

export class FileSystemService {
  private albumsPath = BASE_PATH

  // Pomocnicze metody do obsługi metadanych albumu
  private async getAlbumMetadata(albumName: string): Promise<AlbumMetadata> {
    const metadataPath = path.join(this.albumsPath, albumName, '.metadata.json')
    try {
      if (await fs.pathExists(metadataPath)) {
        return await fs.readJson(metadataPath)
      }
    } catch (error) {
      console.error(`Error reading metadata for album ${albumName}:`, error)
    }
    return {}
  }

  private async saveAlbumMetadata(albumName: string, metadata: AlbumMetadata): Promise<void> {
    const metadataPath = path.join(this.albumsPath, albumName, '.metadata.json')
    await fs.writeJson(metadataPath, metadata, { spaces: 2 })
  }

  async initialize(): Promise<void> {
    // Upewnij się, że główny folder istnieje
    await fs.ensureDir(this.albumsPath)

    // Sprawdź czy istnieje album "Robocze"
    const roboczePath = path.join(this.albumsPath, 'Robocze')
    if (!(await fs.pathExists(roboczePath))) {
      await fs.ensureDir(roboczePath)
      console.log('✅ Utworzono album "Robocze"')
    }

    // Sprawdź czy istnieje folder "Sortownia"
    const sortowniaPath = path.join(this.albumsPath, 'Sortownia')
    if (!(await fs.pathExists(sortowniaPath))) {
      await fs.ensureDir(sortowniaPath)
      console.log('✅ Utworzono folder "Sortownia"')
    }
  }

  async getAlbums(): Promise<Album[]> {
    const items = await fs.readdir(this.albumsPath, { withFileTypes: true })
    const albums: Album[] = []
    
    // Foldery do wykluczenia - nie są albumami
    const excludedFolders = ['Sortownia', 'Bity', 'Teksty', 'Pliki']

    for (const item of items) {
      if (item.isDirectory() && !excludedFolders.includes(item.name)) {
        const albumPath = path.join(this.albumsPath, item.name)
        const stats = await fs.stat(albumPath)
        const projects = await this.getProjects(item.name)
        const metadata = await this.getAlbumMetadata(item.name)

        // Sprawdź czy istnieje okładka (JPG, JPEG lub PNG)
        const coverJpgPath = path.join(albumPath, 'cover.jpg')
        const coverJpegPath = path.join(albumPath, 'cover.jpeg')
        const coverPngPath = path.join(albumPath, 'cover.png')
        const hasJpg = await fs.pathExists(coverJpgPath)
        const hasJpeg = await fs.pathExists(coverJpegPath)
        const hasPng = await fs.pathExists(coverPngPath)
        
        let coverImage: string | undefined
        if (hasJpg) {
          coverImage = `/api/covers/albums/${item.name}/cover.jpg`
        } else if (hasJpeg) {
          coverImage = `/api/covers/albums/${item.name}/cover.jpeg`
        } else if (hasPng) {
          coverImage = `/api/covers/albums/${item.name}/cover.png`
        }

        albums.push({
          id: item.name,
          name: item.name,
          path: albumPath,
          createdAt: stats.birthtime.toISOString(),
          projectCount: projects.length,
          coverImage,
          category: (metadata.category || 'rzezbione') as AlbumCategory,
          order: metadata.order,
        })
      }
    }

    return albums.sort((a, b) => {
      // "Robocze" zawsze na początku
      if (a.name === 'Robocze') return -1
      if (b.name === 'Robocze') return 1
      return a.name.localeCompare(b.name)
    })
  }

  async createAlbum(name: string): Promise<Album> {
    const albumPath = path.join(this.albumsPath, name)

    if (await fs.pathExists(albumPath)) {
      throw new Error(`Album "${name}" już istnieje`)
    }

    await fs.ensureDir(albumPath)
    const stats = await fs.stat(albumPath)

    return {
      id: name,
      name,
      path: albumPath,
      createdAt: stats.birthtime.toISOString(),
      projectCount: 0,
    }
  }

  async renameAlbum(oldName: string, newName: string): Promise<void> {
    const oldPath = path.join(this.albumsPath, oldName)
    const newPath = path.join(this.albumsPath, newName)

    if (!(await fs.pathExists(oldPath))) {
      throw new Error(`Album "${oldName}" nie istnieje`)
    }

    if (await fs.pathExists(newPath)) {
      throw new Error(`Album "${newName}" już istnieje`)
    }

    await fs.rename(oldPath, newPath)
  }

  async updateAlbumCategory(albumName: string, category: AlbumCategory): Promise<void> {
    const albumPath = path.join(this.albumsPath, albumName)

    if (!(await fs.pathExists(albumPath))) {
      throw new Error(`Album "${albumName}" nie istnieje`)
    }

    const metadata = await this.getAlbumMetadata(albumName)
    metadata.category = category
    await this.saveAlbumMetadata(albumName, metadata)
  }

  async updateAlbumOrder(albumName: string, order: number): Promise<void> {
    const albumPath = path.join(this.albumsPath, albumName)

    if (!(await fs.pathExists(albumPath))) {
      throw new Error(`Album "${albumName}" nie istnieje`)
    }

    const metadata = await this.getAlbumMetadata(albumName)
    metadata.order = order
    await this.saveAlbumMetadata(albumName, metadata)
  }

  async getProjects(albumId: string): Promise<Project[]> {
    const albumPath = path.join(this.albumsPath, albumId)

    if (!(await fs.pathExists(albumPath))) {
      throw new Error(`Album "${albumId}" nie istnieje`)
    }

    // Sprawdź okładkę albumu (fallback dla projektów)
    const albumCoverJpgPath = path.join(albumPath, 'cover.jpg')
    const albumCoverJpegPath = path.join(albumPath, 'cover.jpeg')
    const albumCoverPngPath = path.join(albumPath, 'cover.png')
    const albumHasJpg = await fs.pathExists(albumCoverJpgPath)
    const albumHasJpeg = await fs.pathExists(albumCoverJpegPath)
    const albumHasPng = await fs.pathExists(albumCoverPngPath)
    
    let albumCoverImage: string | undefined
    if (albumHasJpg) {
      albumCoverImage = `/api/covers/albums/${albumId}/cover.jpg`
    } else if (albumHasJpeg) {
      albumCoverImage = `/api/covers/albums/${albumId}/cover.jpeg`
    } else if (albumHasPng) {
      albumCoverImage = `/api/covers/albums/${albumId}/cover.png`
    }

    const items = await fs.readdir(albumPath, { withFileTypes: true })
    const projects: Project[] = []

    for (const item of items) {
      if (item.isDirectory()) {
        const projectPath = path.join(albumPath, item.name)
        const stats = await fs.stat(projectPath)

        // Sprawdź czy istnieje okładka projektu (JPG, JPEG lub PNG)
        const coverJpgPath = path.join(projectPath, 'cover.jpg')
        const coverJpegPath = path.join(projectPath, 'cover.jpeg')
        const coverPngPath = path.join(projectPath, 'cover.png')
        const hasJpg = await fs.pathExists(coverJpgPath)
        const hasJpeg = await fs.pathExists(coverJpegPath)
        const hasPng = await fs.pathExists(coverPngPath)
        
        let coverImage: string | undefined
        let hasOwnCover = false
        
        if (hasJpg) {
          coverImage = `/api/covers/projects/${albumId}/${encodeURIComponent(item.name)}/cover.jpg`
          hasOwnCover = true
        } else if (hasJpeg) {
          coverImage = `/api/covers/projects/${albumId}/${encodeURIComponent(item.name)}/cover.jpeg`
          hasOwnCover = true
        } else if (hasPng) {
          coverImage = `/api/covers/projects/${albumId}/${encodeURIComponent(item.name)}/cover.png`
          hasOwnCover = true
        } else {
          // Użyj okładki albumu jako fallback
          coverImage = albumCoverImage
          hasOwnCover = false
        }

        projects.push({
          id: uuidv4(),
          name: item.name,
          albumId,
          path: projectPath,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
          structure: this.getProjectStructure(projectPath, item.name),
          coverImage,
          hasOwnCover,
        })
      }
    }

    return projects.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Wyciągnij numer z nazwy projektu (np. "01 - Nazwa" -> 1)
  private extractProjectNumber(projectName: string): number | null {
    const match = projectName.match(/^(\d{2})\s*-\s*/)
    return match ? parseInt(match[1], 10) : null
  }

  // Pobierz następny dostępny numer w albumie
  private async getNextProjectNumber(albumId: string): Promise<number> {
    const projects = await this.getProjects(albumId)
    const numbers = projects
      .map((p) => this.extractProjectNumber(p.name))
      .filter((n): n is number => n !== null)

    if (numbers.length === 0) return 1
    return Math.max(...numbers) + 1
  }

  // Sprawdź czy projekt z danym numerem istnieje
  private async projectWithNumberExists(albumId: string, number: number): Promise<boolean> {
    const projects = await this.getProjects(albumId)
    return projects.some((p) => this.extractProjectNumber(p.name) === number)
  }

  // Przesuń projekty o numer większy lub równy podanemu
  private async shiftProjectNumbers(albumId: string, fromNumber: number): Promise<void> {
    const albumPath = path.join(this.albumsPath, albumId)
    const projects = await this.getProjects(albumId)

    // Sortuj projekty od największego numeru do najmniejszego (żeby uniknąć konfliktów)
    const projectsToShift = projects
      .map((p) => ({
        project: p,
        number: this.extractProjectNumber(p.name),
      }))
      .filter((p): p is { project: Project; number: number } => 
        p.number !== null && p.number >= fromNumber
      )
      .sort((a, b) => b.number - a.number)

    for (const { project, number } of projectsToShift) {
      const newNumber = number + 1
      const nameWithoutNumber = project.name.replace(/^\d{2}\s*-\s*/, '')
      const newName = `${newNumber.toString().padStart(2, '0')} - ${nameWithoutNumber}`
      const newPath = path.join(albumPath, newName)

      await fs.rename(project.path, newPath)
      console.log(`📝 Przesunięto: ${project.name} -> ${newName}`)
    }
  }

  async createProject(
    name: string,
    albumId: string = 'Robocze',
    useNumbering: boolean = true,
    numberingMode: 'auto' | 'manual' = 'auto',
    projectNumber?: number
  ): Promise<Project> {
    const albumPath = path.join(this.albumsPath, albumId)

    if (!(await fs.pathExists(albumPath))) {
      throw new Error(`Album "${albumId}" nie istnieje`)
    }

    let finalProjectName = name

    // Obsługa numeracji
    if (useNumbering) {
      let number: number

      if (numberingMode === 'auto') {
        // Automatycznie przydziel następny numer
        number = await this.getNextProjectNumber(albumId)
      } else {
        // Użyj numeru podanego ręcznie
        if (projectNumber === undefined || projectNumber < 1) {
          throw new Error('Podaj prawidłowy numer projektu (1 lub większy)')
        }
        number = projectNumber

        // Jeśli projekt z tym numerem istnieje, przesuń wszystkie kolejne
        if (await this.projectWithNumberExists(albumId, number)) {
          await this.shiftProjectNumbers(albumId, number)
        }
      }

      finalProjectName = `${number.toString().padStart(2, '0')} - ${name}`
    }

    const projectPath = path.join(albumPath, finalProjectName)

    if (await fs.pathExists(projectPath)) {
      throw new Error(`Projekt "${finalProjectName}" już istnieje w albumie "${albumId}"`)
    }

    // Tworzenie struktury folderów projektu
    const structure = this.getProjectStructure(projectPath, finalProjectName)

    await fs.ensureDir(path.join(projectPath, 'Projekt FL'))
    await fs.ensureDir(path.join(projectPath, 'Projekt Reaper'))
    await fs.ensureDir(path.join(projectPath, 'Tekst'))
    await fs.ensureDir(path.join(projectPath, 'Demo bit'))
    await fs.ensureDir(path.join(projectPath, 'Demo nawijka'))
    await fs.ensureDir(path.join(projectPath, 'Demo utwor'))
    await fs.ensureDir(path.join(projectPath, 'Gotowe'))
    await fs.ensureDir(path.join(projectPath, 'Pliki'))

    const stats = await fs.stat(projectPath)

    console.log(`✅ Utworzono projekt "${finalProjectName}" w albumie "${albumId}"`)

    return {
      id: uuidv4(),
      name: finalProjectName,
      albumId,
      path: projectPath,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
      structure,
    }
  }

  private getProjectStructure(projectPath: string, _projectName: string): FolderStructure {
    return {
      projektFL: path.join(projectPath, 'Projekt FL'),
      projektReaper: path.join(projectPath, 'Projekt Reaper'),
      tekst: path.join(projectPath, 'Tekst'),
      demoBit: path.join(projectPath, 'Demo bit'),
      demoNawijka: path.join(projectPath, 'Demo nawijka'),
      demoUtwor: path.join(projectPath, 'Demo utwor'),
      gotowe: path.join(projectPath, 'Gotowe'),
      pliki: path.join(projectPath, 'Pliki'),
    }
  }

  async getProjectByPath(projectPath: string): Promise<Project | null> {
    if (!(await fs.pathExists(projectPath))) {
      return null
    }

    const projectName = path.basename(projectPath)
    const albumPath = path.dirname(projectPath)
    const albumId = path.basename(albumPath)
    const stats = await fs.stat(projectPath)

    return {
      id: uuidv4(),
      name: projectName,
      albumId,
      path: projectPath,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
      structure: this.getProjectStructure(projectPath, projectName),
    }
  }

  // Zmień nazwę projektu
  async renameProject(albumId: string, oldProjectName: string, newName: string): Promise<Project> {
    const oldPath = path.join(this.albumsPath, albumId, oldProjectName)
    
    if (!(await fs.pathExists(oldPath))) {
      throw new Error(`Projekt "${oldProjectName}" nie istnieje`)
    }

    // Zachowaj numerację jeśli istnieje
    let finalName = newName
    const numberMatch = oldProjectName.match(/^(\d{2})\s*-\s*/)
    if (numberMatch) {
      const number = numberMatch[1]
      finalName = `${number} - ${newName}`
    }

    const newPath = path.join(this.albumsPath, albumId, finalName)

    if (await fs.pathExists(newPath)) {
      throw new Error(`Projekt "${finalName}" już istnieje w albumie "${albumId}"`)
    }

    await fs.rename(oldPath, newPath)
    console.log(`📝 Zmieniono nazwę projektu: ${oldProjectName} -> ${finalName}`)

    return this.getProjectByPath(newPath) as Promise<Project>
  }

  // Przenieś projekt do innego albumu
  async moveProjectToAlbum(
    sourceAlbumId: string,
    projectName: string,
    targetAlbumId: string
  ): Promise<Project> {
    const sourcePath = path.join(this.albumsPath, sourceAlbumId, projectName)
    const targetAlbumPath = path.join(this.albumsPath, targetAlbumId)

    if (!(await fs.pathExists(sourcePath))) {
      throw new Error(`Projekt "${projectName}" nie istnieje`)
    }

    if (!(await fs.pathExists(targetAlbumPath))) {
      throw new Error(`Album "${targetAlbumId}" nie istnieje`)
    }

    const targetPath = path.join(targetAlbumPath, projectName)

    if (await fs.pathExists(targetPath)) {
      throw new Error(`Projekt "${projectName}" już istnieje w albumie "${targetAlbumId}"`)
    }

    await fs.move(sourcePath, targetPath)
    console.log(`📦 Przeniesiono projekt: ${projectName} z "${sourceAlbumId}" do "${targetAlbumId}"`)

    return this.getProjectByPath(targetPath) as Promise<Project>
  }

  // Usuń projekt (z opcją przeniesienia plików do sortowni)
  async deleteProject(
    albumId: string,
    projectName: string,
    moveFilesToSortownia: boolean = false
  ): Promise<void> {
    const projectPath = path.join(this.albumsPath, albumId, projectName)

    if (!(await fs.pathExists(projectPath))) {
      throw new Error(`Projekt "${projectName}" nie istnieje`)
    }

    if (moveFilesToSortownia) {
      const sortowniaPath = path.join(this.albumsPath, 'Sortownia')
      await fs.ensureDir(sortowniaPath)

      // Przejdź przez wszystkie podfoldery projektu i przenieś pliki
      const PROJECT_FOLDERS = [
        'Projekt FL',
        'Projekt Reaper',
        'Tekst',
        'Demo bit',
        'Demo nawijka',
        'Demo utwor',
        'Gotowe',
        'Pliki',
      ]

      for (const folderName of PROJECT_FOLDERS) {
        const folderPath = path.join(projectPath, folderName)
        if (await fs.pathExists(folderPath)) {
          const files = await fs.readdir(folderPath)
          for (const file of files) {
            const filePath = path.join(folderPath, file)
            const stat = await fs.stat(filePath)
            if (stat.isFile()) {
              const targetPath = path.join(sortowniaPath, file)
              
              // Jeśli plik o takiej nazwie już istnieje w sortowni, dodaj timestamp
              let finalTargetPath = targetPath
              if (await fs.pathExists(targetPath)) {
                const timestamp = Date.now()
                const ext = path.extname(file)
                const nameWithoutExt = path.basename(file, ext)
                finalTargetPath = path.join(sortowniaPath, `${nameWithoutExt}_${timestamp}${ext}`)
              }

              await fs.move(filePath, finalTargetPath)
              console.log(`  📄 Przeniesiono do sortowni: ${file}`)
            }
          }
        }
      }

      console.log(`🗑️ Usunięto projekt "${projectName}" (pliki przeniesione do sortowni)`)
    } else {
      console.log(`🗑️ Usunięto projekt "${projectName}" (wszystkie pliki usunięte)`)
    }

    await fs.remove(projectPath)
  }

  // Nadaj numer projektowi bez numeracji (z przesuwaniem jeśli trzeba)
  async assignNumberToProject(
    albumId: string,
    projectName: string,
    number: number
  ): Promise<Project> {
    const albumPath = path.join(this.albumsPath, albumId)
    const oldPath = path.join(albumPath, projectName)

    if (!(await fs.pathExists(oldPath))) {
      throw new Error(`Projekt "${projectName}" nie istnieje`)
    }

    // Sprawdź czy projekt już ma numer
    if (this.extractProjectNumber(projectName) !== null) {
      throw new Error(`Projekt "${projectName}" już ma numer`)
    }

    // Jeśli projekt z tym numerem istnieje, przesuń wszystkie kolejne
    if (await this.projectWithNumberExists(albumId, number)) {
      await this.shiftProjectNumbers(albumId, number)
    }

    // Nadaj numer
    const newName = `${number.toString().padStart(2, '0')} - ${projectName}`
    const newPath = path.join(albumPath, newName)

    await fs.rename(oldPath, newPath)
    console.log(`🔢 Nadano numer: ${projectName} -> ${newName}`)

    return this.getProjectByPath(newPath) as Promise<Project>
  }

  // Masowe przenumerowanie projektów (tryb organizacji)
  async renumberProjects(
    albumId: string,
    renumberingMap: Array<{ projectName: string; newNumber: number }>
  ): Promise<void> {
    const albumPath = path.join(this.albumsPath, albumId)

    if (!(await fs.pathExists(albumPath))) {
      throw new Error(`Album "${albumId}" nie istnieje`)
    }

    console.log(`🔢 Rozpoczęto przenumerowanie ${renumberingMap.length} projektów w albumie "${albumId}"`)

    // Przejdź przez każdy projekt i zmień jego numer
    for (const { projectName, newNumber } of renumberingMap) {
      const oldPath = path.join(albumPath, projectName)

      if (!(await fs.pathExists(oldPath))) {
        console.warn(`⚠️ Projekt "${projectName}" nie istnieje - pomijam`)
        continue
      }

      // Usuń stary numer jeśli istnieje, lub zostaw nazwę bez zmian
      const nameWithoutNumber = projectName.replace(/^\d{2}\s*-\s*/, '')
      
      // Jeśli nameWithoutNumber jest puste (projekt miał tylko numer?), użyj oryginalnej nazwy
      const baseName = nameWithoutNumber.trim() || projectName

      // Utwórz nową nazwę z nowym numerem
      const newName = `${newNumber.toString().padStart(2, '0')} - ${baseName}`
      const newPath = path.join(albumPath, newName)

      // Jeśli nazwa się nie zmieniła, pomiń
      if (oldPath === newPath) {
        console.log(`  ✓ ${projectName} - bez zmian`)
        continue
      }

      // Jeśli projekt docelowy już istnieje, najpierw przenieś go do tymczasowej nazwy
      if (await fs.pathExists(newPath)) {
        const tempName = `_temp_${Date.now()}_${newName}`
        const tempPath = path.join(albumPath, tempName)
        await fs.rename(newPath, tempPath)
        console.log(`  📦 Tymczasowo przeniesiono konfliktowy projekt: ${newName} -> ${tempName}`)
      }

      await fs.rename(oldPath, newPath)
      console.log(`  ✓ ${projectName} -> ${newName}`)
    }

    console.log(`✅ Przenumerowano projekty w albumie "${albumId}"`)
  }
}

export const fileSystemService = new FileSystemService()
