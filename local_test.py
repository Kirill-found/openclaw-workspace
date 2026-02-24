#!/usr/bin/env python3
# Локальный тест одного письма

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

def test_single_email():
    """Тест отправки одного письма"""
    
    # Тестовый получатель
    to_email = "kirillpogorelyy20@gmail.com"
    subject = "🧪 Тест GeoReview - проверка доставляемости"
    
    html_content = """
<h1>🧪 Тест системы рассылки GeoReview</h1>
<p>Привет! Это тестовое письмо для проверки работы email-системы.</p>
<p><strong>Если ты видишь это письмо - система работает!</strong></p>
<p>Следующий шаг: массовая рассылка для 94 ветклиник.</p>
<p>С уважением,<br>Кирилл</p>
"""
    
    plain_content = """
🧪 Тест системы рассылки GeoReview

Привет! Это тестовое письмо для проверки работы email-системы.

Если ты видишь это письмо - система работает!

Следующий шаг: массовая рассылка для 94 ветклиник.

С уважением,
Кирилл
"""
    
    try:
        # Создаем сообщение
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = Header(subject, 'utf-8')
        
        # Добавляем части
        part1 = MIMEText(plain_content, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Отправляем
        print(f"📧 Отправка тестового письма на {to_email}...")
        
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            
        print("✅ ПИСЬМО ОТПРАВЛЕНО УСПЕШНО!")
        print("🔍 Проверь почту (включая папку спам)")
        
        return True
        
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        return False

if __name__ == "__main__":
    print("🧪 ЛОКАЛЬНЫЙ ТЕСТ ОТПРАВКИ")
    print("=" * 30)
    
    result = test_single_email()
    
    if result:
        print("\n🎯 СИСТЕМА ГОТОВА К МАССОВОЙ РАССЫЛКЕ!")
    else:
        print("\n⚠️ НУЖНО ИСПРАВИТЬ ОШИБКИ ПЕРЕД РАССЫЛКОЙ")