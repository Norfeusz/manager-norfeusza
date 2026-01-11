# Briefing dla Agenta - Manager Norfa

## Witaj w projekcie Manager Norfa!

Ten dokument zawiera wszystkie informacje potrzebne do rozpoczęcia pracy nad projektem. **WAŻNE: Przeczytaj całość przed rozpoczęciem jakichkolwiek działań i ZADAJ wszystkie pytania kierownikowi projektu. NIE ZACZYNAJ implementacji bez wyraźnego polecenia.**

---

## 🎯 Cel Projektu

Manager Norfa to zaawansowane narzędzie webowe do zarządzania procesem twórczym w produkcji muzycznej. Automatyzuje workflow, organizuje projekty muzyczne i zapewnia spójną strukturę dla wszystkich elementów produkcji.

---

## 📚 Wymagane Dokumenty do Przeczytania

Przed rozpoczęciem MUSISZ przeczytać:

1. **Wytyczne dla agentów**: `d:\DATA\Zarzadzanie plikami\Dokumentacja\wytyczne-dla-agentow.md`
   - Ogólne zasady pracy w projekcie
   - Filozofia kodu i współpracy

2. **Dokumentacja techniczna**: `d:\DATA\Manager Norfa\dokumentacja\dokumentacja-techniczna.md`
   - Stack technologiczny
   - Struktura projektu
   - Endpointy API (do zaimplementowania)

3. **Opis projektu**: `d:\DATA\Manager Norfa\dokumentacja\Opis projektu.txt`
   - Szczegółowy opis funkcjonalności
   - UI/UX flow
   - Automatyzacja procesów

4. **Instrukcje kierownika**: `d:\DATA\instrukcje - kierownik projektu.txt`
   - Kontekst biznesowy
   - Struktura nośników pamięci

---

## 🏗️ Architektura Projektu

### Struktura Folderów Muzycznych

Każdy **projekt (utwór)** zawiera:

```
nazwa_utworu/
├── Projekt FL/         # Projekty FL Studio (bity)
├── Projekt Reaper/     # Projekty Reaper (nawijka)
├── Tekst/              # Pliki tekstów (.txt)
├── Demo bit/           # Demo bity (mp3, wav)
├── Demo nawijka/       # Demo nawijki (mp3, wav)
├── Demo utwor/         # Demo kompletne (mp3, wav)
├── Gotowe/             # Finalne wersje (mp3, wav)
└── Pliki/              # Inne pliki pomocnicze
```

### Hierarchia: Album → Projekt (Utwór) → Podfoldery

- Nowe projekty domyślnie trafiają do albumu **"Robocze"**
- Projekty można przenosić między albumami

---

## 🎨 Przepływ UI (User Experience)

### 1. Ekran Główny - Kafelki Albumów
- Wyświetlenie wszystkich albumów
- Opcja dodania nowego albumu
- Kliknięcie → wejście do albumu

### 2. Widok Albumu - Lista Utworów
- Wszystkie projekty (utwory) w albumie
- Przycisk "Dodaj projekt"
- Kliknięcie w utwór → wejście do projektu

### 3. Widok Projektu - Kafelki Podfolderów
- 8 kafelków reprezentujących podfoldery
- Każdy kafelek prowadzi do innego widoku

### 4. Widoki Podfolderów

#### A) Projekt FL / Projekt Reaper
- **Opcje**: Utwórz nowy | Edytuj istniejący
- Lista istniejących projektów w folderze
- Integracja z DAW (FL Studio / Reaper)

#### B) Tekst
- Lista plików `.txt`
- Opcje: Otwórz | Usuń | Edytuj

#### C) Demo bit / Demo nawijka / Demo utwór
- Lista plików audio (mp3, wav)
- **Opcje dla każdego pliku**:
  - Odtwórz
  - Usuń
  - Zmień nazwę
  - Przenieś do → (Demo bit / Demo nawijka / Demo utwór / Gotowe)
    - Przy przeniesieniu: wybór typu (bit / nawijka / utwór)
    - Automatyczna zmiana nazwy zgodna z konwencją

