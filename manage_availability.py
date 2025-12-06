#!/usr/bin/env python3
"""
Script para gerenciar a disponibilidade de itens do cardápio.

Uso:
    python manage_availability.py list                    # Listar todos os itens
    python manage_availability.py unavailable "Item Name" # Marcar item como indisponível
    python manage_availability.py available "Item Name"   # Marcar item como disponível
    python manage_availability.py stats                   # Mostrar estatísticas
"""

import json
import sys
from pathlib import Path

DATA_FILE = Path(__file__).parent / 'data' / 'data.json'


def load_data():
    """Carrega os dados do arquivo JSON."""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_data(data):
    """Salva os dados no arquivo JSON."""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def list_items(data):
    """Lista todos os itens do cardápio."""
    print("\n📋 ITENS DO CARDÁPIO\n")
    for section in data:
        print(f"\n{section['title']} ({section['type']})")
        print("-" * 60)
        for item in section['items']:
            status = "✅" if item.get('available', True) else "❌"
            print(f"  {status} {item['name']}")


def set_availability(data, item_name, available):
    """Define a disponibilidade de um item."""
    found = False
    for section in data:
        for item in section['items']:
            if item['name'].lower() == item_name.lower():
                item['available'] = available
                found = True
                status = "disponível" if available else "indisponível"
                print(f"\n✅ Item '{item['name']}' marcado como {status}!")
                break
        if found:
            break
    
    if not found:
        print(f"\n❌ Item '{item_name}' não encontrado!")
        return False
    
    save_data(data)
    return True


def show_stats(data):
    """Mostra estatísticas sobre a disponibilidade."""
    total = 0
    available = 0
    unavailable = 0
    
    sections_stats = []
    
    for section in data:
        section_total = len(section['items'])
        section_available = sum(1 for item in section['items'] if item.get('available', True))
        section_unavailable = section_total - section_available
        
        total += section_total
        available += section_available
        unavailable += section_unavailable
        
        sections_stats.append({
            'title': section['title'],
            'total': section_total,
            'available': section_available,
            'unavailable': section_unavailable
        })
    
    print("\n📊 ESTATÍSTICAS DO CARDÁPIO\n")
    print(f"Total de itens: {total}")
    print(f"Itens disponíveis: {available} ({available/total*100:.1f}%)")
    print(f"Itens indisponíveis: {unavailable} ({unavailable/total*100:.1f}%)")
    
    print("\n📋 POR CATEGORIA:\n")
    for stat in sections_stats:
        print(f"{stat['title']:30} | Total: {stat['total']:3} | Disponíveis: {stat['available']:3} | Indisponíveis: {stat['unavailable']:3}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    data = load_data()
    
    if command == 'list':
        list_items(data)
    
    elif command == 'stats':
        show_stats(data)
    
    elif command == 'unavailable':
        if len(sys.argv) < 3:
            print("❌ Erro: Especifique o nome do item")
            sys.exit(1)
        item_name = sys.argv[2]
        set_availability(data, item_name, False)
    
    elif command == 'available':
        if len(sys.argv) < 3:
            print("❌ Erro: Especifique o nome do item")
            sys.exit(1)
        item_name = sys.argv[2]
        set_availability(data, item_name, True)
    
    else:
        print(f"❌ Comando desconhecido: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
