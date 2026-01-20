import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs-extra'
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

// Pobierz wszystkie pliki w projekcie
router.get('/:albumId/:projectName/all-files', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.params

    const allFiles = await fileManagementService.getAllProjectFiles(
      albumId,
      decodeURIComponent(projectName)
    )

    res.json({ success: true, data: allFiles })
  } catch (error: any) {
    console.error('Error fetching all project files:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać plików' })
  }
})

// Pobierz wszystkie pliki w albumie
router.get('/album/:albumId/all-files', async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params

    const allFiles = await fileManagementService.getAllAlbumFiles(albumId)

    res.json({ success: true, data: allFiles })
  } catch (error: any) {
    console.error('Error fetching all album files:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać plików' })
  }
})

// Pobierz wszystkie pliki we wszystkich albumach
router.get('/all-files', async (req: Request, res: Response) => {
  try {
    const allFiles = await fileManagementService.getAllFiles()

    res.json({ success: true, data: allFiles })
  } catch (error: any) {
    console.error('Error fetching all files:', error)
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

// Szereguj wersje
router.post('/arrange-versions', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName, folderType } = req.body

    if (!albumId || !projectName || !folderType) {
      return res.status(400).json({ success: false, error: 'Wymagane pola: albumId, projectName, folderType' })
    }

    const result = await fileManagementService.arrangeVersions(
      albumId,
      projectName,
      folderType
    )

    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error arranging versions:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się zszeregować wersji' })
  }
})

// Pobierz główną okładkę (main-cover)
router.get('/main-cover', async (req: Request, res: Response) => {
  try {
    const basePath = path.resolve('D:/DATA/Norfeusz')
    const extensions = ['.jpeg', '.jpg', '.png']
    
    for (const ext of extensions) {
      const coverPath = path.join(basePath, `main-cover${ext}`)
      if (await fs.pathExists(coverPath)) {
        return res.sendFile(coverPath)
      }
    }
    
    res.status(404).json({ success: false, error: 'Główna okładka nie została znaleziona' })
  } catch (error: any) {
    console.error('Error fetching main cover:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Pobierz logo
router.get('/logo', async (req: Request, res: Response) => {
  try {
    const logoPath = path.resolve('D:/DATA/Norfeusz/logo.png')
    
    if (await fs.pathExists(logoPath)) {
      return res.sendFile(logoPath)
    }
    
    res.status(404).json({ success: false, error: 'Logo nie zostało znalezione' })
  } catch (error: any) {
    console.error('Error fetching logo:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Pobierz ikonę VSC
router.get('/vsc-icon', async (req: Request, res: Response) => {
  try {
    const iconPath = path.resolve('D:/DATA/Norfeusz/Pliki/images/vsc_icon.svg')
    
    if (await fs.pathExists(iconPath)) {
      res.setHeader('Content-Type', 'image/svg+xml')
      return res.sendFile(iconPath)
    }
    
    res.status(404).json({ success: false, error: 'Ikona VSC nie została znaleziona' })
  } catch (error: any) {
    console.error('Error fetching VSC icon:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Pobierz listę plików ZIP w folderze ZIP Skład
router.get('/zip-archive/list', async (req: Request, res: Response) => {
  try {
    const zipFiles = await fileManagementService.listZipArchives()
    res.json({ success: true, data: zipFiles })
  } catch (error: any) {
    console.error('Error listing ZIP archives:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać listy archiwów' })
  }
})

// Dodaj pliki do archiwum ZIP
router.post('/zip-archive/add', async (req: Request, res: Response) => {
  try {
    const { filePaths, zipName, createNew } = req.body

    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).json({ success: false, error: 'Wymagana lista plików do zapakowania' })
    }

    if (!zipName) {
      return res.status(400).json({ success: false, error: 'Wymagana nazwa archiwum' })
    }

    const result = await fileManagementService.addFilesToZipArchive(filePaths, zipName, createNew)
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error adding files to ZIP:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się dodać plików do archiwum' })
  }
})

export default router