#### D) Gotowe
- Lista finalnych plików (mp3, wav)
- Opcje: Odtwórz | Usuń | Zmień nazwę | Przenieś do demo

#### E) Pliki
- Lista różnych formatów plików
- Opcje: Otwórz | Usuń | Zmień nazwę

---

## 🔧 Kluczowe Funkcjonalności

### 1. Konwencja Nazewnictwa (AUTOMATYCZNA)

**Format**: `nazwa_utworu-typ-kategoria-wersja`

Przykłady:
- `moj_utwor-projekt_bit-001.flp`
- `moj_utwor-projekt_nawijka-002.rpp`
- `moj_utwor-tekst-003.txt`
- `moj_utwor-bit_demo-001.wav`
- `moj_utwor-nawijka_demo-002.mp3`
- `moj_utwor-utwor_demo-001.mp3`
- `moj_utwor-bit_gotowy-001.mp3`
- `moj_utwor-nawijka_gotowy-001.wav`
- `moj_utwor-gotowy-001.mp3`

**Wersjonowanie**: Automatyczny increment (001 → 002 → 003...)

### 2. Automatyzacja FL Studio / Reaper

**Problem do rozwiązania**:
- Projekt FL Studio powinien automatycznie zapisywać się w folderze `Projekt FL`
- Renderowane pliki powinny trafiać do `Demo bit` z właściwą nazwą
- Analogicznie dla Reaper → `Projekt Reaper` i `Demo nawijka`

**Pytanie do kierownika**: Jak to zautomatyzować? Czy:
- Ustawienie domyślnych ścieżek w DAW?
- Skrypty/hook przy zapisie?
- Inna metoda?

### 3. Dodaj Projekt

**Workflow**:
1. Użytkownik klika "Dodaj projekt"
2. Podaje nazwę utworu
3. System tworzy całą strukturę folderów
4. **Opcja**: "Wczytaj pliki"
   - Drag & drop lub file picker
   - Dla każdego pliku: wybór docelowego podfolderu
   - Automatyczne nazewnictwo zgodnie z konwencją

### 4. Importuj Teksty

**Funkcja**: Import backupu z aplikacji Android "Szybki Notatnik"

**Workflow**:
1. Wczytaj plik backupu
2. Rozpakuj i przeanalizuj każdą notatkę
3. Dla każdej notatki:
   
   **a) Pokrycie 100% z istniejącym tekstem**:
   - Pomiń (duplikat)
   
   **b) Pokrycie 30-99% z istniejącym tekstem**:
   - Utwórz nową wersję tekstu w tym samym projekcie
   - Automatyczne wersjonowanie
   
   **c) Pokrycie <30% z wszystkimi tekstami**:
   - Decyzja użytkownika:
     - Przypisz do istniejącego projektu
     - Utwórz nowy projekt

**Pytanie do kierownika**: 
- Jaki algorytm porównywania tekstów? (Levenshtein distance, diff, fuzzy matching?)
- Format pliku backupu z aplikacji Android?

### 5. Aktualizuj Backup

**Cel**: Synchronizacja z Google Drive lub dyskiem wymiennym

**Workflow**:
1. Użytkownik klika "Aktualizuj backup"
2. System porównuje zawartość lokalną vs backup
3. Wykrycie zmian:
   - Nowe pliki → kopiuj do backupu
   - Zmodyfikowane pliki → nadpisz w backupie
   - Brakujące pliki (są w backupie, nie ma lokalnie):
     - **Pytanie**: Usunąć z backupu czy zachować?
     - Opcja: "Nie pytaj więcej o te konkretne pliki" (whitelist)
4. Wykonaj synchronizację
5. Pokaż raport

**Pytania do kierownika**:
- Priorytet: Google Drive czy dysk wymienny?
- Jak obsłużyć brak miejsca na Google Drive?
- Czy używać Google Drive API czy innego narzędzia?

---

## ⚠️ Kwestie Wymagające Wyjaśnienia

**ZADAJ TE PYTANIA KIEROWNIKOWI PRZED ROZPOCZĘCIEM:**

