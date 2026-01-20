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
      useNumbering = false,
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

// Pobierz metadane projektu
router.get('/:albumId/:projectName/metadata', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const metadata = await fileSystemService.getProjectMetadata(
      albumId,
      decodeURIComponent(projectName)
    )
    res.json({ success: true, data: metadata })
  } catch (error: any) {
    console.error('Error getting project metadata:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać metadanych' })
  }
})

// Zaktualizuj metadane projektu
router.put('/:albumId/:projectName/metadata', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const { fields } = req.body

    if (!fields) {
      return res.status(400).json({ success: false, error: 'Brak pól do aktualizacji' })
    }

    const metadata = await fileSystemService.updateProjectMetadata(
      albumId,
      decodeURIComponent(projectName),
      fields
    )
    res.json({ success: true, data: metadata })
  } catch (error: any) {
    console.error('Error updating project metadata:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się zaktualizować metadanych' })
  }
})

// Pobierz wszystkie użyte klucze metadanych
router.get('/metadata/all-keys', async (req: Request, res: Response) => {
  try {
    const keys = await fileSystemService.getAllMetadataKeys()
    res.json({ success: true, data: keys })
  } catch (error: any) {
    console.error('Error getting metadata keys:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać kluczy' })
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
