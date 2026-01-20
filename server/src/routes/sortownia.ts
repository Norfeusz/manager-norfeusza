import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs-extra'
import { fileManagementService } from '../services/file-management-service'
import { FolderType } from '../../../shared/src/types'

const router = Router()

// Konfiguracja multer dla upload plików
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
})

// Pobierz pliki z sortowni
router.get('/', async (_req: Request, res: Response) => {
  try {
    const files = await fileManagementService.getSortowniaFiles()
    res.json({ success: true, data: files })
  } catch (error: any) {
    console.error('Error fetching sortownia files:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się pobrać plików z sortowni' })
  }
})

// Upload pliku do sortowni
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Brak pliku' })
    }

    const result = await fileManagementService.uploadToSortownia(req.file)
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error uploading to sortownia:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przesłać pliku' })
  }
})

// Przenieś plik z sortowni do projektu
router.post('/move-to-project', async (req: Request, res: Response) => {
  try {
    const { fileName, albumId, projectName, targetFolder, fileType, customName, useSciezkiFolder } = req.body

    if (!fileName || !albumId || !projectName || !targetFolder) {
      return res.status(400).json({
        success: false,
        error: 'Wymagane pola: fileName, albumId, projectName, targetFolder',
      })
    }

    const result = await fileManagementService.moveFromSortownia(
      fileName,
      albumId,
      projectName,
      targetFolder as FolderType,
      fileType,
      customName,
      useSciezkiFolder
    )

    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error moving from sortownia:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przenieść pliku' })
  }
})

// Usuń plik z sortowni
router.delete('/', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Wymagane pole: filePath' })
    }

    await fileManagementService.deleteFile(filePath)
    res.json({ success: true, data: { message: 'Plik usunięty z sortowni' } })
  } catch (error: any) {
    console.error('Error deleting from sortownia:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się usunąć pliku' })
  }
})

// Otwórz plik z sortowni
router.post('/open', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Wymagane pole: filePath' })
    }

    await fileManagementService.openFileInSystem(filePath)
    res.json({ success: true, data: { message: 'Plik otwarty' } })
  } catch (error: any) {
    console.error('Error opening file from sortownia:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się otworzyć pliku' })
  }
})

// Przenieś plik z sortowni do folderu głównego (Bity, Pliki, Teksty)
router.post('/move-to-main-folder', async (req: Request, res: Response) => {
  try {
    const { fileName, targetFolder } = req.body

    if (!fileName || !targetFolder) {
      return res.status(400).json({
        success: false,
        error: 'Wymagane pola: fileName, targetFolder',
      })
    }

    const BASE_PATH = 'D:\\DATA\\Norfeusz'
    const sourcePath = path.join(BASE_PATH, 'Sortownia', fileName)

    if (!(await fs.pathExists(sourcePath))) {
      return res.status(404).json({ success: false, error: 'Plik nie istnieje w sortowni' })
    }

    // Dozwolone główne foldery (ale targetFolder może zawierać podfoldery np. "Bity/subfolder")
    const mainFolder = targetFolder.split('/')[0]
    const allowedFolders = ['Bity', 'Pliki', 'Teksty']
    if (!allowedFolders.includes(mainFolder)) {
      return res.status(400).json({ success: false, error: 'Nieprawidłowy folder docelowy' })
    }

    const targetPath = path.join(BASE_PATH, targetFolder, path.basename(fileName))

    // Upewnij się że folder docelowy istnieje
    await fs.ensureDir(path.dirname(targetPath))

    // Sprawdź czy plik o takiej nazwie już istnieje
    if (await fs.pathExists(targetPath)) {
      return res.status(409).json({ 
        success: false, 
        error: `Plik o nazwie "${path.basename(fileName)}" już istnieje w folderze ${targetFolder}` 
      })
    }

    await fs.move(sourcePath, targetPath)

    res.json({ 
      success: true, 
      data: { 
        message: `Plik przeniesiony do ${targetFolder}`,
        newPath: targetPath 
      } 
    })
  } catch (error: any) {
    console.error('Error moving to main folder:', error)
    res.status(500).json({ success: false, error: error.message || 'Nie udało się przenieść pliku' })
  }
})

export default router
