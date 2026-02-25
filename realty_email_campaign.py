#!/usr/bin/env python3
# GeoReview Email Campaign for Real Estate Agencies
# Адаптировано для агентств недвижимости

import smtplib
import json
import time
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from datetime import datetime
import csv

# SMTP настройки Timeweb
SMTP_SERVER = "smtp.timeweb.ru"
SMTP_PORT = 465
SENDER_EMAIL = "geo@georeview.ru"
SENDER_PASSWORD = ":ywF>K%wD5kkQS"
SENDER_NAME = "Кирилл из GeoReview"

def create_personalized_subject(agency_name, rating):
    """Персонализированная тема письма для агентств недвижимости"""
    subjects = [
        f"Как {agency_name} показать рейтинг {rating}⭐ на сайте?",
        f"📈 {agency_name}: +40% клиентов через отзывы с карт",
        f"⭐ Рейтинг {rating} остается в 2ГИС/Яндекс. А на сайте?",
        f"Как {agency_name} может удвоить доверие клиентов за 2 минуты",
        f"🏠 {agency_name}: покажите отзывы клиентов на своём сайте",
        f"Недвижимость {rating}⭐ → клиенты не видят на сайте?"
    ]
    return random.choice(subjects)

def create_email_content(agency_name, rating, reviews_count, website, city="Краснодар"):
    """Персонализированное письмо для агентства недвижимости"""
    
    # Определяем проблему клиента
    if not reviews_count or int(reviews_count) < 20:
        trust_issue = "клиенты не доверяют сайту без отзывов"
        social_proof = "нет социального доказательства"
    else:
        trust_issue = f"ваши {reviews_count} отзывов не видны посетителям сайта"
        social_proof = f"{reviews_count} отзывов работают только в картах"
    
    html_content = f"""
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GeoReview для агентств недвижимости</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Заголовок -->
        <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
            Привет, {agency_name}! 👋
        </h1>
        
        <!-- Проблема -->
        <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Видел ваш рейтинг <strong>{rating}⭐</strong> в 2ГИС — впечатляет! 
            Но есть проблема: {trust_issue}.
        </p>
        
        <!-- Боль клиента -->
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #dc2626; font-weight: 500;">
                🚨 Клиенты заходят на ваш сайт и не видят отзывов = уходят к конкурентам
            </p>
        </div>
        
        <!-- Решение -->
        <h2 style="color: #059669; font-size: 20px; margin: 24px 0 16px 0;">
            ✅ Решение: Виджет отзывов GeoReview
        </h2>
        
        <ul style="color: #374151; padding-left: 20px; margin-bottom: 24px;">
            <li style="margin-bottom: 8px;">
                <strong>Синхронизация отзывов</strong> из 2ГИС, Яндекс.Карт, Google на ваш сайт
            </li>
            <li style="margin-bottom: 8px;">
                <strong>+40% конверсий</strong> — клиенты видят отзывы и доверяют
            </li>
            <li style="margin-bottom: 8px;">
                <strong>Установка за 2 минуты</strong> — один код на сайт
            </li>
            <li style="margin-bottom: 8px;">
                <strong>Автообновление</strong> — новые отзывы появляются сами
            </li>
        </ul>
        
        <!-- Кейс -->
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #0369a1; margin: 0 0 12px 0; font-size: 16px;">
                📊 Кейс: "Премиум Недвижимость" (Москва)
            </h3>
            <p style="margin: 0; color: #374151; font-size: 14px;">
                Добавили виджет с 127 отзывами → <strong>+38% заявок за месяц</strong>. 
                Клиенты стали доверять и чаще оставляли контакты.
            </p>
        </div>
        
        <!-- CTA -->
        <div style="text-align: center; margin: 32px 0;">
            <a href="https://georeview.ru?utm_source=email&utm_medium=realty&utm_campaign=trust" 
               style="display: inline-block; background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                🏠 Попробовать бесплатно
            </a>
        </div>
        
        <!-- Дополнительная мотивация -->
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ⏱️ <strong>Бесплатная настройка</strong> — покажем отзывы на вашем сайте за 15 минут
            </p>
        </div>
        
        <!-- Для недвижимости специально -->
        <div style="margin: 24px 0;">
            <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">
                🎯 Почему именно для недвижимости это критично:
            </h3>
            <ul style="color: #6b7280; font-size: 14px; padding-left: 20px;">
                <li style="margin-bottom: 6px;">Покупка квартиры = крупные деньги = нужно максимум доверия</li>
                <li style="margin-bottom: 6px;">Клиенты изучают агентство 2-3 дня перед звонком</li>
                <li style="margin-bottom: 6px;">Конкуренция огромная — доверие решает всё</li>
            </ul>
        </div>
        
        <!-- Подпись -->
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
                С уважением,<br>
                <strong>Кирилл</strong><br>
                Основатель GeoReview
            </p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                📧 geo@georeview.ru • 🌐 georeview.ru
            </p>
        </div>
        
        <!-- Отписка -->
        <div style="margin-top: 20px; text-align: center;">
            <a href="https://georeview.ru/unsubscribe?email={{email}}" 
               style="color: #9ca3af; font-size: 12px; text-decoration: none;">
                Отписаться от рассылки
            </a>
        </div>
        
    </div>
</body>
</html>
"""
    
    return html_content

