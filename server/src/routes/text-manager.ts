import { Router, Request, Response } from 'express'
import fs from 'fs-extra'
import path from 'path'

const router = Router()
const BASE_TEXT_PATH = 'D:\\DATA\\Norfeusz\\Teksty'

// Pobierz pliki i foldery w danej ścieżce
router.get('/files', async (req: Request, res: Response) => {
  try {
    const relativePath = (req.query.path as string) || ''
    const fullPath = path.join(BASE_TEXT_PATH, relativePath)

    // Sprawdź czy ścieżka jest w granicach BASE_TEXT_PATH (security)
    if (!fullPath.startsWith(BASE_TEXT_PATH)) {
      return res.status(403).json({ success: false, error: 'Niedozwolona ścieżka' })
    }

    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({ success: false, error: 'Folder nie istnieje' })
    }

    const items = await fs.readdir(fullPath, { withFileTypes: true })
    const files: any[] = []

    for (const item of items) {
      const itemPath = path.join(fullPath, item.name)
      const stats = await fs.stat(itemPath)

      // Tylko pliki .txt i foldery
      if (item.isDirectory() || item.name.toLowerCase().endsWith('.txt')) {
        files.push({
          name: item.name,
          path: itemPath,
          relativePath: path.join(relativePath, item.name),
          size: stats.size,
          extension: item.isDirectory() ? '' : path.extname(item.name).toLowerCase(),
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          isDirectory: item.isDirectory(),
        })
      }
    }

    // Sortuj: foldery pierwsze, potem pliki alfabetycznie
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    res.json({ success: true, data: files })
  } catch (error: any) {
    console.error('Error fetching text files:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać plików' })
  }
})

// Utwórz nowy podfolder
router.post('/create-folder', async (req: Request, res: Response) => {
  try {
    const { relativePath, folderName } = req.body

    if (!folderName || !folderName.trim()) {
      return res.status(400).json({ success: false, error: 'Wymagana nazwa folderu' })
    }

    const parentPath = path.join(BASE_TEXT_PATH, relativePath || '')
    const newFolderPath = path.join(parentPath, folderName.trim())

    // Security check
    if (!newFolderPath.startsWith(BASE_TEXT_PATH)) {
      return res.status(403).json({ success: false, error: 'Niedozwolona ścieżka' })
    }

    if (await fs.pathExists(newFolderPath)) {
      return res.status(400).json({ success: false, error: 'Folder o tej nazwie już istnieje' })
    }

    await fs.ensureDir(newFolderPath)

    res.json({ success: true, data: { message: 'Folder utworzony', path: newFolderPath } })
  } catch (error: any) {
    console.error('Error creating folder:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się utworzyć folderu' })
  }
})

// Zmień nazwę pliku
router.post('/rename', async (req: Request, res: Response) => {
  try {
    const { relativePath, newName } = req.body

    if (!relativePath || !newName || !newName.trim()) {
      return res.status(400).json({ success: false, error: 'Wymagana ścieżka pliku i nowa nazwa' })
    }

    const oldPath = path.join(BASE_TEXT_PATH, relativePath)
    const dir = path.dirname(oldPath)
    const newPath = path.join(dir, newName.trim())

    // Security check
    if (!oldPath.startsWith(BASE_TEXT_PATH) || !newPath.startsWith(BASE_TEXT_PATH)) {
      return res.status(403).json({ success: false, error: 'Niedozwolona ścieżka' })
    }

    if (!(await fs.pathExists(oldPath))) {
      return res.status(404).json({ success: false, error: 'Plik nie istnieje' })
    }

    if (await fs.pathExists(newPath)) {
      return res.status(400).json({ success: false, error: 'Plik o tej nazwie już istnieje' })
    }

    await fs.rename(oldPath, newPath)

    res.json({ success: true, data: { message: 'Nazwa zmieniona', newPath } })
  } catch (error: any) {
    console.error('Error renaming file:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się zmienić nazwy' })
  }
})

// Usuń pliki (batch)
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const { relativePaths } = req.body

    if (!relativePaths || !Array.isArray(relativePaths) || relativePaths.length === 0) {
      return res.status(400).json({ success: false, error: 'Wymagana lista plików do usunięcia' })
    }

    let deletedCount = 0

    for (const relativePath of relativePaths) {
      const fullPath = path.join(BASE_TEXT_PATH, relativePath)

      // Security check
      if (!fullPath.startsWith(BASE_TEXT_PATH)) {
        continue
      }

      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath)
        deletedCount++
      }
    }

    res.json({ success: true, data: { message: `Usunięto ${deletedCount} plików`, deletedCount } })
  } catch (error: any) {
    console.error('Error deleting files:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się usunąć plików' })
  }
})

