import { Router, Request, Response } from 'express'
import { fileSystemService } from '../services/file-system-service'
import { CreateAlbumRequest } from '../../../shared/src/types'

const router = Router()

// Pobierz wszystkie albumy
router.get('/', async (_req: Request, res: Response) => {
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

// Zmień nazwę albumu
router.put('/:albumId/rename', async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params
    const { newName } = req.body

    if (!newName || newName.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nowa nazwa albumu jest wymagana' })
    }

    await fileSystemService.renameAlbum(albumId, newName.trim())
    res.json({ success: true, data: { message: 'Nazwa albumu została zmieniona' } })
  } catch (error: any) {
    console.error('Error renaming album:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się zmienić nazwy albumu' })
  }
})

// Aktualizuj kategorię albumu
router.put('/:albumId/category', async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params
    const { category } = req.body

    if (!category || (category !== 'gotowe' && category !== 'rzezbione')) {
      return res.status(400).json({ success: false, error: 'Nieprawidłowa kategoria' })
    }

    await fileSystemService.updateAlbumCategory(albumId, category)
    res.json({ success: true, data: { message: 'Kategoria albumu została zaktualizowana' } })
  } catch (error: any) {
    console.error('Error updating album category:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się zaktualizować kategorii' })
  }
})

// Aktualizuj kolejność albumu
router.put('/:albumId/order', async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params
    const { order } = req.body

    if (typeof order !== 'number') {
      return res.status(400).json({ success: false, error: 'Kolejność musi być liczbą' })
    }

    await fileSystemService.updateAlbumOrder(albumId, order)
    res.json({ success: true, data: { message: 'Kolejność albumu została zaktualizowana' } })
  } catch (error: any) {
    console.error('Error updating album order:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się zaktualizować kolejności' })
  }
})

export default router
