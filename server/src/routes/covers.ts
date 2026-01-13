import { Router, Request, Response } from 'express'
import multer from 'multer'
import fs from 'fs-extra'
import path from 'path'

const router = Router()
const BASE_PATH = 'D:\\DATA\\Norfeusz'

// Konfiguracja multer dla upload okładek
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
      cb(null, true)
    } else {
      cb(new Error('Tylko pliki JPG i PNG są dozwolone'))
    }
  },
})

// Upload okładki albumu
router.post('/albums/:albumId/cover', upload.single('cover'), async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Brak pliku' })
    }

    const albumPath = path.join(BASE_PATH, albumId)
    
    if (!(await fs.pathExists(albumPath))) {
      return res.status(404).json({ success: false, error: 'Album nie istnieje' })
    }

    // Usuń wszystkie wersje okładki jeśli istnieją (jpg, jpeg i png)
    const coverJpgPath = path.join(albumPath, 'cover.jpg')
    const coverJpegPath = path.join(albumPath, 'cover.jpeg')
    const coverPngPath = path.join(albumPath, 'cover.png')
    await fs.remove(coverJpgPath).catch(() => {})
    await fs.remove(coverJpegPath).catch(() => {})
    await fs.remove(coverPngPath).catch(() => {})

    // Określ rozszerzenie na podstawie typu pliku
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg'
    const coverPath = path.join(albumPath, `cover.${ext}`)
    
    // Przenieś nowy plik
    await fs.move(req.file.path, coverPath, { overwrite: true })

    res.json({ 
      success: true, 
      data: { 
        message: 'Okładka albumu zaktualizowana',
        coverUrl: `/api/covers/albums/${albumId}/cover.${ext}`
      } 
    })
  } catch (error: any) {
    console.error('Error uploading album cover:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przesłać okładki' })
  }
})

// Upload okładki projektu
router.post('/projects/:albumId/:projectName/cover', upload.single('cover'), async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Brak pliku' })
    }

    const projectPath = path.join(BASE_PATH, albumId, decodeURIComponent(projectName))
    
    if (!(await fs.pathExists(projectPath))) {
      return res.status(404).json({ success: false, error: 'Projekt nie istnieje' })
    }

    // Usuń wszystkie wersje okładki jeśli istnieją (jpg, jpeg i png)
    const coverJpgPath = path.join(projectPath, 'cover.jpg')
    const coverJpegPath = path.join(projectPath, 'cover.jpeg')
    const coverPngPath = path.join(projectPath, 'cover.png')
    await fs.remove(coverJpgPath).catch(() => {})
    await fs.remove(coverJpegPath).catch(() => {})
    await fs.remove(coverPngPath).catch(() => {})

    // Określ rozszerzenie na podstawie typu pliku
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg'
    const coverPath = path.join(projectPath, `cover.${ext}`)
    
    // Przenieś nowy plik
    await fs.move(req.file.path, coverPath, { overwrite: true })

    res.json({ 
      success: true, 
      data: { 
        message: 'Okładka projektu zaktualizowana',
        coverUrl: `/api/covers/projects/${albumId}/${encodeURIComponent(projectName)}/cover.${ext}`
      } 
    })
  } catch (error: any) {
    console.error('Error uploading project cover:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przesłać okładki' })
  }
})

// Serwowanie okładki albumu
router.get('/albums/:albumId/cover.:ext', async (req: Request, res: Response) => {
  try {
    const { albumId, ext } = req.params
    
    if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
      return res.status(400).json({ success: false, error: 'Nieprawidłowe rozszerzenie pliku' })
    }
    
    const coverPath = path.join(BASE_PATH, albumId, `cover.${ext}`)
    
    if (!(await fs.pathExists(coverPath))) {
      return res.status(404).json({ success: false, error: 'Okładka nie istnieje' })
    }

    res.sendFile(coverPath)
  } catch (error: any) {
    console.error('Error serving album cover:', error)
    res.status(500).json({ success: false, error: 'Nie udało się pobrać okładki' })
  }
})

// Serwowanie okładki projektu
router.get('/projects/:albumId/:projectName/cover.:ext', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName, ext } = req.params
    
    if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
      return res.status(400).json({ success: false, error: 'Nieprawidłowe rozszerzenie pliku' })
    }
    
    const coverPath = path.join(BASE_PATH, albumId, decodeURIComponent(projectName), `cover.${ext}`)
    
    if (!(await fs.pathExists(coverPath))) {
      return res.status(404).json({ success: false, error: 'Okładka nie istnieje' })
    }

    res.sendFile(coverPath)
  } catch (error: any) {
    console.error('Error serving project cover:', error)
    res.status(500).json({ success: false, error: 'Nie udało się pobrać okładki' })
  }
})

// Usuń okładkę albumu
router.delete('/albums/:albumId/cover', async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params
    const coverJpgPath = path.join(BASE_PATH, albumId, 'cover.jpg')
    const coverJpegPath = path.join(BASE_PATH, albumId, 'cover.jpeg')
    const coverPngPath = path.join(BASE_PATH, albumId, 'cover.png')
    
    const jpgExists = await fs.pathExists(coverJpgPath)
    const jpegExists = await fs.pathExists(coverJpegPath)
    const pngExists = await fs.pathExists(coverPngPath)
    
    if (!jpgExists && !jpegExists && !pngExists) {
      return res.status(404).json({ success: false, error: 'Okładka nie istnieje' })
    }
    
    if (jpgExists) await fs.remove(coverJpgPath)
    if (jpegExists) await fs.remove(coverJpegPath)
    if (pngExists) await fs.remove(coverPngPath)
    
    res.json({ success: true, data: { message: 'Okładka usunięta' } })
  } catch (error: any) {
    console.error('Error deleting album cover:', error)
    res.status(500).json({ success: false, error: 'Nie udało się usunąć okładki' })
  }
})

// Usuń okładkę projektu
router.delete('/projects/:albumId/:projectName/cover', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const coverJpgPath = path.join(BASE_PATH, albumId, decodeURIComponent(projectName), 'cover.jpg')
    const coverJpegPath = path.join(BASE_PATH, albumId, decodeURIComponent(projectName), 'cover.jpeg')
    const coverPngPath = path.join(BASE_PATH, albumId, decodeURIComponent(projectName), 'cover.png')
    
    const jpgExists = await fs.pathExists(coverJpgPath)
    const jpegExists = await fs.pathExists(coverJpegPath)
    const pngExists = await fs.pathExists(coverPngPath)
    
    if (!jpgExists && !jpegExists && !pngExists) {
      return res.status(404).json({ success: false, error: 'Okładka nie istnieje' })
    }
    
    if (jpgExists) await fs.remove(coverJpgPath)
    if (jpegExists) await fs.remove(coverJpegPath)
    if (pngExists) await fs.remove(coverPngPath)
    
    res.json({ success: true, data: { message: 'Okładka usunięta' } })
  } catch (error: any) {
    console.error('Error deleting project cover:', error)
    res.status(500).json({ success: false, error: 'Nie udało się usunąć okładki' })
  }
})

export default router
