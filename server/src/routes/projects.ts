import { Router, Request, Response } from 'express'
import { fileSystemService } from '../services/file-system-service'
import { CreateProjectRequest, RenameProjectRequest, MoveProjectRequest, DeleteProjectRequest } from '../../../shared/src/types'

const router = Router()

// Utwórz nowy projekt
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      albumId = 'Robocze',
      useNumbering = true,
      numberingMode = 'auto',
      projectNumber
    } = req.body as CreateProjectRequest

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nazwa projektu jest wymagana' })
    }

    const project = await fileSystemService.createProject(
      name.trim(), 
      albumId,
      useNumbering,
      numberingMode,
      projectNumber
    )
    res.json({ success: true, data: project })
  } catch (error: any) {
    console.error('Error creating project:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się utworzyć projektu' })
  }
})

// Zmień nazwę projektu
router.put('/:albumId/:projectName/rename', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const { newName } = req.body as RenameProjectRequest

    if (!newName || newName.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nowa nazwa projektu jest wymagana' })
    }

    const project = await fileSystemService.renameProject(
      albumId,
      decodeURIComponent(projectName),
      newName.trim()
    )
    res.json({ success: true, data: project })
  } catch (error: any) {
    console.error('Error renaming project:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się zmienić nazwy projektu' })
  }
})

// Przenieś projekt do innego albumu
router.put('/:albumId/:projectName/move', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const { targetAlbumId } = req.body as MoveProjectRequest

    if (!targetAlbumId || targetAlbumId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Album docelowy jest wymagany' })
    }

    const project = await fileSystemService.moveProjectToAlbum(
      albumId,
      decodeURIComponent(projectName),
      targetAlbumId
    )
    res.json({ success: true, data: project })
  } catch (error: any) {
    console.error('Error moving project:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przenieść projektu' })
  }
})

// Usuń projekt
router.delete('/:albumId/:projectName', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const { moveFilesToSortownia } = req.body as DeleteProjectRequest

    await fileSystemService.deleteProject(
      albumId,
      decodeURIComponent(projectName),
      moveFilesToSortownia || false
    )
    res.json({ success: true, data: { message: 'Projekt usunięty' } })
  } catch (error: any) {
    console.error('Error deleting project:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się usunąć projektu' })
  }
})

// Nadaj numer projektowi bez numeracji
router.put('/:albumId/:projectName/assign-number', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const { number } = req.body as { number: number }

    if (!number || number < 1) {
      return res.status(400).json({ success: false, error: 'Podaj prawidłowy numer (1 lub większy)' })
    }

    const project = await fileSystemService.assignNumberToProject(
      albumId,
      decodeURIComponent(projectName),
      number
    )
    res.json({ success: true, data: project })
  } catch (error: any) {
    console.error('Error assigning number to project:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się nadać numeru' })
  }
})

// Przenumeruj projekty w albumie (tryb organizacji)
router.put('/:albumId/renumber', async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params
    const { renumberingMap } = req.body as { renumberingMap: Array<{ projectName: string; newNumber: number }> }

    if (!renumberingMap || !Array.isArray(renumberingMap)) {
      return res.status(400).json({ success: false, error: 'Wymagana mapa przenumerowania' })
    }

    await fileSystemService.renumberProjects(albumId, renumberingMap)
    res.json({ success: true, data: { message: 'Projekty przenumerowane' } })
  } catch (error: any) {
    console.error('Error renumbering projects:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przenumerować projektów' })
  }
})

export default router
