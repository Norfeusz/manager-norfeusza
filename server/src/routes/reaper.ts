import { Router } from 'express'
import path from 'path'
import fs from 'fs-extra'
import { exec } from 'child_process'

const router = Router()

const BASE_PATH = 'D:\\DATA\\Norfeusz'
const REAPER_PATH = 'C:\\Program Files\\REAPER (x64)\\reaper.exe'

// Podstawowy szablon projektu Reaper (.rpp)
const REAPER_TEMPLATE = `<REAPER_PROJECT 0.1 "7.0/win64" 1234567890
  RIPPLE 0
  GROUPOVERRIDE 0 0 0
  AUTOXFADE 1
  ENVATTACH 3
  POOLEDENVATTACH 0
  MIXERUIFLAGS 11 48
  PEAKGAIN 1
  FEEDBACK 0
  PANLAW 1
  PROJOFFS 0 0 0
  MAXPROJLEN 0 600
  GRID 3199 8 1 8 1 0 0 0
  TIMEMODE 1 5 -1 30 0 0 -1
  VIDEO_CONFIG 0 0 256
  PANMODE 3
  CURSOR 0
  ZOOM 100 0 0
  VZOOMEX 6 0
  USE_REC_CFG 0
  RECMODE 1
  SMPTESYNC 0 30 100 40 1000 300 0 0 1 0 0
  LOOP 0
  LOOPGRAN 0 4
  RECORD_PATH "" ""
  <RECORD_CFG
    ZXZhdxgAAA==
  >
  <APPLYFX_CFG
  >
  RENDER_FILE ""
  RENDER_PATTERN ""
  RENDER_FMT 0 2 0
  RENDER_1X 0
  RENDER_RANGE 1 0 0 18 1000
  RENDER_RESAMPLE 3 0 1
  RENDER_ADDTOPROJ 0
  RENDER_STEMS 0
  RENDER_DITHER 0
  TIMELOCKMODE 1
  TEMPOENVLOCKMODE 1
  ITEMMIX 0
  DEFPITCHMODE 589824 0
  TAKELANE 1
  SAMPLERATE 44100 0 0
  <RENDER_CFG
    ZXZhdxgAAA==
  >
  LOCK 1
  <METRONOME 6 2
    VOL 0.25 0.125
    FREQ 800 1600 1
    BEATLEN 4
    SAMPLES "" ""
    PATTERN 2863311530 2863311529
    MULT 1
  >
  GLOBAL_AUTO -1
  TEMPO 120 4 4
  PLAYRATE 1 0 0.25 4
  SELECTION 0 0
  SELECTION2 0 0
  MASTERAUTOMODE 0
  MASTERTRACKHEIGHT 0 0
  MASTERPEAKCOL 16576
  MASTERMUTESOLO 0
  MASTERTRACKVIEW 0 0.6667 0.5 0.5 -1 -1 -1 0 0 0 0 0 0
  MASTER_NCH 2 2
  MASTER_VOLUME 1 0 -1 -1 1
  MASTER_FX 1
  MASTER_SEL 0
  <MASTERPLAYSPEEDENV
    EGUID {00000000-0000-0000-0000-000000000000}
    ACT 0 -1
    VIS 0 1 1
    LANEHEIGHT 0 0
    ARM 0
    DEFSHAPE 0 -1 -1
  >
  <TEMPOENVEX
    EGUID {00000000-0000-0000-0000-000000000000}
    ACT 0 -1
    VIS 1 0 1
    LANEHEIGHT 0 0
    ARM 0
    DEFSHAPE 1 -1 -1
  >
>
`

function transliterate(text: string): string {
  const map: { [key: string]: string } = {
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

function generateReaperProjectName(projectName: string, projectFolder: string): string {
  // Normalizuj nazwę - zamień polskie znaki i spacje na podkreślniki
  const normalized = transliterate(projectName)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
  
  // Znajdź następny numer
  let counter = 1
  let fileName: string
  
  do {
    const counterStr = counter.toString().padStart(3, '0')
    fileName = `${normalized}-reaper-${counterStr}.rpp`
    counter++
  } while (fs.existsSync(path.join(projectFolder, fileName)))
  
  return fileName
}

async function createReaperProject(filePath: string, backupPath: string): Promise<void> {
  // Utwórz plik projektu z szablonem
  await fs.writeFile(filePath, REAPER_TEMPLATE, 'utf-8')
  
  // Utwórz folder na backupy jeśli nie istnieje
  await fs.ensureDir(backupPath)
}

// Endpoint do tworzenia nowego projektu Reaper
router.post('/create-project', async (req, res) => {
  try {
    const { albumId, projectName } = req.body
    
    if (!albumId || !projectName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak wymaganych parametrów: albumId, projectName' 
      })
    }
    
    // Ścieżka do folderu projektu
    const projectFolderPath = path.join(BASE_PATH, albumId, projectName, 'Projekt Reaper')
    
    // Sprawdź czy folder istnieje
    if (!(await fs.pathExists(projectFolderPath))) {
      return res.status(404).json({ 
        success: false, 
        error: 'Folder "Projekt Reaper" nie istnieje' 
      })
    }
    
    // Generuj nazwę pliku
    const fileName = generateReaperProjectName(projectName, projectFolderPath)
    const filePath = path.join(projectFolderPath, fileName)
    
    // Folder na backupy (w tym samym folderze)
    const backupPath = path.join(projectFolderPath, 'Backups')
    
    // Utwórz projekt Reaper
    await createReaperProject(filePath, backupPath)
    
    console.log(`✅ Utworzono projekt Reaper: ${fileName}`)
    console.log(`📁 Ścieżka: ${filePath}`)
    console.log(`📁 Backupy: ${backupPath}`)
    
    // Otwórz Reaper z nowym projektem
    const command = `"${REAPER_PATH}" "${filePath}"`
    console.log(`🎚️ Uruchamiam Reaper: ${command}`)
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Błąd uruchamiania Reaper:', error)
        console.error('stderr:', stderr)
      } else {
        console.log('✅ Reaper uruchomiony pomyślnie')
        if (stdout) console.log('stdout:', stdout)
      }
    })
    
    res.json({ 
      success: true, 
      fileName,
      backupPath,
      message: 'Projekt Reaper utworzony i otwarty'
    })
    
  } catch (error: any) {
    console.error('Błąd tworzenia projektu Reaper:', error)
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Nieznany błąd' 
    })
  }
})

export default router
