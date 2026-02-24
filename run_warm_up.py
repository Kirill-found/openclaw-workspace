#!/usr/bin/env python3
# Warm-up скрипт для постепенного прогрева отправителя

import subprocess
import json
import argparse
import time
import random
from datetime import datetime
from run_campaign import get_sheet_data, extract_leads, is_valid_email
from email_campaign import send_email, create_personalized_subject, create_email_content

def sort_leads_by_quality(leads):
    """Сортируем лиды по качеству (рейтинг + количество отзывов)"""
    def quality_score(lead):
        try:
            rating = float(lead['rating']) if lead['rating'] else 0
            reviews = int(lead['reviews']) if lead['reviews'] else 0
            
            # Нормализуем отзывы (логарифм для сглаживания)
            import math
            normalized_reviews = math.log10(reviews + 1) if reviews > 0 else 0
            
            # Качественный score: рейтинг (0-5) + нормализованные отзывы (0-4)
            return rating + normalized_reviews
        except:
            return 0
    
    return sorted(leads, key=quality_score, reverse=True)

def save_sent_log(email, status, error=None):
    """Логирование отправленных писем"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'email': email,
        'status': status,
        'error': error
    }
    
    try:
        # Читаем существующий лог
        try:
            with open('sent_emails.json', 'r') as f:
                sent_log = json.load(f)
        except FileNotFoundError:
            sent_log = []
        
        # Добавляем новую запись
        sent_log.append(log_entry)
        
        # Сохраняем обновленный лог
        with open('sent_emails.json', 'w') as f:
            json.dump(sent_log, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f"❌ Ошибка логирования: {e}")

def get_sent_emails():
    """Получаем список уже отправленных email"""
    try:
        with open('sent_emails.json', 'r') as f:
            sent_log = json.load(f)
        return [entry['email'] for entry in sent_log if entry['status'] == 'success']
    except FileNotFoundError:
        return []

def warm_up_campaign(count=10):
    """Warm-up рассылка с ограниченным количеством"""
    SHEET_ID = "1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0"
    
    print(f"🔥 WARM-UP РАССЫЛКА: {count} лучших лидов")
    print("=" * 50)
    
    # Получаем все лиды
    all_leads = []
    sheets = ["Ветклиники СПб", "Ветклиники Москва"]
    
    for sheet_name in sheets:
        print(f"📊 Загрузка данных из '{sheet_name}'...")
        sheet_data = get_sheet_data(SHEET_ID, sheet_name)
        if sheet_data:
            leads = extract_leads(sheet_data)
            all_leads.extend(leads)
    
    print(f"📋 Всего лидов в базе: {len(all_leads)}")
    
    # Исключаем уже отправленные
    sent_emails = get_sent_emails()
    filtered_leads = [lead for lead in all_leads if lead['email'] not in sent_emails]
    
    print(f"📧 Лидов для отправки (исключая отправленные): {len(filtered_leads)}")
    
    # Сортируем по качеству
    quality_leads = sort_leads_by_quality(filtered_leads)
    
    # Берем топ N лидов
    target_leads = quality_leads[:count]
    
    if not target_leads:
        print("❌ Нет лидов для warm-up")
        return
    
    print(f"🎯 Отправляем {len(target_leads)} лучших лидов...")
    print("\n" + "=" * 50)
    
    # Статистика
    sent_count = 0
    failed_count = 0
    
    for i, lead in enumerate(target_leads):
        try:
            print(f"\n📧 [{i+1}/{len(target_leads)}] {lead['name']} ({lead['email']})")
            print(f"   Качество: {lead['rating']}⭐, {lead['reviews']} отзывов")
            
            # Создаем письмо
            subject = create_personalized_subject(lead['name'], lead['rating'])
            html_content, plain_content = create_email_content(
                lead['name'], lead['rating'], lead['reviews'],
                lead['website'], lead['city']
            )
            
            # Отправляем
            success, error = send_email(lead['email'], subject, html_content, plain_content)
            
            if success:
                sent_count += 1
                save_sent_log(lead['email'], 'success')
                print(f"✅ Отправлено")
            else:
                failed_count += 1
                save_sent_log(lead['email'], 'failed', error)
                print(f"❌ Ошибка: {error}")
            
            # Warm-up пауза (больше чем в обычной рассылке)
            if i < len(target_leads) - 1:
                wait_time = random.randint(120, 300)  # 2-5 минут
                print(f"⏳ Warm-up пауза: {wait_time//60}м {wait_time%60}с")
                time.sleep(wait_time)
                
        except Exception as e:
            failed_count += 1
            save_sent_log(lead['email'], 'error', str(e))
            print(f"❌ Критическая ошибка: {e}")
    
    print("\n" + "=" * 50)
    print(f"🔥 WARM-UP ЗАВЕРШЕН")
    print(f"✅ Успешно: {sent_count}")
    print(f"❌ Ошибок: {failed_count}")
    print(f"📈 Успешность: {sent_count/(sent_count+failed_count)*100:.1f}%")
    
    # Рекомендации следующего шага
    if sent_count >= count * 0.8:  # 80%+ успешность
        next_count = min(count * 2, 100)  # Удваиваем, но не более 100
        print(f"\n🎯 СЛЕДУЮЩИЙ ЭТАП: {next_count} писем завтра")
        print(f"   Команда: python3 run_warm_up.py --count {next_count}")
    else:
        print(f"\n⚠️ ВНИМАНИЕ: Низкая успешность! Проверьте настройки перед продолжением")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Warm-up email campaign')
    parser.add_argument('--count', type=int, default=10, help='Количество писем для отправки')
    args = parser.parse_args()
    
    print(f"⚠️ Запуск warm-up рассылки: {args.count} лучших лидов")
    confirm = input("Продолжить? (да/нет): ").lower()
    
    if confirm in ['да', 'yes', 'y', 'д']:
        warm_up_campaign(args.count)
    else:
        print("❌ Отменено")