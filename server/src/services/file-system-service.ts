import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Album, Project, FolderStructure } from '../../../shared/src/types'

const BASE_PATH = 'D:\\DATA\\Norfeusz'

export class FileSystemService {
  private albumsPath = BASE_PATH

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

    for (const item of items) {
      if (item.isDirectory() && item.name !== 'Sortownia') {
        const albumPath = path.join(this.albumsPath, item.name)
        const stats = await fs.stat(albumPath)
        const projects = await this.getProjects(item.name)

        albums.push({
          id: item.name,
          name: item.name,
          path: albumPath,
          createdAt: stats.birthtime.toISOString(),
          projectCount: projects.length,
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

  async getProjects(albumId: string): Promise<Project[]> {
    const albumPath = path.join(this.albumsPath, albumId)

    if (!(await fs.pathExists(albumPath))) {
      throw new Error(`Album "${albumId}" nie istnieje`)
    }

    const items = await fs.readdir(albumPath, { withFileTypes: true })
    const projects: Project[] = []

    for (const item of items) {
      if (item.isDirectory()) {
        const projectPath = path.join(albumPath, item.name)
        const stats = await fs.stat(projectPath)

        projects.push({
          id: uuidv4(),
          name: item.name,
          albumId,
          path: projectPath,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
          structure: this.getProjectStructure(projectPath, item.name),
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
}

export const fileSystemService = new FileSystemService()
