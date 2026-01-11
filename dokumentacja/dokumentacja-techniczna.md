# Dokumentacja Techniczna - Manager Norfa

## Przegląd Projektu

Manager Norfa to narzędzie webowe służące do zarządzania projektami muzycznymi i procesem twórczym. Umożliwia organizację projektów muzycznych, zarządzanie plikami audio, tekstami oraz automatyzację backupów.

## Cel Projektu

- Zarządzanie projektami muzycznymi w ustrukturyzowany sposób
- Automatyczne tworzenie struktury folderów dla nowych projektów
- Organizacja plików FL Studio, Reaper, tekstów, demo
- Automatyzacja nazewnictwa plików
- System backupów do Google Drive

## Stack Technologiczny

### Frontend

- **React 18+** - biblioteka UI
- **Vite** - build tool
- **TypeScript** - typowanie
- **Tailwind CSS** - stylowanie
- **React Router** - routing

### Backend

- **Node.js** - runtime
- **Express** - framework HTTP
- **TypeScript** - typowanie
- **fs-extra** - operacje na plikach

### API

- REST API
- Komunikacja przez HTTP
- Format JSON

## Struktura Projektu

```
Manager Norfa/
├── client/                          # Frontend
│   ├── src/
│   │   ├── App.tsx                 # Główny komponent z routingiem
│   │   ├── main.tsx                # Entry point
│   │   ├── index.css               # Style globalne
│   │   ├── components/             # Komponenty React
│   │   │   ├── AlbumGrid.tsx      # ✅ Kafelki albumów (strona główna)
│   │   │   ├── ProjectList.tsx    # ✅ Lista projektów w albumie
│   │   │   └── ProjectView.tsx    # ✅ Widok projektu (8 kafelków)
│   │   └── services/               # Serwisy API
│   │       └── api.ts              # ✅ Komunikacja z backendem
│   ├── index.html
│   ├── vite.config.ts              # Port 5175, proxy do 4001
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Backend
│   ├── src/
│   │   ├── index.ts                # ✅ Entry point + routing
│   │   ├── routes/                 # Endpointy API
│   │   │   ├── albums.ts           # ✅ API dla albumów
│   │   │   └── projects.ts         # ✅ API dla projektów
│   │   └── services/               # Logika biznesowa
│   │       └── file-system-service.ts  # ✅ Zarządzanie folderami
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                          # Kod wspólny
│   └── src/
│       ├── index.ts
│       └── types.ts                # ✅ Wspólne typy TypeScript
│
├── dokumentacja/                    # Dokumentacja
│   ├── briefing-dla-agenta.md
│   ├── dokumentacja-techniczna.md
│   └── Opis projektu.txt
│
├── package.json                     # Root package.json (workspace)
├── .gitignore
└── README.md
```

## Struktura Danych Muzycznych

### Hierarchia Projektów

```
album/
└── projekt (utwór)/
    ├── FL Studio/       # Projekty FL Studio
    ├── Reaper/          # Projekty Reaper
    ├── Demo bit/        # Demo bitów
    ├── Demo wokal/      # Demo wokali
    ├── Demo tekst/      # Demo tekstów
    ├── pliki/           # Pliki pomocnicze
    └── gotowe/          # Finalne wersje
```

### Album "Robocze"

- Domyślny album dla nowych projektów
- Projekty mogą być później przenoszone do konkretnych albumów

## Główne Funkcjonalności

### 1. Tworzenie Nowego Projektu

- Podanie nazwy projektu (utworu)
- Automatyczne utworzenie struktury folderów
- Domyślne umieszczenie w albumie "Robocze"
- Generowanie metadanych projektu

### 2. Zarządzanie Strukturą Folderów

- UI do nawigacji po strukturze projektu
- Tworzenie nowych projektów FL Studio/Reaper
- Organizacja plików w odpowiednich podfolderach
- Intuicyjne przenoszenie plików między folderami

### 3. Praca z Plikami Audio

