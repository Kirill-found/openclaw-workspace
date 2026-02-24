#!/usr/bin/env python3
# Прямое чтение Google Sheets без gog CLI

import subprocess
import json
import requests
import csv
import re

def read_sheets_via_csv_export(sheet_id, gid=0):
    """
    Чтение Google Sheets через CSV экспорт (публичная ссылка)
    """
    # Формат URL для CSV экспорта Google Sheets
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    
    try:
        response = requests.get(csv_url, timeout=10)
        response.raise_for_status()
        
        # Парсим CSV данные
        csv_content = response.text
        reader = csv.reader(csv_content.splitlines())
        rows = list(reader)
        
        return {
            'values': rows
        }
        
    except Exception as e:
        print(f"❌ Ошибка чтения Google Sheets: {e}")
        return None

def extract_leads_from_csv(sheet_data):
    """Извлечение лидов из CSV данных"""
    if not sheet_data or 'values' not in sheet_data:
        return []
    
    values = sheet_data['values']
    if len(values) < 2:
        return []
    
    headers = values[0]
    leads = []
    
    # Определяем индексы колонок
    try:
        name_idx = next(i for i, h in enumerate(headers) if 'клиника' in h.lower())
        city_idx = next(i for i, h in enumerate(headers) if 'город' in h.lower())
        rating_idx = next(i for i, h in enumerate(headers) if 'рейтинг' in h.lower())
        reviews_idx = next(i for i, h in enumerate(headers) if 'отзыв' in h.lower())
        email_idx = next(i for i, h in enumerate(headers) if 'email' in h.lower())
        website_idx = next((i for i, h in enumerate(headers) if 'сайт' in h.lower()), -1)
    except StopIteration:
        print("❌ Не найдены необходимые колонки в таблице")
        return []
    
    # Обрабатываем строки данных
    for row in values[1:]:
        if len(row) <= email_idx:
            continue
            
        email = row[email_idx] if len(row) > email_idx else ""
        
        # Валидация email
        if not email or not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            continue
            
        lead = {
            'name': row[name_idx] if len(row) > name_idx else "",
            'city': row[city_idx] if len(row) > city_idx else "",
            'rating': row[rating_idx] if len(row) > rating_idx else "",
            'reviews': row[reviews_idx] if len(row) > reviews_idx else "",
            'email': email,
            'website': row[website_idx] if website_idx >= 0 and len(row) > website_idx else ""
        }
        
        if not lead['name']:
            continue
            
        leads.append(lead)
    
    return leads

def get_all_leads():
    """Получение всех лидов из таблицы"""
    SHEET_ID = "1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0"
    
    # GID для разных листов (можно получить из URL)
    sheets_gids = {
        "Ветклиники СПб": 0,           # Первый лист
        "Ветклиники Москва": 1582801642  # GID из URL
    }
    
    all_leads = []
    
    for sheet_name, gid in sheets_gids.items():
        print(f"📊 Загрузка {sheet_name}...")
        
        sheet_data = read_sheets_via_csv_export(SHEET_ID, gid)
        if sheet_data:
            leads = extract_leads_from_csv(sheet_data)
            print(f"✅ Найдено {len(leads)} лидов")
            all_leads.extend(leads)
        else:
            print(f"❌ Не удалось загрузить {sheet_name}")
    
    return all_leads

if __name__ == "__main__":
    leads = get_all_leads()
    print(f"\n🎯 ИТОГО: {len(leads)} лидов для рассылки")
    
    # Показываем первые 3 для проверки
    for i, lead in enumerate(leads[:3]):
        print(f"{i+1}. {lead['name']} ({lead['city']}) - {lead['rating']}⭐ - {lead['email']}")