#!/usr/bin/env python3
# Отправка одного тестового письма

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header

# SMTP настройки Timeweb
SMTP_SERVER = "smtp.timeweb.ru"
SMTP_PORT = 465
SENDER_EMAIL = "geo@georeview.ru"
SENDER_PASSWORD = ":ywF>K%wD5kkQS"
SENDER_NAME = "Кирилл из GeoReview"

def send_test_email():
    """Отправка тестового письма"""
    
    to_email = "ayax@ayax.ru"  # Первое агентство
    to_name = "Аякс"
    subject = "Тест: Как показать рейтинг 4.7⭐ на сайте?"
    
    html_content = """
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h1>Привет, Аякс! 👋</h1>
        
        <p>Это тестовое письмо от GeoReview.</p>
        
        <p>Видел ваш рейтинг <strong>4.7⭐</strong> в 2ГИС — впечатляет!</p>
        
        <p>Хотели бы показать эти отзывы на своём сайте?</p>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="https://georeview.ru" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Узнать больше
            </a>
        </div>
        
        <p>С уважением,<br>Кирилл<br>GeoReview</p>
    </body>
    </html>
    """
    
    try:
        print("📧 Отправка тестового письма...")
        print(f"   Кому: {to_name} ({to_email})")
        print(f"   Тема: {subject}")
        
        # Создаем сообщение
        msg = MIMEMultipart('alternative')
        msg['From'] = f'"{SENDER_NAME}" <{SENDER_EMAIL}>'
        msg['To'] = to_email
        msg['Subject'] = Header(subject, 'utf-8').encode()
        
        # HTML версия
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Отправляем
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            print("   🔐 Подключение к SMTP...")
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            print("   ✅ Авторизация успешна")
            
            server.send_message(msg)
            print("   📨 Письмо отправлено!")
            
        print("🎉 Успех!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Тест отправки email для агентств недвижимости")
    print("=" * 50)
    send_test_email()