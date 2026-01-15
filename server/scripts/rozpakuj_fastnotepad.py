"""
Skrypt do wyodrębniania tekstów z backupu FastNotepad
"""
import re
from pathlib import Path


def dekoduj_tekst(text):
    """Dekoduje escape sequences w tekście"""
    text = text.replace('\\n', '\n')
    text = text.replace('\\r', '\r')
    text = text.replace('\\t', '\t')
    text = text.replace('\\\\', '\\')
    return text


def bezpieczna_nazwa(text, max_len=100):
    """Tworzy bezpieczną nazwę pliku z tekstu"""
    # Weź pierwszą linię
    first_line = text.split('\n')[0][:50].strip()
    if not first_line:
        return None
    
    # Usuń niedozwolone znaki
    safe = re.sub(r'[<>:"/\\|?*]', '_', first_line)
    safe = re.sub(r'\s+', ' ', safe).strip()
    return safe[:max_len] if safe else None


def wyciagnij_tekst_prosty(note):
    """Wyciąga tekst z prostej notatki (bez zagnieżdżeń)"""
    # Szukamy ostatniego JSONa
    json_pattern = r'\{[^}]*\}'
    last_json_match = None
    for match in re.finditer(json_pattern, note):
        last_json_match = match
    
    if last_json_match:
        text = note[last_json_match.end():].lstrip(';').strip()
        return dekoduj_tekst(text) if text else None
    return None


def wyciagnij_teksty_zagniezdzony(note):
    """Wyciąga wszystkie teksty z zagnieżdżonej notatki (folder)"""
    teksty = []
    
    # Pattern: "klucz":"wartość"
    pattern = r'"([^"]+)":"([^"]*(?:\\.[^"]*)*)"'
    matches = re.findall(pattern, note)
    
    for key, value in matches:
        # Pomijamy "folders" - to lista folderów
        if key == "folders":
            continue
        
        # Dekoduj
        decoded = dekoduj_tekst(value)
        
        # Filtruj: weź tylko jeśli to prawdopodobnie tekst
        # Pomijamy krótkie szyfry bez spacji/newline
        if len(decoded) < 20 and ' ' not in decoded and '\n' not in decoded:
            continue
        
        teksty.append(decoded)
    
    return teksty


def rozpakuj_fastnotepad(backup_file, output_folder):
    """Główna funkcja rozpakowująca backup FastNotepad"""
    
    # Wczytaj plik
    print(f"Wczytuję plik: {backup_file}")
    with open(backup_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parsowanie struktury: hash#JSON+notatki
    match = re.match(r'([a-f0-9]{40}#)(.*)', content, re.DOTALL)
    if not match:
        print("❌ Nie można sparsować pliku - brak hash!")
        return 0
    
    data = match.group(2)
    
    # Wyciągnij część z notatkami (pomijamy pierwszy JSON)
    json_match = re.match(r'(\{[^}]*\})(.*)', data, re.DOTALL)
    if not json_match:
        print("❌ Nie można sparsować pliku - brak początkowego JSON!")
        return 0
    
    notes_data = json_match.group(2)
    
    # Podziel na notatki
    notes = re.split(r'\^!', notes_data)
    print(f"Znaleziono {len(notes)} notatek")
    
    # Utwórz folder wyjściowy
    output_path = Path(output_folder)
    output_path.mkdir(exist_ok=True)
    
    # Słownik do deduplikacji - kluczem jest tytuł, wartością najdłuższy tekst
    teksty_dict = {}
    saved_count = 0
    
    for i, note in enumerate(notes, 1):
        # Pomijamy puste
        if len(note.strip()) < 5:
            continue
        
        # Sprawdź, czy to zagnieżdżona notatka
        is_nested = '{[!*|@]}' in note
        
        if is_nested:
            # Wyciągnij tytuł z części przed pierwszym JSON
            parts = note.split(';', 3)
            folder_title = parts[1] if len(parts) > 1 else f"folder_{i}"
            
            print(f"\n📁 Notatka {i}: '{folder_title}' (zagnieżdżona)")
            
            # Wyciągnij wszystkie teksty
            teksty = wyciagnij_teksty_zagniezdzony(note)
            
            for tekst in teksty:
                safe_name = bezpieczna_nazwa(tekst)
                if not safe_name:
                    safe_name = f"tekst_{len(teksty_dict) + 1}"
                
                # Dodaj do słownika lub zaktualizuj jeśli znaleziono dłuższy
                if safe_name not in teksty_dict or len(tekst) > len(teksty_dict[safe_name]):
                    teksty_dict[safe_name] = tekst
        
        else:
            # Prosta notatka
            tekst = wyciagnij_tekst_prosty(note)
            
            if not tekst or len(tekst) < 3:
                continue
            
            safe_name = bezpieczna_nazwa(tekst)
            if not safe_name:
                safe_name = f"notatka_{len(teksty_dict) + 1}"
            
            # Dodaj do słownika lub zaktualizuj jeśli znaleziono dłuższy
            if safe_name not in teksty_dict or len(tekst) > len(teksty_dict[safe_name]):
                teksty_dict[safe_name] = tekst
    
    # Teraz zapisz wszystkie unikalne teksty
    print(f"\n{'='*80}")
    print(f"Zapisywanie {len(teksty_dict)} unikalnych tekstów...")
    print(f"{'='*80}\n")
    
    for safe_name, tekst in teksty_dict.items():
        # Zapisz
        file_path = output_path / f"{safe_name}.txt"
        counter = 1
        while file_path.exists():
            file_path = output_path / f"{safe_name}_{counter}.txt"
            counter += 1
        
        file_path.write_text(tekst, encoding='utf-8')
        saved_count += 1
        
        display_name = file_path.name if len(file_path.name) <= 60 else file_path.name[:57] + "..."
        print(f"✓ {saved_count}: {display_name}")
    
    print(f"\n{'='*80}")
    print(f"✅ Zapisano {saved_count} tekstów do folderu: {output_folder}")
    return saved_count


if __name__ == "__main__":
    import sys
    
    # Argumenty z linii poleceń
    if len(sys.argv) < 3:
        print("Użycie: python rozpakuj_fastnotepad.py <backup_file> <output_folder>")
        sys.exit(1)
    
    backup_file = sys.argv[1]
    output_folder = sys.argv[2]
    
    print("="*80)
    print("Rozpakowywanie backupu FastNotepad")
    print("="*80)
    
    if not Path(backup_file).exists():
        print(f"❌ Nie znaleziono pliku: {backup_file}")
        sys.exit(1)
    else:
        rozpakuj_fastnotepad(backup_file, output_folder)
        print("\n🎉 Gotowe!")
