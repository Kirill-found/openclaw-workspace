#!/usr/bin/env python3
# Тестовая версия рассылки для агентств недвижимости

import json
import time

print("🏠 GeoReview Email Campaign for Real Estate Agencies")
print("=" * 60)

try:
    # Загружаем агентства
    with open('./georeview-parsing/leads/краснодар_агентство_недвижимости_2gis_2026-02-25.json', 'r', encoding='utf-8') as f:
        agencies = json.load(f)
    
    print(f"📊 Загружено {len(agencies)} агентств")
    
    # Фильтруем только те что с email
    with_email = [a for a in agencies if a.get('email') and '@' in a['email']]
    print(f"📧 С email: {len(with_email)} агентств")
    print()
    
    for i, agency in enumerate(with_email, 1):
        name = agency.get('name', 'Агентство')
        email = agency.get('email')
        rating = agency.get('rating', 4.5)
        reviews_count = agency.get('reviewCount', 0)
        website = agency.get('website', '')
        
        print(f"{i}. {name}")
        print(f"   📧 Email: {email}")
        print(f"   ⭐ Рейтинг: {rating} ({reviews_count} отзывов)")
        print(f"   🌐 Сайт: {website}")
        
        # Создаем тему письма
        subject = f"Как {name} показать рейтинг {rating}⭐ на сайте?"
        print(f"   📝 Тема: {subject}")
        print()
        
        time.sleep(1)  # Пауза для вывода
    
    print("✅ Тест завершен успешно!")
    print(f"📊 Готово к отправке: {len(with_email)} писем")

except Exception as e:
    print(f"❌ Ошибка: {e}")