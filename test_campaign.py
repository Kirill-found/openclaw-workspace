#!/usr/bin/env python3
# Тестовая отправка для проверки deliverability

from email_campaign import send_email, create_personalized_subject, create_email_content
import time

def test_email_delivery():
    """Тест отправки на контрольные адреса"""
    
    # Тестовые получатели
    test_recipients = [
        {
            'name': 'Ветклиника "Тест"',
            'city': 'Москва', 
            'rating': '4.8',
            'reviews': '156',
            'email': 'kirillpogorelyy20@gmail.com',  # Твой email для теста
            'website': 'https://test-vet.ru'
        },
        # Добавь еще 2-3 тестовых адреса друзей/коллег
    ]
    
    print("🧪 ТЕСТОВАЯ ОТПРАВКА")
    print("=" * 40)
    
    for recipient in test_recipients:
        try:
            # Создаем тестовое письмо
            subject = f"[ТЕСТ] {create_personalized_subject(recipient['name'], recipient['rating'])}"
            html_content, plain_content = create_email_content(
                recipient['name'], recipient['rating'], recipient['reviews'],
                recipient['website'], recipient['city']
            )
            
            print(f"📧 Отправка тестового письма на {recipient['email']}")
            
            # Отправляем
            success, error = send_email(recipient['email'], subject, html_content, plain_content)
            
            if success:
                print(f"✅ Успешно отправлено")
                
                # Проверяем через mail-tester.com
                print(f"🔍 Проверьте письмо и forward на send-randomhash123@mail-tester.com")
                print(f"   Затем откройте https://mail-tester.com/randomhash123")
                
            else:
                print(f"❌ Ошибка: {error}")
            
            # Пауза между тестовыми письмами
            time.sleep(10)
            
        except Exception as e:
            print(f"❌ Критическая ошибка: {e}")
    
    print("\n" + "=" * 40)
    print("✅ Тест завершен")
    print("\n📋 CHECKLIST перед массовой рассылкой:")
    print("□ Письмо дошло и не в спаме?")
    print("□ Оформление корректное?") 
    print("□ Ссылки работают?")
    print("□ Mail-tester.com дает 8+/10?")
    print("□ DNS записи настроены?")

if __name__ == "__main__":
    test_email_delivery()