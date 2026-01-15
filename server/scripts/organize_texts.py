"""
Skrypt do inteligentnego organizowania wypakowanych tekstów.
Porównuje nowe teksty z istniejącymi i przypisuje do odpowiednich folderów.
"""

import os
import sys
from pathlib import Path
from difflib import SequenceMatcher
import json


def calculate_similarity(text1, text2, debug=False):
    """
    Oblicza procentowe podobieństwo między dwoma tekstami.
    Używa SequenceMatcher do porównania całych tekstów.
    """
    # Normalizacja: lowercase i usuń nadmiarowe białe znaki
    norm1 = ' '.join(text1.lower().split())
    norm2 = ' '.join(text2.lower().split())
    
    similarity = SequenceMatcher(None, norm1, norm2).ratio() * 100
    
    if debug:
        print(f"  📊 Długość tekstu 1: {len(norm1)} znaków")
        print(f"  📊 Długość tekstu 2: {len(norm2)} znaków")
        print(f"  📊 Podobieństwo: {similarity:.1f}%")
        if similarity > 50:
            # Pokaż fragmenty tekstów przy wysokim podobieństwie
            print(f"  📄 Początek tekstu 1: {norm1[:100]}...")
            print(f"  📄 Początek tekstu 2: {norm2[:100]}...")
    
    return similarity


def normalize_text(text):
    """Normalizuje tekst do porównywania - usuwa nadmiarowe białe znaki"""
    return ' '.join(text.split())


def find_all_existing_texts(base_path):
    r"""
    Znajduje wszystkie teksty w:
    - folderach Tekst w projektach (D:\DATA\Norfeusz\{album}\{projekt}\Tekst\)
    - folderze głównym Teksty (D:\DATA\Norfeusz\Teksty\)
    """
    existing_texts = []
    
    # Przeszukaj projekty - base_path to .temp_unpacked, więc parent.parent = Norfeusz
    norfeusz_path = Path(base_path).parent.parent
    
    print(f"🔍 Przeszukiwanie w: {norfeusz_path}")
    
    # Pomijamy specjalne foldery
    skip_folders = {'Bity', 'Teksty', 'Pliki', 'Sortownia', '.venv'}
    
    for album_dir in norfeusz_path.iterdir():
        if not album_dir.is_dir() or album_dir.name in skip_folders:
            continue
        
        # Każdy podfolder to potencjalny projekt
        for project_dir in album_dir.iterdir():
            if not project_dir.is_dir():
                continue
            
            # Folder Tekst w projekcie
            tekst_folder = project_dir / 'Tekst'
            if tekst_folder.exists() and tekst_folder.is_dir():
                for txt_file in tekst_folder.glob('*.txt'):
                    try:
                        content = txt_file.read_text(encoding='utf-8')
                        existing_texts.append({
                            'path': str(txt_file),
                            'content': normalize_text(content),
                            'folder': str(tekst_folder)
                        })
                    except Exception as e:
                        print(f"⚠️  Błąd odczytu {txt_file}: {e}")
    
    # Przeszukaj główny folder Teksty
    teksty_path = norfeusz_path / 'Teksty'
    if teksty_path.exists():
        for txt_file in teksty_path.rglob('*.txt'):
            # Pomijamy folder źródłowy (unpacked_folder) - to są nowe teksty do przetworzenia
            if str(txt_file).startswith(str(Path(base_path))):
                continue
            
            # Pomijamy też foldery wyodrebnione - to są nowe teksty
            if 'wyodrebnione' in str(txt_file).lower():
                continue
            
            try:
                content = txt_file.read_text(encoding='utf-8')
                existing_texts.append({
                    'path': str(txt_file),
                    'content': content,  # Nie normalizuj - calculate_similarity() zrobi to sama
                    'folder': str(txt_file.parent)
                })
            except Exception as e:
                print(f"⚠️  Błąd odczytu {txt_file}: {e}")
    
    return existing_texts


def find_best_match(new_text_content, existing_texts, new_filename=""):
    """
    Znajduje najlepiej pasujący istniejący tekst.
    Zwraca (similarity_percent, existing_text_dict) lub (0, None)
    """
    best_similarity = 0
    best_match = None
    
    if new_filename:
        print(f"\n🔍 Szukam dopasowania dla: {new_filename}")
    
    for existing in existing_texts:
        # Dodaj debug dla plików które mają potencjalne dopasowanie lub pierwszego
        debug = (existing == existing_texts[0] and new_filename)
        similarity = calculate_similarity(new_text_content, existing['content'], debug=debug)
        
        if similarity > 0 and new_filename:
            print(f"  ✓ {similarity:.1f}% - {Path(existing['path']).name}")
        
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = existing
    
    return best_similarity, best_match


def generate_version_name(folder_path, base_name):
    """
    Generuje nazwę pliku z wersjonowaniem (np. tekst-002.txt, tekst-003.txt).
    Jeśli base_name to 'armia-tekst-001.txt', generuje 'armia-tekst-002.txt'.
    """
    folder = Path(folder_path)
    
    # Wyciągnij bazę bez rozszerzenia
    base = Path(base_name).stem
    ext = Path(base_name).suffix or '.txt'
    
    # Sprawdź czy nazwa kończy się numerem (np. tekst-001)
    import re
    match = re.match(r'^(.+?)-(\d+)$', base)
    
    if match:
        # Jeśli tak, zwiększ numer
        name_part = match.group(1)
        current_num = int(match.group(2))
        
        # Znajdź następny wolny numer
        counter = current_num + 1
        new_path = folder / f"{name_part}-{counter:03d}{ext}"
        
        while new_path.exists():
            counter += 1
            new_path = folder / f"{name_part}-{counter:03d}{ext}"
    else:
        # Jeśli nie ma numeru, dodaj -001
        counter = 1
        new_path = folder / f"{base}-{counter:03d}{ext}"
        
        while new_path.exists():
            counter += 1
            new_path = folder / f"{base}-{counter:03d}{ext}"
    
    return new_path


