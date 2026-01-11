import { Router, Request, Response } from 'express'
import { fileSystemService } from '../services/file-system-service'
import { CreateAlbumRequest } from '../../../shared/src/types'

const router = Router()

// Pobierz wszystkie albumy
router.get('/', async (req: Request, res: Response) => {
  try {
    const albums = await fileSystemService.getAlbums()
    res.json({ success: true, data: albums })
  } catch (error) {
    console.error('Error fetching albums:', error)
    res.status(500).json({ success: false, error: 'Nie udało się pobrać albumów' })
  }
})

// Pobierz projekty w albumie
router.get('/:albumId/projects', async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params
    const projects = await fileSystemService.getProjects(albumId)
    res.json({ success: true, data: projects })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać projektów' })
  }
})

// Utwórz nowy album
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body as CreateAlbumRequest

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nazwa albumu jest wymagana' })
    }

    const album = await fileSystemService.createAlbum(name.trim())
    res.json({ success: true, data: album })
  } catch (error: any) {
    console.error('Error creating album:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się utworzyć albumu' })
  }
})

export default router
