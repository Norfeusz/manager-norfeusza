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
│   │   │   ├── AlbumGrid.tsx      # ✅ Kafelki albumów (strona główna) + drag&drop
│   │   │   ├── ProjectList.tsx    # ✅ Lista projektów w albumie
│   │   │   ├── ProjectView.tsx    # ✅ Widok projektu (8 kafelków)
│   │   │   ├── FolderView.tsx     # ✅ Widok folderu z plikami
│   │   │   ├── Sortownia.tsx      # ✅ Sortownia - pliki oczekujące
│   │   │   └── SimpleFolderView.tsx # ✅ Przeglądarka folderów (Bity/Teksty/Pliki)
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
│   │   │   ├── projects.ts         # ✅ API dla projektów
│   │   │   ├── files.ts            # ✅ API dla plików + covery + logo
│   │   │   ├── covers.ts           # ✅ API dla okładek
│   │   │   ├── sortownia.ts        # ✅ API dla sortowni
│   │   │   └── simple-folders.ts   # ✅ API dla prostych folderów
│   │   └── services/               # Logika biznesowa
│   │       ├── file-system-service.ts  # ✅ Zarządzanie folderami
│   │       └── file-management-service.ts  # ✅ Operacje na plikach
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

### 1. Strona Główna - Organizacja Albumów

- **Trzy sekcje**: Gotowe, Rzeźbione, Pliki
- **Drag & Drop**: Przeciąganie albumów między sekcjami i zmiana kolejności
- **Kategoryzacja**: Albumy z kategorią "gotowe" vs reszta (rzeźbione)
- **Tło**: main-cover.jpeg jako tło z efektem blur (10px)
- **Logo**: logo.png jako nagłówek strony
- **Tryb organizacji**: Przycisk "Organizuj" do aktywacji drag & drop
- **Okładki albumów**: Obsługa cover.jpg, cover.jpeg, cover.png
- **Licznik projektów**: Wyświetlanie ilości projektów w każdym albumie

### 2. Sekcja Pliki

Cztery podfoldery z bezpośrednim dostępem:

- **Bity** (folder: `Norfeusz/Bity/`)
- **Teksty** (folder: `Norfeusz/Teksty/`)
- **Pliki** (folder: `Norfeusz/Pliki/`)
- **Sortownia** (folder: `Norfeusz/Sortownia/`)

Funkcje:

- Przeglądanie zawartości z nawigacją do podfolderów
- Breadcrumbs pokazujące aktualną ścieżkę
- Przycisk powrotu do katalogu nadrzędnego
- Ikona 📁 dla folderów
- Wyświetlanie rozmiaru i daty modyfikacji plików

### 3. Sortownia - Miejsce Tymczasowe

- **Upload plików**: Drag & drop lub wybór plików
- **Przeglądanie**: Lista plików z previewem
- **Przypisywanie**: Przenoszenie plików do projektów
- **Multi-select**: Zaznaczanie wielu plików naraz
- **Nawigacja w podfolderach**: Pełna obsługa zagnieżdżonych folderów
- **Bulk operations**: Usuwanie/przypisywanie wielu plików jednocześnie

### 4. Tworzenie Nowego Projektu

- Podanie nazwy projektu (utworu)
- Opcjonalna numeracja (automatyczna lub ręczna)
- Automatyczne utworzenie struktury folderów
- Domyślne umieszczenie w albumie "Robocze"
- Generowanie metadanych projektu

### 5. Zarządzanie Strukturą Folderów

- UI do nawigacji po strukturze projektu
- Tworzenie nowych projektów FL Studio/Reaper
- Organizacja plików w odpowiednich podfolderach
- Intuicyjne przenoszenie plików między folderami
- Zmiana nazw plików z zachowaniem wersjonowania

### 6. Praca z Plikami Audio

- Automatyczne rozpoznawanie renderów z FL/Reaper
- Organizacja plików audio (wav, mp3, flac)
- Wersjonowanie plików
- Upload przez drag & drop
- Otwieranie plików w systemie
- Usuwanie plików

### 7. Zarządzanie Okładkami

- **Upload okładek**: Dla albumów i projektów
- **Obsługa formatów**: .jpg, .jpeg, .png
- **Automatyczne wykrywanie**: Priorytet .jpg → .jpeg → .png
- **Tło**: Okładki albumów jako tło z efektem blur (10px)
- **Fallback**: Okładka albumu jako tło projektów bez własnej okładki
- **Usuwanie**: Opcja usunięcia okładki

### 8. Zarządzanie Projektami

