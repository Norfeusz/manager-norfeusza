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
  }

  async getAlbums(): Promise<Album[]> {
    const items = await fs.readdir(this.albumsPath, { withFileTypes: true })
    const albums: Album[] = []

    for (const item of items) {
      if (item.isDirectory()) {
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

  async createProject(name: string, albumId: string = 'Robocze'): Promise<Project> {
    const albumPath = path.join(this.albumsPath, albumId)

    if (!(await fs.pathExists(albumPath))) {
      throw new Error(`Album "${albumId}" nie istnieje`)
    }

    const projectPath = path.join(albumPath, name)

    if (await fs.pathExists(projectPath)) {
      throw new Error(`Projekt "${name}" już istnieje w albumie "${albumId}"`)
    }

    // Tworzenie struktury folderów projektu
    const structure = this.getProjectStructure(projectPath, name)

    await fs.ensureDir(path.join(projectPath, 'Projekt FL'))
    await fs.ensureDir(path.join(projectPath, 'Projekt Reaper'))
    await fs.ensureDir(path.join(projectPath, 'Tekst'))
    await fs.ensureDir(path.join(projectPath, 'Demo bit'))
    await fs.ensureDir(path.join(projectPath, 'Demo nawijka'))
    await fs.ensureDir(path.join(projectPath, 'Demo utwor'))
    await fs.ensureDir(path.join(projectPath, 'Gotowe'))
    await fs.ensureDir(path.join(projectPath, 'Pliki'))

    const stats = await fs.stat(projectPath)

    console.log(`✅ Utworzono projekt "${name}" w albumie "${albumId}"`)

    return {
      id: uuidv4(),
      name,
      albumId,
      path: projectPath,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
      structure,
    }
  }

  private getProjectStructure(projectPath: string, projectName: string): FolderStructure {
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