def send_email(to_email, to_name, subject, html_content, dry_run=False):
    """Отправка email с правильной кодировкой для русских символов"""
    try:
        # Создаем сообщение
        msg = MIMEMultipart('alternative')
        
        # Заголовки с правильной кодировкой
        msg['From'] = f'"{SENDER_NAME}" <{SENDER_EMAIL}>'
        msg['To'] = to_email
        msg['Subject'] = Header(subject, 'utf-8').encode()
        
        # HTML версия
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        if dry_run:
            print(f"[DRY RUN] Отправил бы письмо {to_name} ({to_email})")
            print(f"         Тема: {subject}")
            return True
        
        # Отправляем
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            
        print(f"✅ Отправлено {to_name} ({to_email})")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка отправки {to_email}: {e}")
        return False

def load_realty_agencies():
    """Загружает агентства недвижимости из JSON файла"""
    with open('./georeview-parsing/leads/краснодар_агентство_недвижимости_2gis_2026-02-25.json', 'r', encoding='utf-8') as f:
        agencies = json.load(f)
    
    # Фильтруем только те что с email
    with_email = [a for a in agencies if a.get('email') and '@' in a['email']]
    
    print(f"📊 Загружено {len(agencies)} агентств, {len(with_email)} с email")
    return with_email

def main():
    """Основная функция рассылки"""
    print("🏠 GeoReview Email Campaign for Real Estate Agencies")
    print("=" * 60)
    
    # Загружаем агентства
    agencies = load_realty_agencies()
    
    if not agencies:
        print("❌ Не найдено агентств с email")
        return
    
    # Настройки рассылки
    dry_run = False  # Установить True для тестовой отправки
    delay_seconds = 30  # Пауза между письмами
    
    print(f"📧 Начинаем рассылку для {len(agencies)} агентств")
    print(f"⏱️  Пауза между письмами: {delay_seconds} сек")
    print(f"🔍 Режим: {'DRY RUN (тест)' if dry_run else 'РЕАЛЬНАЯ ОТПРАВКА'}")
    print()
    
    import sys
    sys.stdout.flush()  # Принудительная запись в stdout
    
    success_count = 0
    
    for i, agency in enumerate(agencies, 1):
        name = agency.get('name', 'Агентство')
        email = agency.get('email')
        rating = agency.get('rating', 4.5)
        reviews_count = agency.get('reviewCount', 0)
        website = agency.get('website', '')
        
        # Создаем контент
        subject = create_personalized_subject(name, rating)
        html_content = create_email_content(name, rating, reviews_count, website)
        
        print(f"{i}/{len(agencies)} {name}")
        
        # Отправляем
        if send_email(email, name, subject, html_content, dry_run):
            success_count += 1
        
        # Пауза между письмами (кроме последнего)
        if i < len(agencies):
            print(f"   ⏱️ Пауза {delay_seconds} сек...")
            time.sleep(delay_seconds)
        
        print()
    
    print("=" * 60)
    print(f"🎉 Рассылка завершена!")
    print(f"✅ Успешно отправлено: {success_count}/{len(agencies)}")
    print(f"📊 Процент успеха: {round(success_count/len(agencies)*100)}%")

if __name__ == "__main__":
    main()