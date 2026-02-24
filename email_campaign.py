#!/usr/bin/env python3
# GeoReview Email Campaign Script
# Отправка с сервера 89.169.2.143 через geo@georeview.ru

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
SENDER_PASSWORD = ":ywF>K%wD5kkQS"  # Из TOOLS.md
SENDER_NAME = "Кирилл из GeoReview"

def create_personalized_subject(clinic_name, rating):
    """Персонализированная тема письма"""
    subjects = [
        f"Как {clinic_name} показать рейтинг {rating}⭐ на сайте?",
        f"📈 {clinic_name}: +35% клиентов через отзывы с карт",
        f"⭐ Рейтинг {rating} остается в 2ГИС. А на сайте?",
        f"Как {clinic_name} может удвоить доверие клиентов за 2 минуты"
    ]
    return random.choice(subjects)

def create_email_content(clinic_name, rating, reviews_count, website, city):
    """Персонализированное письмо для ветклиники"""
    
    # Определяем проблему клиента
    trust_issue = "люди не доверяют сайту без отзывов" if not reviews_count or int(reviews_count) < 50 else f"ваши {reviews_count} отзывов не видны посетителям сайта"
    
    html_content = f"""
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GeoReview</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Заголовок -->
        <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
            Здравствуйте! 👋
        </h1>
        
        <!-- Персонализация -->
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
            Изучал отзывы ветклиник {city} и обратил внимание на <strong>{clinic_name}</strong> — 
            рейтинг <span style="color: #f59e0b; font-weight: 600;">{rating}⭐</span> в 2ГИС, это отличный результат!
        </p>
        
        <!-- Проблема -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">
                ⚠️ Но есть нюанс: {trust_issue}
            </p>
        </div>
        
        <!-- Решение -->
        <p style="color: #4b5563; font-size: 16px;">
            <strong>GeoReview</strong> решает эту проблему за 2 минуты — интегрируем ваши отзывы 
            с 2ГИС прямо на сайт. Посетители видят реальный рейтинг и доверяют больше.
        </p>
        
        <!-- Статистика -->
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 18px;">📊 Результаты клиентов:</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
                <li><strong>+35% конверсия</strong> сайта в звонки</li>
                <li><strong>2 минуты</strong> на подключение</li>
                <li><strong>Автообновление</strong> новых отзывов</li>
                <li><strong>Защита от спама</strong> — только проверенные отзывы</li>
            </ul>
        </div>
        
        <!-- CTA -->
        <div style="text-align: center; margin: 32px 0;">
            <a href="https://georeview.ru?utm_source=email&utm_campaign=vet_{city.lower()}&utm_content=cta" 
               style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                🚀 Попробовать бесплатно
            </a>
        </div>
        
        <!-- Социальное доказательство -->
        <p style="color: #6b7280; font-size: 14px; text-align: center; font-style: italic;">
            Уже 94 клиники доверили нам свою репутацию
        </p>
        
        <!-- Подпись -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 32px;">
            <p style="color: #4b5563; margin-bottom: 8px;">
                С уважением,<br>
                <strong>Кирилл Погорелый</strong><br>
                Основатель GeoReview
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                📧 geo@georeview.ru | 🌐 <a href="https://georeview.ru" style="color: #3b82f6;">georeview.ru</a>
            </p>
        </div>
        
        <!-- Отписка -->
        <div style="text-align: center; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px;">
                Не хотите получать письма? <a href="https://georeview.ru/unsubscribe" style="color: #6b7280;">Отписаться</a>
            </p>
        </div>
        
    </div>
</body>
</html>
"""
    
    # Также создаем plain text версию
    plain_content = f"""
Здравствуйте!

Изучал отзывы ветклиник {city} и обратил внимание на {clinic_name} — рейтинг {rating}⭐ в 2ГИС, это отличный результат!

Но есть нюанс: {trust_issue}

GeoReview решает эту проблему за 2 минуты — интегрируем ваши отзывы с 2ГИС прямо на сайт. 

Результаты клиентов:
• +35% конверсия сайта в звонки  
• 2 минуты на подключение
• Автообновление новых отзывов
• Защита от спама — только проверенные отзывы

Попробуйте бесплатно: https://georeview.ru

Уже 94 клиники доверили нам свою репутацию.

С уважением,
Кирилл Погорелый
Основатель GeoReview
geo@georeview.ru | georeview.ru

Не хотите получать письма? Ответьте "STOP"
"""
    
    return html_content, plain_content

def send_email(to_email, subject, html_content, plain_content):
    """Отправка email через Timeweb SMTP"""
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = Header(subject, 'utf-8')
        
        # Добавляем заголовки для лучшей доставляемости
        msg['Reply-To'] = SENDER_EMAIL
        msg['Return-Path'] = SENDER_EMAIL
        msg['X-Mailer'] = 'GeoReview Campaign 1.0'
        
        # Прикрепляем plain text и HTML версии
        part1 = MIMEText(plain_content, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Подключение к SMTP серверу
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            
        return True, None
    except Exception as e:
        return False, str(e)

def main():
    """Главная функция рассылки"""
    print("🚀 Запуск рассылки GeoReview...")
    
    # Здесь будет логика чтения данных из Google Sheets
    # и отправки писем с интервалами для избежания спама
    
    # Статистика
    total_sent = 0
    total_failed = 0
    
    print(f"📊 Отправлено: {total_sent}, Ошибок: {total_failed}")

if __name__ == "__main__":
    main()