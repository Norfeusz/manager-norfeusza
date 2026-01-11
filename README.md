# Manager Norfeusza

Zaawansowane narzędzie webowe do zarządzania projektami muzycznymi i procesem twórczym.

## 🎯 Funkcjonalności

### ✅ Faza 1: Podstawy (Ukończona)
- Zarządzanie albumami muzycznymi
- Tworzenie projektów (utworów) z automatyczną strukturą folderów
- **Numeracja projektów (01, 02, 03...) z trybem automatycznym i ręcznym**
- **Automatyczne przesuwanie numerów przy ręcznym nadawaniu**
- Nawigacja: Albumy → Projekty → Podfoldery
- Automatyczna inicjalizacja albumu "Robocze"

### ✅ Faza 2: Zarządzanie Plikami (Ukończona)
- **Sortownia** - tymczasowy folder dla plików przed przypisaniem do projektu
- Przeglądanie plików w 8 podfolderach każdego projektu
- Upload plików z automatycznym nazewnictwem
- System wersjonowania (001, 002, 003...)
- Przenoszenie plików między folderami z auto-nazewnictwem
- Zmiana nazw i usuwanie plików
- Otwieranie plików w systemie Windows

### 📋 Faza 3: Multimedia (W planach)
- Odtwarzacz audio w przeglądarce
- Edytor tekstów
- Integracja z Windows Media Player

### 📋 Faza 4: Zaawansowane (W planach)
- Import tekstów z backupu Android
- Backup do Google Drive
- Przenoszenie projektów między albumami
- Badanie automatyzacji FL Studio / Reaper

## 🚀 Szybki Start

### Metoda 1: Launcher (Najłatwiejsza)

Podwójne kliknięcie na jeden z plików:
- **`start.bat`** - uruchomienie przez CMD (zalecane)
- **`start.ps1`** - uruchomienie przez PowerShell

Launcher automatycznie:
- Sprawdzi i zainstaluje zależności
- Uruchomi backend (port 4001)
- Uruchomi frontend (port 5175)
- Otworzy przeglądarkę

### Metoda 2: Ręczne uruchomienie

#### Backend
```bash
cd server
npm install
npm run dev
```

#### Frontend (w nowym terminalu)
```bash
cd client
npm install
npm run dev
```

Otwórz przeglądarkę: http://localhost:5175

## 📁 Struktura Projektu

```
Manager Norfa/
├── start.bat              # 🚀 Launcher (CMD)
├── start.ps1              # 🚀 Launcher (PowerShell)
├── client/                # Frontend (React + Vite)
├── server/                # Backend (Node.js + Express)
├── shared/                # Wspólne typy TypeScript
└── dokumentacja/          # Dokumentacja techniczna
```

## 📂 Struktura Muzyczna

### Numeracja Projektów

Projekty mogą być numerowane w formacie `01 - Nazwa utworu`, `02 - Nazwa utworu` itd.

- **Automatyczna numeracja** - system przydziela kolejny dostępny numer
- **Ręczna numeracja** - możliwość nadania konkretnego numeru (1-99)
- **Przesuwanie numerów** - jeśli nadasz numer 5, a projekt "05 - ..." już istnieje, zostanie przesunięty na 06, następny na 07 itd.

### Struktura Podfolderów

Każdy projekt (utwór) zawiera 8 podfolderów:

1. **Projekt FL** - projekty FL Studio
2. **Projekt Reaper** - projekty Reaper
3. **Tekst** - pliki tekstowe z tekstami
4. **Demo bit** - demo bitów (mp3, wav)
5. **Demo nawijka** - demo wokali (mp3, wav)
6. **Demo utwor** - demo kompletne (mp3, wav)
7. **Gotowe** - finalne wersje
8. **Pliki** - inne pliki pomocnicze

## 🏷️ Konwencja Nazewnictwa (Automatyczna)

Format: `nazwa_utworu-typ-wersja.ext`

Przykłady:
- `moj_utwor-projekt_bit-001.flp`
- `moj_utwor-bit_demo-002.wav`
- `moj_utwor-nawijka_gotowy-001.mp3`
- `moj_utwor-gotowy-003.mp3`

## 🛠️ Stack Technologiczny

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, TypeScript, fs-extra, multer
- **Porty**: Backend 4001, Frontend 5175
- **Lokalizacja**: `D:\DATA\Norfeusz\`

## 📖 Dokumentacja

Szczegółowa dokumentacja w folderze `dokumentacja/`:
- `dokumentacja-techniczna.md` - API, typy, struktura
- `briefing-dla-agenta.md` - wymagania projektu
- `Opis projektu.txt` - szczegóły funkcjonalności

## 🔧 Wymagania

- Node.js 18+ (https://nodejs.org/)
- npm (instalowane z Node.js)
- System operacyjny: Windows

## 📝 Licencja

Projekt prywatny - Norfeusz © 2026
