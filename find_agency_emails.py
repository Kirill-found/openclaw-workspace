#!/usr/bin/env python3
"""
Поиск email'ов для агентств недвижимости Москвы
1. Поиск официальных сайтов через Google
2. Парсинг email'ов с сайтов
3. Обновление данных
"""

import json
import time
import re
import requests
from playwright import sync_api
import random

def load_agencies():
    """Загружает агентства и фильтрует без email'ов"""
    with open('./georeview-parsing/leads/москва_агентства_yell_final_2026-02-25.json', 'r', encoding='utf-8') as f:
        agencies = json.load(f)
    
    # Фильтруем без настоящих email'ов
    no_email = [a for a in agencies if not a.get('email') or a.get('email') == 'biz@yell.ru']
    with_phone = [a for a in no_email if a.get('phone')]
    
    print(f"📊 Всего агентств: {len(agencies)}")
    print(f"❌ Без настоящих email: {len(no_email)}")
    print(f"📞 С телефонами для обработки: {len(with_phone)}")
    
    return with_phone

def extract_emails_from_text(text):
    """Извлекает email'ы из текста"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text, re.IGNORECASE)
    
    # Фильтруем нежелательные email'ы
    filtered = []
    exclude_domains = ['yell.ru', 'vk.com', 'gmail.com', 'mail.ru', 'yandex.ru']
    
    for email in emails:
        domain = email.split('@')[1].lower()
        if not any(exc in domain for exc in exclude_domains):
            filtered.append(email)
    
    return list(set(filtered))  # Убираем дубликаты

def find_website_via_google(agency_name, browser):
    """Ищет официальный сайт агентства через Google"""
    try:
        page = browser.new_page()
        
        # Поисковый запрос
        query = f'"{agency_name}" недвижимость Москва сайт -vk.com -yell.ru'
        search_url = f"https://www.google.com/search?q={requests.utils.quote(query)}"
        
        print(f"   🔍 Поиск сайта в Google...")
        page.goto(search_url, timeout=15000)
        time.sleep(random.uniform(2, 4))
        
        # Ищем ссылки в результатах поиска
        links = page.locator('a[href^="http"]').all()
        
        for link in links[:10]:  # Первые 10 результатов
            try:
                href = link.get_attribute('href')
                if href and not any(domain in href for domain in ['google.com', 'yell.ru', 'vk.com', 'instagram.com', 'facebook.com']):
                    # Проверяем, что это не реклама
                    if '/url?' not in href and href.startswith('http'):
                        page.close()
                        return href
            except:
                continue
        
        page.close()
        return None
        
    except Exception as e:
        print(f"     ❌ Ошибка поиска в Google: {e}")
        return None

def parse_email_from_website(website_url, browser):
    """Парсит email с сайта"""
    try:
        page = browser.new_page()
        
        print(f"   🌐 Парсинг {website_url}")
        page.goto(website_url, timeout=15000)
        time.sleep(2)
        
        # Получаем текст страницы
        page_text = page.text_content('body')
        
        # Ищем email'ы
        emails = extract_emails_from_text(page_text)
        
        page.close()
        return emails
        
    except Exception as e:
        print(f"     ❌ Ошибка парсинга {website_url}: {e}")
        return []

def process_agency(agency, browser):
    """Обрабатывает одно агентство"""
    name = agency.get('name', '')
    phone = agency.get('phone', '')
    existing_website = agency.get('website', '')
    
    print(f"\n🏢 {name}")
    print(f"   📞 {phone}")
    
    found_emails = []
    found_website = None
    
    # 1. Если есть существующий сайт, проверяем его
    if existing_website and existing_website not in ['', 'https://vk.com/yellru']:
        if 'vk.com' not in existing_website:
            emails = parse_email_from_website(existing_website, browser)
            if emails:
                found_emails.extend(emails)
                found_website = existing_website
    
    # 2. Если не нашли email, ищем официальный сайт
    if not found_emails:
        website = find_website_via_google(name, browser)
        if website:
            print(f"   ✅ Найден сайт: {website}")
            emails = parse_email_from_website(website, browser)
            if emails:
                found_emails.extend(emails)
                found_website = website
    
    # Обновляем данные агентства
    if found_emails:
        agency['email'] = found_emails[0]  # Берем первый найденный
        agency['all_emails'] = found_emails
        print(f"   📧 Email найден: {found_emails[0]}")
    else:
        print(f"   ❌ Email не найден")
    
    if found_website:
        agency['real_website'] = found_website
    
    return agency

def main():
    """Основная функция"""
    print("📧 Поиск email'ов для агентств недвижимости Москвы")
    print("=" * 60)
    
    # Загружаем агентства
    agencies = load_agencies()
    
    if not agencies:
        print("❌ Нет агентств для обработки")
        return
    
    # Ограничиваем для теста
    test_limit = 10
    agencies_to_process = agencies[:test_limit]
    
    print(f"\n🎯 Обрабатываем первые {len(agencies_to_process)} агентств для теста")
    
    # Запускаем браузер
    with sync_api.sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        
        updated_agencies = []
        
        for i, agency in enumerate(agencies_to_process, 1):
            print(f"\n[{i}/{len(agencies_to_process)}]", end="")
            
            updated = process_agency(agency, browser)
            updated_agencies.append(updated)
            
            # Пауза между обработкой
            if i < len(agencies_to_process):
                wait_time = random.uniform(3, 6)
                print(f"   ⏱️ Пауза {wait_time:.1f} сек...")
                time.sleep(wait_time)
        
        browser.close()
    
    # Сохраняем обновленные данные
    output_file = './moscow_agencies_with_emails.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(updated_agencies, f, ensure_ascii=False, indent=2)
    
    # Статистика
    found_emails = [a for a in updated_agencies if a.get('email') and a.get('email') != 'biz@yell.ru']
    
    print("\n" + "=" * 60)
    print("🎉 Обработка завершена!")
    print(f"📊 Обработано: {len(updated_agencies)} агентств")
    print(f"📧 Email'ов найдено: {len(found_emails)} ({len(found_emails)/len(updated_agencies)*100:.0f}%)")
    print(f"💾 Сохранено в: {output_file}")
    
    # Показываем найденные email'ы
    if found_emails:
        print("\n✅ Найденные email'ы:")
        for agency in found_emails:
            print(f"   • {agency['name']}: {agency['email']}")

if __name__ == "__main__":
    main()