- **Zmiana nazwy**: Opcja z zachowaniem struktury
- **Przenoszenie**: Między albumami z wyborem co zrobić z plikami
- **Numeracja**: Przypisywanie/zmiana numeru projektu
- **Usuwanie**: Z opcją przeniesienia plików do sortowni
- **Tryb organizacji**: Zmiana kolejności projektów w albumie

## API Endpointy (Zaimplementowane)

### Albumy

- ✅ `GET /api/albums` - lista wszystkich albumów
  - Response: tablica obiektów Album z licznikiem projektów i kategorią
  - Wykluczone foldery: Sortownia, Bity, Teksty, Pliki
- ✅ `GET /api/albums/:id/projects` - projekty w albumie
  - Response: tablica obiektów Project
- ✅ `POST /api/albums` - tworzenie nowego albumu
  - Request body: `{ name: string }`
- ✅ `PUT /api/albums/:albumId` - zmiana nazwy albumu
  - Request body: `{ newName: string }`
- ✅ `DELETE /api/albums/:albumId` - usunięcie albumu
  - Query params: `?keepFiles=true/false`
- ✅ `PUT /api/albums/:albumId/category` - zmiana kategorii albumu
  - Request body: `{ category: 'gotowe' | 'rzezbione' }`

### Projekty

- ✅ `POST /api/projects` - tworzenie nowego projektu
  - Request body: `{ name: string, albumId?: string, useNumbering?: boolean, numberingMode?: 'auto'|'manual', manualNumber?: string }`
  - Automatyczne tworzenie struktury 8 folderów
  - Domyślny album: "Robocze"
  - Response: obiekt Project z pełną strukturą
- ✅ `GET /api/projects/:albumId` - lista projektów w albumie
- ✅ `PUT /api/projects/:albumId/:projectName` - zmiana nazwy projektu
  - Request body: `{ newName: string }`
- ✅ `DELETE /api/projects/:albumId/:projectName` - usunięcie projektu
  - Request body: `{ moveFilesToSortownia: boolean }`
- ✅ `PUT /api/projects/:albumId/:projectName/move` - przeniesienie projektu
  - Request body: `{ targetAlbumId: string, moveFiles: boolean }`
- ✅ `PUT /api/projects/:albumId/:projectName/number` - przypisanie/zmiana numeru
  - Request body: `{ number: string }`

### Pliki

- ✅ `GET /api/files/:albumId/:projectName/files/:folderType` - pliki w folderze
  - folderType: 'Projekt FL' | 'Projekt Reaper' | 'Tekst' | etc.
- ✅ `POST /api/files/:albumId/:projectName/files/move` - przenoszenie pliku
  - Request body: `{ sourcePath: string, targetFolder: string, fileType?: string }`
- ✅ `PUT /api/files/:albumId/:projectName/files/rename` - zmiana nazwy pliku
  - Request body: `{ oldPath: string, newName: string }`
- ✅ `DELETE /api/files/:albumId/:projectName/files` - usunięcie pliku
  - Request body: `{ filePath: string }`
- ✅ `POST /api/files/:albumId/:projectName/files/upload` - upload pliku
  - multipart/form-data z polem `file` i `folderType`
- ✅ `POST /api/files/:albumId/:projectName/files/open` - otwarcie pliku w systemie
  - Request body: `{ filePath: string }`
- ✅ `GET /api/files/main-cover` - pobranie main-cover.jpeg
- ✅ `GET /api/files/logo` - pobranie logo.png

### Okładki (Covers)

- ✅ `POST /api/covers/albums/:albumId/upload` - upload okładki albumu
  - multipart/form-data z polem `cover`
  - Obsługa: .jpg, .jpeg, .png
- ✅ `POST /api/covers/projects/:albumId/:projectName/upload` - upload okładki projektu
- ✅ `GET /api/covers/albums/:albumId/cover.:ext` - pobranie okładki albumu
  - ext: jpg, jpeg, png
- ✅ `GET /api/covers/projects/:albumId/:projectName/cover.:ext` - pobranie okładki projektu
- ✅ `DELETE /api/covers/albums/:albumId/cover` - usunięcie okładki albumu
- ✅ `DELETE /api/covers/projects/:albumId/:projectName/cover` - usunięcie okładki projektu

### Sortownia

- ✅ `GET /api/sortownia/files` - lista plików w sortowni
- ✅ `POST /api/sortownia/upload` - upload pliku do sortowni
  - multipart/form-data z polem `file`
- ✅ `DELETE /api/sortownia/files` - usunięcie pliku z sortowni
  - Request body: `{ filePath: string }`
- ✅ `POST /api/sortownia/assign` - przypisanie pliku do projektu
  - Request body: `{ fileName: string, albumId: string, projectName: string, targetFolder: string, fileType?: string, customFileName?: string }`
