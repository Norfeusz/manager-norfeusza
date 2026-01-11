import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileManagementService } from '../services/file-management-service'
import { MoveFileRequest, RenameFileRequest, DeleteFileRequest, FolderType } from '../../../shared/src/types'

const router = Router()

// Konfiguracja multer dla upload plików
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
})

// Pobierz pliki w folderze
router.get('/:albumId/:projectName/files/:folderType', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName, folderType } = req.params

    const files = await fileManagementService.getFilesInFolder(
      albumId,
      decodeURIComponent(projectName),
      folderType as FolderType
    )

    res.json({ success: true, data: files })
  } catch (error: any) {
    console.error('Error fetching files:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać plików' })
  }
})

// Przenieś plik
router.post('/:albumId/:projectName/files/move', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const { sourcePath, targetFolder, fileType } = req.body as MoveFileRequest

    if (!sourcePath || !targetFolder) {
      return res.status(400).json({ success: false, error: 'Wymagane pola: sourcePath, targetFolder' })
    }

    const result = await fileManagementService.moveFile(
      sourcePath,
      albumId,
      decodeURIComponent(projectName),
      targetFolder,
      fileType
    )

    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error moving file:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przenieść pliku' })
  }
})

// Zmień nazwę pliku
router.post('/:albumId/:projectName/files/rename', async (req: Request, res: Response) => {
  try {
    const { filePath, newName } = req.body as RenameFileRequest

    if (!filePath || !newName) {
      return res.status(400).json({ success: false, error: 'Wymagane pola: filePath, newName' })
    }

    const newPath = await fileManagementService.renameFile(filePath, newName)

    res.json({ success: true, data: { newPath } })
  } catch (error: any) {
    console.error('Error renaming file:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się zmienić nazwy pliku' })
  }
})

// Usuń plik
router.delete('/:albumId/:projectName/files', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body as DeleteFileRequest

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Wymagane pole: filePath' })
    }

    await fileManagementService.deleteFile(filePath)

    res.json({ success: true, data: { message: 'Plik usunięty' } })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się usunąć pliku' })
  }
})

// Upload pliku
router.post('/:albumId/:projectName/files/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params
    const { targetFolder, fileType } = req.body

    if (!req.file || !targetFolder) {
      return res.status(400).json({ success: false, error: 'Wymagane: plik i targetFolder' })
    }

    const result = await fileManagementService.uploadFile(
      req.file,
      albumId,
      decodeURIComponent(projectName),
      targetFolder as FolderType,
      fileType
    )

    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przesłać pliku' })
  }
})

// Otwórz plik w systemie
router.post('/:albumId/:projectName/files/open', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Wymagane pole: filePath' })
    }

    await fileManagementService.openFileInSystem(filePath)

    res.json({ success: true, data: { message: 'Plik otwarty' } })
  } catch (error: any) {
    console.error('Error opening file:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się otworzyć pliku' })
  }
})

export default router