- Automatyczne rozpoznawanie renderów z FL/Reaper
- Organizacja plików audio (wav, mp3, flac)
- Wersjonowanie plików
- Możliwość ręcznego przenoszenia plików

### 4. Zarządzanie Tekstami

- Tworzenie i edycja tekstów utworów
- Wersjonowanie tekstów
- Export tekstów do różnych formatów

### 5. Przenoszenie Między Albumami

- UI do przenoszenia projektów między albumami
- Zachowanie struktury podczas przenoszenia
- Historia zmian

### 6. System Backupów

- Porównanie zawartości lokalnej z Google Drive
- Automatyczne wykrywanie zmian
- Synchronizacja jednym kliknięciem
- Nadpisywanie zmienionych plików
- Log operacji backupu

## API Endpointy (Zaimplementowane)

### Projekty

- ✅ `POST /api/projects` - tworzenie nowego projektu
  - Request body: `{ name: string, albumId?: string }`
  - Automatyczne tworzenie struktury 8 folderów
  - Domyślny album: "Robocze"
  - Response: obiekt Project z pełną strukturą

### Albumy

- ✅ `GET /api/albums` - lista wszystkich albumów
  - Response: tablica obiektów Album z licznikiem projektów
  - Sortowanie: "Robocze" zawsze pierwszy
- ✅ `GET /api/albums/:id/projects` - projekty w albumie
  - Response: tablica obiektów Project
- ✅ `POST /api/albums` - tworzenie nowego albumu
  - Request body: `{ name: string }`

### Health Check

- ✅ `GET /api/health` - status API
  - Response: `{ status: "ok", message: string }`

### Pliki (Do Implementacji w Fazie 2)

- `GET /api/projects/:id/files` - pliki projektu
- `POST /api/projects/:id/files/move` - przenoszenie plików
- `GET /api/projects/:id/structure` - struktura folderów projektu

### Backup (Do Implementacji w Fazie 4)

- `GET /api/backup/status` - status backupu
- `POST /api/backup/compare` - porównanie lokalne vs Google Drive
- `POST /api/backup/sync` - synchronizacja
- `GET /api/backup/history` - historia backupów

## Typy Danych (Zaimplementowane)

```typescript
// Zaimplementowane typy w shared/src/types.ts

export interface Album {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  projectCount?: number;
}

export interface Project {
  id: string;
  name: string;
  albumId: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  structure: FolderStructure;
}

export interface FolderStructure {
  projektFL: string;
  projektReaper: string;
  tekst: string;
  demoBit: string;
  demoNawijka: string;
  demoUtwor: string;
  gotowe: string;
  pliki: string;
}

export interface CreateProjectRequest {
  name: string;
  albumId?: string;
}

export interface CreateAlbumRequest {
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Typy do implementacji w przyszłości:

interface AudioFile {
  id: string;
  name: string;
  path: string;
  size: number;
  format: "wav" | "mp3" | "flac";
  createdAt: Date;
}

interface BackupStatus {
  lastBackup: Date;
  changedFiles: string[];
  needsSync: boolean;
}
```

## Zmienne Środowiskowe

### Server (.env)

```
PORT=4001
NODE_ENV=development
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
```

## Ścieżki Systemowe

- **Główny folder projektów**: `D:\DATA\Norfeusz\`
- **Domyślny album**: `D:\DATA\Norfeusz\Robocze\`
- **Struktura projektu**: `D:\DATA\Norfeusz\[Album]\[Projekt]\[8 podfolderów]`

### 8 podfolderów każdego projektu:

1. `Projekt FL` - projekty FL Studio
2. `Projekt Reaper` - projekty Reaper
3. `Tekst` - pliki tekstowe z tekstami
4. `Demo bit` - demo bitów (mp3, wav)
5. `Demo nawijka` - demo wokali (mp3, wav)
6. `Demo utwor` - demo kompletne (mp3, wav)
7. `Gotowe` - finalne wersje
8. `Pliki` - inne pliki pomocnicze

## Uruchomienie Projektu

### Instalacja

```bash
# Backend
cd server
npm install

