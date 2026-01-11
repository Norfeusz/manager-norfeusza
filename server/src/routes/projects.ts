import { Router, Request, Response } from 'express'
import { fileSystemService } from '../services/file-system-service'
import { CreateProjectRequest } from '../../../shared/src/types'

const router = Router()

// Utwórz nowy projekt
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, albumId = 'Robocze' } = req.body as CreateProjectRequest

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nazwa projektu jest wymagana' })
    }

    const project = await fileSystemService.createProject(name.trim(), albumId)
    res.json({ success: true, data: project })
  } catch (error: any) {
    console.error('Error creating project:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się utworzyć projektu' })
  }
})

export default router