### 1. Automatyzacja DAW (FL Studio / Reaper)
- Jak zaimplementować automatyczny zapis w odpowiednich folderach?
- Jak automatycznie ustawić ścieżki renderowania?
- Czy DAW mają API / możliwość skryptowania?

### 2. Porównywanie Tekstów
- Jakiego algorytmu użyć do sprawdzania podobieństwa (30%, 100%)?
- Czy ignorować białe znaki, interpunkcję przy porównywaniu?

### 3. Format Backupu Android
- Jaki dokładnie format ma plik z "Szybkiego Notatnika"?
- Czy to ZIP, JSON, XML, inny?
- Czy możesz dostarczyć przykładowy plik?

### 4. Google Drive API
- Czy masz dane uwierzytelniające (Client ID, Secret)?
- Czy preferujesz OAuth 2.0 czy Service Account?
- Alternatywa: rclone, gsutil?

### 5. Odtwarzanie Audio w Przeglądarce
- Czy używamy `<audio>` HTML5?
- Czy potrzebujemy waveform visualizer?
- Czy streaming czy pełne wczytanie?

### 6. Edycja Tekstów
- Czy edycja inline w przeglądarce?
- Czy otwieranie w zewnętrznym edytorze (Notepad++)?

### 7. Integracja z Systemem Plików
- Jak otwierać pliki w FL Studio / Reaper z poziomu aplikacji?
- Jak otwierać pliki w domyślnych aplikacjach Windows?

---

## 🛠️ Stack Technologiczny

**Frontend**:
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router

**Backend**:
- Node.js + Express + TypeScript
- fs-extra (operacje na plikach)
- (opcjonalnie) Google Drive API

**Porty**:
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:5001`

---

## 📋 Plan Implementacji (Propozycja)

**NIE IMPLEMENTUJ BEZ ZGODY KIEROWNIKA**

### Faza 1: Podstawy
1. Widok albumów (kafelki)
2. Widok utworów w albumie (lista)
3. Tworzenie nowego projektu (struktura folderów)
4. Widok projektu (kafelki podfolderów)

### Faza 2: Zarządzanie Plikami
5. Przeglądanie zawartości podfolderów
6. System wersjonowania nazw
7. Przenoszenie plików między folderami
8. Zmiana nazw (z zachowaniem konwencji)

### Faza 3: Multimedia
9. Odtwarzacz audio (demo/gotowe)
10. Edytor tekstów
11. Drag & drop upload plików

### Faza 4: Zaawansowane
12. Import tekstów z Android backup
13. Integracja z FL Studio / Reaper (jeśli możliwe)
14. System backupów (Google Drive)

---

## ✅ Zasady Pracy

1. **NIE DOMYŚLAJ SIĘ** - pytaj o wszystko co niejasne
2. **Małe kroki** - implementuj małymi, testowalnymi kawałkami
3. **Dokumentuj** - aktualizuj dokumentację techniczną przy zmianach
4. **Komunikuj** - informuj o postępach i problemach
5. **Kod minimalny** - bez zbędnych rzeczy
6. **Pliki krótkie** - modularyzuj kod
7. **TypeScript wszędzie** - pełne typowanie

---

## 📞 Następne Kroki

1. ✅ Przeczytaj wszystkie wymienione dokumenty
2. ✅ Zapoznaj się z obecną strukturą kodu
3. ✅ Przygotuj listę pytań
4. ⏸️ **CZEKAJ** na odpowiedzi od kierownika
5. ⏸️ Otrzymaj zatwierdzenie do rozpoczęcia
6. ⏸️ Dopiero wtedy zacznij implementację

---

## 🚨 PAMIĘTAJ

**NIE ROZPOCZYNAJ IMPLEMENTACJI BEZ WYRAŹNEGO POLECENIA KIEROWNIKA!**

Twoja rola to:
1. Zrozumieć wymagania
2. Zadać pytania
3. Zaproponować rozwiązania
4. Czekać na zatwierdzenie
5. Implementować zgodnie z wytycznymi

---

Powodzenia! Jesteśmy tu, żeby wspólnie stworzyć doskonałe narzędzie. 🎵