# Frontend (opcjonalnie, jeśli potrzeba)
cd ../client
npm install
```

### Development

```bash
# Backend
cd server
npm run dev

# Frontend (w nowym terminalu)
cd client
npm run dev
```

- Frontend: http://localhost:5175
- Backend: http://localhost:4001

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Zasady Rozwoju

1. **Modularność** - małe, wyspecjalizowane pliki
2. **Typowanie** - wszystko w TypeScript z pełnym typowaniem
3. **Brak domysłów** - pytaj o niejasności
4. **Dokumentacja** - aktualizuj ten plik przy każdej zmianie
5. **Testy** - (do wdrożenia w przyszłości)

## Integracje (Przyszłość)

### Google Drive API

- Autoryzacja OAuth 2.0
- Porównywanie plików
- Upload/download plików
- Metadane plików

### FL Studio / Reaper

- Potencjalna integracja z projektami DAW
- Odczyt metadanych projektów
- Automatyczne wykrywanie nowych projektów

## Stan Projektu

### ✅ Faza 1: Podstawy (UKOŃCZONA)

1. ✅ Widok albumów (kafelki)
2. ✅ Widok utworów w albumie (lista)
3. ✅ Tworzenie nowego projektu (struktura folderów)
4. ✅ Widok projektu (kafelki podfolderów)
5. ✅ Backend API + File System Service
6. ✅ Routing i nawigacja

### 📋 Faza 2: Zarządzanie Plikami (Następna)

1. Przeglądanie zawartości podfolderów
2. System wersjonowania nazw
3. Przenoszenie plików między folderami
4. Zmiana nazw (z zachowaniem konwencji)
5. Upload plików (drag & drop)

### 📋 Faza 3: Multimedia

6. Odtwarzacz audio (demo/gotowe)
7. Edytor tekstów
8. Integracja z Windows Media Player

### 📋 Faza 4: Zaawansowane

9. Import tekstów z Android backup
10. Automatyzacja FL Studio / Reaper (badanie możliwości)
11. System backupów (Google Drive)
12. Przenoszenie projektów między albumami

## Konwencja Nazewnictwa (Do Implementacji w Fazie 2)

**Format**: `nazwa_utworu-typ-kategoria-wersja`

Przykłady:

- `moj_utwor-projekt_bit-001.flp`
- `moj_utwor-projekt_nawijka-002.rpp`
- `moj_utwor-tekst-003.txt`
- `moj_utwor-bit_demo-001.wav`
- `moj_utwor-nawijka_demo-002.mp3`
- `moj_utwor-utwor_demo-001.mp3`
- `moj_utwor-bit_gotowy-001.mp3`
- `moj_utwor-gotowy-001.mp3`

**Wersjonowanie**: Automatyczny increment (001 → 002 → 003...)

## Uwagi Techniczne

- Używamy **monorepo** z workspace npm
- Shared types w folderze `shared/`
- Proxy w Vite przekierowuje `/api` na backend
- Backend działa na porcie **4001**, frontend na **5175**
- Manager Norfa używa innych portów niż Manager Plików (4001/5175 vs 5001/3001)
- File System Service automatycznie inicjalizuje album "Robocze"
- Wszystkie operacje na plikach przez fs-extra
- UUID dla ID projektów (generowane runtime)
- ID albumów = nazwa folderu

## Zależności

### Backend

- express, cors, dotenv
- fs-extra - operacje na plikach
- uuid - generowanie ID
- tsx - TypeScript execution

### Frontend

- React 18 + React Router
- Vite - build tool
- Tailwind CSS - stylowanie

## Kontakt z Kierownikiem

Przy wątpliwościach zawsze pytaj kierownika projektu przed implementacją.

---

**Ostatnia aktualizacja**: 11 stycznia 2026 - Ukończono Fazę 1