// Przenieś pliki do projektu (batch)
router.post('/move-to-project', async (req: Request, res: Response) => {
  try {
    const { relativePaths, albumId, projectName } = req.body

    if (!relativePaths || !Array.isArray(relativePaths) || relativePaths.length === 0) {
      return res.status(400).json({ success: false, error: 'Wymagana lista plików' })
    }

    if (!albumId || !projectName) {
      return res.status(400).json({ success: false, error: 'Wymagany album i projekt' })
    }

    const targetPath = path.join('D:\\DATA\\Norfeusz', albumId, projectName, 'Tekst')
    await fs.ensureDir(targetPath)

    // Pobierz istniejące pliki w folderze docelowym
    const existingItems = await fs.readdir(targetPath)
    const existingFiles = existingItems.filter(f => f.endsWith('.txt'))

    // Funkcja transliteracji polskich znaków
    const transliterate = (text: string): string => {
      const polishMap: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
      }
      return text.split('').map(char => polishMap[char] || char).join('')
    }

    // Generuj znormalizowaną nazwę projektu (snake_case)
    const normalizedProjectName = transliterate(projectName)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    let movedCount = 0

    for (const relativePath of relativePaths) {
      const sourcePath = path.join(BASE_TEXT_PATH, relativePath)

      // Security check
      if (!sourcePath.startsWith(BASE_TEXT_PATH)) {
        continue
      }

      if (await fs.pathExists(sourcePath)) {
        const ext = path.extname(sourcePath) // np. .txt

        // Znajdź najwyższy numer wersji dla typu "tekst"
        let maxVersion = 0
        const pattern = new RegExp(`^${normalizedProjectName}-tekst-(\\d+)\\.txt$`)
        
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
        const newFileName = `${normalizedProjectName}-tekst-${nextVersion}${ext}`
        const finalDestPath = path.join(targetPath, newFileName)

        await fs.move(sourcePath, finalDestPath)
        existingFiles.push(newFileName) // Dodaj do listy aby następne pliki miały wyższy numer
        movedCount++
      }
    }

    res.json({ 
      success: true, 
      data: { 
        message: `Przeniesiono ${movedCount} plików do projektu`, 
        movedCount,
        targetPath 
      } 
    })
  } catch (error: any) {
    console.error('Error moving files to project:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przenieść plików' })
  }
})

// Przenieś pliki do podfolderu (batch)
router.post('/move-to-folder', async (req: Request, res: Response) => {
  try {
    const { relativePaths, targetRelativePath } = req.body

    if (!relativePaths || !Array.isArray(relativePaths) || relativePaths.length === 0) {
      return res.status(400).json({ success: false, error: 'Wymagana lista plików' })
    }

    if (targetRelativePath === undefined) {
      return res.status(400).json({ success: false, error: 'Wymagana docelowa ścieżka' })
    }

    const targetPath = path.join(BASE_TEXT_PATH, targetRelativePath)

    // Security check
    if (!targetPath.startsWith(BASE_TEXT_PATH)) {
      return res.status(403).json({ success: false, error: 'Niedozwolona ścieżka' })
    }

    await fs.ensureDir(targetPath)

    let movedCount = 0

    for (const relativePath of relativePaths) {
      const sourcePath = path.join(BASE_TEXT_PATH, relativePath)

      // Security check
      if (!sourcePath.startsWith(BASE_TEXT_PATH)) {
        continue
      }

      // Nie można przenieść do samego siebie
      if (sourcePath === targetPath) {
        continue
      }

      if (await fs.pathExists(sourcePath)) {
        const fileName = path.basename(sourcePath)
        const destPath = path.join(targetPath, fileName)

        // Jeśli plik już istnieje, dodaj suffix
        let finalDestPath = destPath
        let counter = 1
        while (await fs.pathExists(finalDestPath)) {
          const ext = path.extname(fileName)
          const nameWithoutExt = path.basename(fileName, ext)
          finalDestPath = path.join(targetPath, `${nameWithoutExt}_${counter}${ext}`)
          counter++
        }

        await fs.move(sourcePath, finalDestPath)
        movedCount++
      }
    }

    res.json({ 
      success: true, 
      data: { 
        message: `Przeniesiono ${movedCount} plików`, 
        movedCount 
      } 
    })
  } catch (error: any) {
    console.error('Error moving files to folder:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przenieść plików' })
  }
})

// Pobierz listę albumów
router.get('/albums', async (req: Request, res: Response) => {
  try {
    const basePath = 'D:\\DATA\\Norfeusz'
    
    if (!(await fs.pathExists(basePath))) {
      return res.status(404).json({ success: false, error: 'Ścieżka bazowa nie istnieje' })
    }

    const items = await fs.readdir(basePath, { withFileTypes: true })
    const albums: any[] = []

    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.')) {
        // Pomijamy specjalne foldery
        if (['Bity', 'Teksty', 'Pliki', 'Sortownia'].includes(item.name)) {
          continue
        }

        albums.push({
          id: item.name,
          name: item.name
        })
      }
    }

    albums.sort((a, b) => a.name.localeCompare(b.name))

    console.log('[TEXT-MANAGER] Found albums:', albums.length, albums.map(a => a.name))
    res.json({ success: true, data: albums })
  } catch (error: any) {
    console.error('Error fetching albums:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać albumów' })
  }
})

// Pobierz listę projektów w albumie
router.get('/albums/:albumId/projects', async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params
    const albumPath = path.join('D:\\DATA\\Norfeusz', albumId)

    if (!(await fs.pathExists(albumPath))) {
      return res.status(404).json({ success: false, error: 'Album nie istnieje' })
    }

    const items = await fs.readdir(albumPath, { withFileTypes: true })
    const projects: any[] = []

    for (const item of items) {
      if (item.isDirectory()) {
        projects.push({
          name: item.name
        })
      }
    }

    projects.sort((a, b) => a.name.localeCompare(b.name))

    res.json({ success: true, data: projects })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać projektów' })
  }
})

// Otwórz plik w notatniku
router.post('/open', async (req: Request, res: Response) => {
  try {
    const { relativePath } = req.body

    if (!relativePath) {
      return res.status(400).json({ success: false, error: 'Wymagana ścieżka pliku' })
    }

    const filePath = path.join(BASE_TEXT_PATH, relativePath)

    // Security check
    if (!filePath.startsWith(BASE_TEXT_PATH)) {
      return res.status(403).json({ success: false, error: 'Niedozwolona ścieżka' })
    }

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ success: false, error: 'Plik nie istnieje' })
    }

    const { exec } = await import('child_process')
    exec(`notepad "${filePath}"`)

    res.json({ success: true, data: { message: 'Plik otwarty w notatniku' } })
  } catch (error: any) {
    console.error('Error opening file:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się otworzyć pliku' })
  }
})

export default router