- ✅ `POST /api/sortownia/open` - otwarcie pliku w systemie
  - Request body: `{ filePath: string }`

### Proste Foldery (SimpleFolders)

- ✅ `GET /api/simple-folders/:folderPath/files` - zawartość folderu
  - folderPath: relatywna ścieżka od D:/DATA/Norfeusz
  - Obsługa zagnieżdżonych folderów (np. "Sortownia/subfolder")
  - Response: lista plików i folderów z metadanymi

### Health Check

- ✅ `GET /api/health` - status API
  - Response: `{ status: "ok", message: string }`

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

### ✅ Faza 1: Podstawy (UKOŃCZONA - 11 stycznia 2026)

1. ✅ Widok albumów (kafelki)
2. ✅ Widok utworów w albumie (lista)
3. ✅ Tworzenie nowego projektu (struktura folderów)
4. ✅ Widok projektu (kafelki podfolderów)
5. ✅ Backend API + File System Service
6. ✅ Routing i nawigacja

### ✅ Faza 2: Zarządzanie Plikami (UKOŃCZONA - 14 stycznia 2026)

1. ✅ Przeglądanie zawartości podfolderów
2. ✅ System wersjonowania nazw
3. ✅ Przenoszenie plików między folderami
4. ✅ Zmiana nazw (z zachowaniem konwencji)
5. ✅ Upload plików (drag & drop)
6. ✅ Otwieranie plików w systemie
7. ✅ Usuwanie plików
8. ✅ Sortownia - miejsce tymczasowe na pliki
9. ✅ Upload do sortowni
10. ✅ Przypisywanie plików z sortowni do projektów
11. ✅ Multi-select w sortowni
12. ✅ Nawigacja w podfolderach sortowni

### ✅ Faza 3: Organizacja i UI (UKOŃCZONA - 14 stycznia 2026)

1. ✅ Drag & drop organizacja albumów
2. ✅ Kategorie albumów (Gotowe/Rzeźbione)
3. ✅ Zmiana kolejności albumów
4. ✅ Sekcja "Pliki" z 4 podfolderami
5. ✅ Przeglądanie folderów z breadcrumbs
6. ✅ Okładki albumów i projektów (.jpg, .jpeg, .png)
7. ✅ Tło z okładką + blur effect
8. ✅ Logo na stronie głównej
9. ✅ Numeracja projektów (auto/manual)
10. ✅ Przenoszenie projektów między albumami
11. ✅ Zmiana nazw albumów i projektów
12. ✅ Usuwanie z opcją przeniesienia do sortowni

### 📋 Faza 4: Multimedia i Teksty (Następna)

1. Odtwarzacz audio wbudowany (demo/gotowe)
2. Edytor tekstów online
3. Preview plików graficznych
4. Wersjonowanie zaawansowane

### 📋 Faza 5: Zaawansowane

1. Import tekstów z Android backup
2. Automatyzacja FL Studio / Reaper (badanie możliwości)
3. System backupów (Google Drive)
4. Historia zmian w projektach
5. Statystyki projektów

## Konwencja Nazewnictwa

**Format**: Dowolny, z opcjonalną numeracją

Przykłady z numeracją:

- `01 - Mój Utwór`
- `02 - Kolejny Track`
- `03 - Demo Beat`

Pliki wewnątrz projektu:

- Obsługa wszystkich formatów audio (wav, mp3, flac, ogg)
- Obsługa projektów DAW (flp, rpp)
- Pliki tekstowe (txt, docx, pdf)
- Automatyczne sortowanie po dacie modyfikacji

**Wersjonowanie**: Przez system plików (daty modyfikacji)

## Uwagi Techniczne

- Używamy **monorepo** z workspace npm
- Shared types w folderze `shared/`
- Proxy w Vite przekierowuje `/api` na backend
- Backend działa na porcie **4001**, frontend na **5175**
- Manager Norfa używa innych portów niż Manager Plików (4001/5175 vs 5001/3001)
- File System Service automatycznie wyklucza foldery systemowe
- Wszystkie operacje na plikach przez fs-extra
- Obsługa formatów okładek: .jpg, .jpeg, .png (priorytet w tej kolejności)
- Blur effect na tłach: 10px dla optymalnej czytelności
- Drag & Drop oparte na HTML5 Drag API
- UUID dla ID w przypadku potrzeby unikalnych identyfikatorów
- ID albumów = nazwa folderu
- Kategorie albumów przechowywane w .metadata.json
- Logo i main-cover serwowane przez dedykowane endpointy
- Sortownia wspiera pełną nawigację w podfolderach

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

**Ostatnia aktualizacja**: 14 stycznia 2026 - Ukończono Fazę 3 (Organizacja i UI)
