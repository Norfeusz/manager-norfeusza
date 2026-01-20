import { Router, Request, Response } from 'express'
import path from 'path'
import fs from 'fs-extra'

const router = Router()
const BASE_PATH = path.resolve('D:/DATA/Norfeusz')

// Pobierz pliki z prostego folderu (Bity, Teksty, Pliki, Sortownia)
router.get('/:folderPath/files', async (req: Request, res: Response) => {
  try {
    const { folderPath } = req.params
    const decodedPath = decodeURIComponent(folderPath)
    const fullPath = path.join(BASE_PATH, decodedPath)

    // Sprawdź czy folder istnieje
    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({ success: false, error: 'Folder nie istnieje' })
    }

    // Sprawdź czy to jest folder
    const stats = await fs.stat(fullPath)
    if (!stats.isDirectory()) {
      return res.status(400).json({ success: false, error: 'Ścieżka nie wskazuje na folder' })
    }

    // Odczytaj zawartość folderu
    const entries = await fs.readdir(fullPath, { withFileTypes: true })
    
    const files = await Promise.all(
      entries
        .filter(entry => !entry.name.startsWith('.')) // Pomijamy ukryte pliki
        .map(async (entry) => {
          const entryPath = path.join(fullPath, entry.name)
          const stats = await fs.stat(entryPath)
          
          return {
            name: entry.name,
            path: entryPath,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            isDirectory: entry.isDirectory()
          }
        })
    )

    // Sortuj: foldery najpierw, potem pliki, alfabetycznie
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name, 'pl')
    })

    res.json({ success: true, data: files })
  } catch (error: any) {
    console.error('Error fetching simple folder files:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać plików' })
  }
})

// Utwórz nowy folder
router.post('/create-folder', async (req: Request, res: Response) => {
  try {
    const { folderPath, folderName } = req.body

    if (!folderPath || !folderName) {
      return res.status(400).json({ success: false, error: 'Wymagane pola: folderPath, folderName' })
    }

    const decodedPath = decodeURIComponent(folderPath)
    const fullPath = path.join(BASE_PATH, decodedPath, folderName)

    // Sprawdź czy folder już istnieje
    if (await fs.pathExists(fullPath)) {
      return res.status(409).json({ success: false, error: 'Folder o tej nazwie już istnieje' })
    }

    // Utwórz folder
    await fs.ensureDir(fullPath)

    res.json({ 
      success: true, 
      data: { 
        message: 'Folder utworzony',
        path: fullPath 
      } 
    })
  } catch (error: any) {
    console.error('Error creating folder:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się utworzyć folderu' })
  }
})

export default router