def organize_texts(unpacked_folder, fallback_folder):
    """
    Główna funkcja organizująca teksty.
    
    Args:
        unpacked_folder: Folder z wypakowanymi tekstami (np. wyodrebnione_notatki)
        fallback_folder: Folder docelowy dla tekstów 0-29% (np. wyodrebnione_teksty)
    """
    
    unpacked_path = Path(unpacked_folder)
    fallback_path = Path(fallback_folder)
    
    if not unpacked_path.exists():
        print(f"❌ Folder {unpacked_folder} nie istnieje!")
        return
    
    # Upewnij się, że folder docelowy istnieje
    fallback_path.mkdir(exist_ok=True)
    
    # Znajdź wszystkie istniejące teksty
    print("🔍 Przeszukiwanie istniejących tekstów...")
    existing_texts = find_all_existing_texts(str(unpacked_path))
    print(f"✓ Znaleziono {len(existing_texts)} istniejących tekstów")
    
    # Debug: pokaż kilka przykładowych ścieżek
    if existing_texts:
        print("\nPrzykładowe znalezione teksty:")
        for i, et in enumerate(existing_texts[:5]):
            print(f"  {i+1}. {et['path']}")
    print()
    
    # Statystyki
    stats = {
        'skipped_100': 0,
        'added_as_version_40_99': 0,
        'added_as_new_0_39': 0,
        'versions_added_to': []  # Lista plików które dostały nowe wersje
    }
    
    # Przetwórz każdy nowy tekst
    new_files = list(unpacked_path.glob('*.txt'))
    print(f"📄 Przetwarzanie {len(new_files)} nowych tekstów...\n")
    
    for txt_file in new_files:
        try:
            content = txt_file.read_text(encoding='utf-8')
            similarity, best_match = find_best_match(content, existing_texts, new_filename=txt_file.name)
            
            # Debug: pokaż wynik porównania
            if best_match:
                print(f"\n📋 Plik: {txt_file.name}")
                print(f"   Podobieństwo: {similarity:.1f}%")
                print(f"   Najlepsze dopasowanie: {Path(best_match['path']).name}")
            
            if similarity >= 100:
                # 100% zgodność - pomijamy
                print(f"⏭️  POMINIĘTO (100%): {txt_file.name}")
                print(f"    Identyczny z: {Path(best_match['path']).name}")
                stats['skipped_100'] += 1
                
                # Usuń plik
                txt_file.unlink()
            
            elif similarity >= 40:
                # 40-99% zgodność - dodaj jako wersję
                target_folder = best_match['folder']
                new_path = generate_version_name(target_folder, Path(best_match['path']).name)
                
                # Przenieś plik
                txt_file.rename(new_path)
                
                print(f"📝 DODANO WERSJĘ ({similarity:.1f}%): {new_path.name}")
                print(f"    Do folderu: {Path(target_folder).name}")
                print(f"    Podobny do: {Path(best_match['path']).name}")
                stats['added_as_version_40_99'] += 1
                
                # Dodaj do listy plików z nowymi wersjami
                original_file = Path(best_match['path']).name
                if original_file not in stats['versions_added_to']:
                    stats['versions_added_to'].append(original_file)
            
            else:
                # 0-29% zgodność - nowy tekst
                target_path = fallback_path / txt_file.name
                
                # Jeśli plik już istnieje, dodaj suffix
                counter = 1
                while target_path.exists():
                    stem = txt_file.stem
                    suffix = txt_file.suffix
                    target_path = fallback_path / f"{stem}_{counter}{suffix}"
                    counter += 1
                
                # Przenieś plik
                txt_file.rename(target_path)
                
                print(f"✨ DODANO NOWY ({similarity:.1f}%): {target_path.name}")
                print(f"    Do folderu: {fallback_path.name}")
                stats['added_as_new_0_39'] += 1
        
        except Exception as e:
            print(f"❌ Błąd przetwarzania {txt_file.name}: {e}")
    
    # Podsumowanie
    print(f"\n{'='*80}")
    print("📊 PODSUMOWANIE")
    print(f"{'='*80}")
    print(f"⏭️  Pominiętych (100% zgodność): {stats['skipped_100']}")
    print(f"📝 Dodanych jako wersje (40-99%): {stats['added_as_version_40_99']}")
    print(f"✨ Dodanych jako nowe (0-39%): {stats['added_as_new_0_39']}")
    
    if stats['versions_added_to']:
        print(f"\n📋 Teksty, którym dodano nowe wersje ({len(stats['versions_added_to'])}):")
        for i, filename in enumerate(stats['versions_added_to'], 1):
            print(f"   {i}. {filename}")
    
    print(f"{'='*80}\n")
    
    return stats


if __name__ == "__main__":
    # Argumenty z linii poleceń lub domyślne
    unpacked = sys.argv[1] if len(sys.argv) > 1 else "D:\\DATA\\Norfeusz\\Teksty\\wyodrebnione_notatki"
    fallback = sys.argv[2] if len(sys.argv) > 2 else "D:\\DATA\\Norfeusz\\Teksty\\wyodrebnione_teksty"
    
    print("="*80)
    print("🎯 Inteligentna organizacja tekstów")
    print("="*80)
    print(f"Źródło: {unpacked}")
    print(f"Fallback: {fallback}")
    print("="*80 + "\n")
    
    organize_texts(unpacked, fallback)
    print("🎉 Gotowe!")
