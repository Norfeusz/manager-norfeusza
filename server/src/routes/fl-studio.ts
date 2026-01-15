import { Router, Request, Response } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs-extra'
import path from 'path'

const execAsync = promisify(exec)
const router = Router()
const BASE_PATH = 'D:\\DATA\\Norfeusz'
const FL_STUDIO_PATH = 'D:\\FL\\FL64.exe'
const FL_TEMPLATE_PATH = 'D:\\FL\\Data\\Templates\\Empty\\Empty.flp'

// Transliteracja polskich znaków
function transliterate(text: string): string {
  const map: Record<string, string> = {
    'ą': 'a', 'Ą': 'A',
    'ć': 'c', 'Ć': 'C',
    'ę': 'e', 'Ę': 'E',
    'ł': 'l', 'Ł': 'L',
    'ń': 'n', 'Ń': 'N',
    'ó': 'o', 'Ó': 'O',
    'ś': 's', 'Ś': 'S',
    'ź': 'z', 'Ź': 'Z',
    'ż': 'z', 'Ż': 'Z'
  }
  
  return text.split('').map(char => map[char] || char).join('')
}

// Generuje nazwę pliku projektu FL
function generateFLProjectName(projectName: string, folderPath: string): string {
  // Transliteracja i normalizacja nazwy projektu
  const normalized = transliterate(projectName)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
  
  // Znajdź następny dostępny numer
  let counter = 1
  let fileName = `${normalized}-fl-${counter.toString().padStart(3, '0')}.flp`
  let filePath = path.join(folderPath, fileName)
  
  while (fs.existsSync(filePath)) {
    counter++
    fileName = `${normalized}-fl-${counter.toString().padStart(3, '0')}.flp`
    filePath = path.join(folderPath, fileName)
  }
  
  return fileName
}

// Tworzy projekt FL Studio z szablonu
async function createEmptyFLProject(filePath: string, backupPath: string): Promise<void> {
  // Kopiujemy pusty szablon FL Studio
  await fs.copy(FL_TEMPLATE_PATH, filePath)
  
  // Upewnij się, że folder backupów istnieje
  await fs.ensureDir(backupPath)
}

// POST /api/fl-studio/create-project
// Tworzy nowy projekt FL Studio i otwiera go
router.post('/create-project', async (req: Request, res: Response) => {
  try {
    const { albumId, projectName } = req.body
    
    if (!albumId || !projectName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak wymaganych parametrów: albumId, projectName' 
      })
    }
    
    // Ścieżka do folderu "Projekt FL"
    const projectFolderPath = path.join(BASE_PATH, albumId, projectName, 'Projekt FL')
    
    // Sprawdź czy folder istnieje
    if (!(await fs.pathExists(projectFolderPath))) {
      return res.status(404).json({ 
        success: false, 
        error: 'Folder "Projekt FL" nie istnieje' 
      })
    }
    
    // Generuj nazwę pliku
    const fileName = generateFLProjectName(projectName, projectFolderPath)
    const filePath = path.join(projectFolderPath, fileName)
    
    // Folder na backupy (w tym samym folderze)
    const backupPath = path.join(projectFolderPath, 'Backups')
    
    // Utwórz projekt FL z szablonu
    await createEmptyFLProject(filePath, backupPath)
    
    console.log(`✅ Utworzono projekt FL Studio: ${fileName}`)
    console.log(`📁 Ścieżka: ${filePath}`)
    console.log(`📁 Backupy: ${backupPath}`)
    
    // Otwórz FL Studio z nowym projektem
    const command = `"${FL_STUDIO_PATH}" "${filePath}"`
    console.log(`🎹 Uruchamiam FL Studio: ${command}`)
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Błąd uruchamiania FL Studio:', error)
        console.error('stderr:', stderr)
      } else {
        console.log('✅ FL Studio uruchomione pomyślnie')
        if (stdout) console.log('stdout:', stdout)
      }
    })
    
    res.json({ 
      success: true, 
      fileName,
      backupPath,
      message: 'Projekt FL Studio utworzony i otwarty'
    })
    
  } catch (error: any) {
    console.error('Błąd tworzenia projektu FL:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

export default router
