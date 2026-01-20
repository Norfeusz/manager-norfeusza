import { Router, Request, Response } from 'express'
import { exec } from 'child_process'
import path from 'path'

const router = Router()

const PROJECT_PATH = path.resolve('D:/DATA')
const NORFEUSZ_PATH = path.resolve('D:/DATA/Norfeusz')

// Otwórz projekt w Visual Studio Code
router.post('/open-vscode', async (_req: Request, res: Response) => {
  try {
    const command = `code "${PROJECT_PATH}"`
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Błąd uruchamiania VSCode:', error)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          success: false, 
          error: 'Nie udało się otworzyć VSCode. Upewnij się że jest zainstalowany.' 
        })
      }
      
      console.log('✅ Otwarto projekt w VSCode')
      if (stdout) console.log('stdout:', stdout)
    })
    
    res.json({ 
      success: true, 
      message: 'Otwieranie projektu w VSCode...' 
    })
  } catch (error: any) {
    console.error('Błąd otwierania VSCode:', error)
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Nieznany błąd' 
    })
  }
})

// Otwórz folder Norfeusz w Explorer
router.post('/open-folder', async (_req: Request, res: Response) => {
  try {
    const command = `explorer "${NORFEUSZ_PATH}"`
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Błąd otwierania folderu:', error)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          success: false, 
          error: 'Nie udało się otworzyć folderu' 
        })
      }
      
      console.log('✅ Otwarto folder Norfeusz')
      if (stdout) console.log('stdout:', stdout)
    })
    
    res.json({ 
      success: true, 
      message: 'Otwieranie folderu Norfeusz...' 
    })
  } catch (error: any) {
    console.error('Błąd otwierania folderu:', error)
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Nieznany błąd' 
    })
  }
})

export default router
