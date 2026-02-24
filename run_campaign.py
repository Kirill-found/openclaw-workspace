#!/usr/bin/env python3
# GeoReview Full Campaign Runner
# Читает данные из Google Sheets и запускает рассылку

import subprocess
import json
import time
import random
import re
from email_campaign import send_email, create_personalized_subject, create_email_content

def get_sheet_data(sheet_id, sheet_name):
    """Получение данных из Google Sheets через gog CLI"""
    try:
        cmd = f'gog sheets get {sheet_id} "{sheet_name}!A:J" --json'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            print(f"❌ Ошибка получения данных: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

def is_valid_email(email):
    """Проверка валидности email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def extract_leads(sheet_data):
    """Извлечение лидов из данных таблицы"""
    if not sheet_data or 'values' not in sheet_data:
        return []
    
    values = sheet_data['values']
    if len(values) < 2:  # Нет данных кроме заголовков
        return []
    
    headers = values[0]
    leads = []
    
    # Находим индексы нужных колонок
    try:
        name_idx = headers.index('Клиника')
        city_idx = headers.index('Город') 
        rating_idx = headers.index('Рейтинг')
        reviews_idx = headers.index('Отзывы')
        email_idx = headers.index('Email')
        website_idx = headers.index('Сайт')
    except ValueError as e:
        print(f"❌ Не найдена колонка: {e}")
        return []
    
    # Обрабатываем строки данных
    for row in values[1:]:
        if len(row) <= max(name_idx, email_idx):
            continue
            
        email = row[email_idx] if len(row) > email_idx else ""
        
        # Пропускаем строки без email или с невалидным email
        if not email or not is_valid_email(email):
            continue
            
        lead = {
            'name': row[name_idx] if len(row) > name_idx else "",
            'city': row[city_idx] if len(row) > city_idx else "",
            'rating': row[rating_idx] if len(row) > rating_idx else "",
            'reviews': row[reviews_idx] if len(row) > reviews_idx else "",
            'email': email,
            'website': row[website_idx] if len(row) > website_idx else ""
        }
        
        # Пропускаем если нет названия клиники
        if not lead['name']:
            continue
            
        leads.append(lead)
    
    return leads

def run_campaign():
    """Запуск полной рассылочной кампании"""
    SHEET_ID = "1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0"
    
    # Листы для обработки
    sheets = [
        "Ветклиники СПб",
        "Ветклиники Москва"
        # "Стоматологии (старое)" - пропускаем старые данные
    ]
    
    all_leads = []
    
    # Собираем данные со всех листов
    for sheet_name in sheets:
        print(f"📊 Получение данных из '{sheet_name}'...")
        sheet_data = get_sheet_data(SHEET_ID, sheet_name)
        
        if sheet_data:
            leads = extract_leads(sheet_data)
            print(f"✅ Найдено {len(leads)} лидов с валидными email")
            all_leads.extend(leads)
        else:
            print(f"❌ Не удалось получить данные из '{sheet_name}'")
    
    print(f"\n🎯 Итого лидов для рассылки: {len(all_leads)}")
    
    if not all_leads:
        print("❌ Нет лидов для рассылки")
        return
    
    # Статистика рассылки
    sent_count = 0
    failed_count = 0
    
    print(f"\n🚀 Начинаем рассылку...")
    print("=" * 50)
    
    for i, lead in enumerate(all_leads):
        try:
            # Создаем персонализированное письмо
            subject = create_personalized_subject(lead['name'], lead['rating'])
            html_content, plain_content = create_email_content(
                lead['name'], lead['rating'], lead['reviews'], 
                lead['website'], lead['city']
            )
            
            print(f"📧 [{i+1}/{len(all_leads)}] Отправка: {lead['email']} ({lead['name']})")
            
            # Отправляем email
            success, error = send_email(lead['email'], subject, html_content, plain_content)
            
            if success:
                sent_count += 1
                print(f"✅ Успешно отправлено")
            else:
                failed_count += 1
                print(f"❌ Ошибка: {error}")
            
            # Пауза между отправками для избежания спам-фильтров
            # Рандомная пауза 30-90 секунд
            if i < len(all_leads) - 1:  # Не ждем после последнего письма
                wait_time = random.randint(30, 90)
                print(f"⏳ Пауза {wait_time}с перед следующей отправкой...")
                time.sleep(wait_time)
            
        except Exception as e:
            failed_count += 1
            print(f"❌ Критическая ошибка для {lead['email']}: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 РЕЗУЛЬТАТЫ РАССЫЛКИ:")
    print(f"✅ Успешно отправлено: {sent_count}")
    print(f"❌ Ошибок: {failed_count}")
    print(f"📈 Успешность: {sent_count/(sent_count+failed_count)*100:.1f}%")

if __name__ == "__main__":
    # Спрашиваем подтверждение перед запуском
    print("⚠️ ВНИМАНИЕ! Вы собираетесь запустить массовую email-рассылку.")
    print("📧 Будут отправлены персонализированные письма всем лидам из таблицы.")
    print("🕒 Процесс займет ~2-3 часа с паузами между письмами.")
    
    confirm = input("\n❓ Продолжить? (да/нет): ").lower()
    
    if confirm in ['да', 'yes', 'y', 'д']:
        run_campaign()
    else:
        print("❌ Рассылка отменена")