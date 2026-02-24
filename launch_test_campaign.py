#!/usr/bin/env python3
# Запуск тестовой кампании с реальными данными

from email_campaign import send_email, create_personalized_subject, create_email_content
from test_leads import get_test_leads
import time
import random

def launch_test_campaign():
    """Запуск тестовой кампании на реальных лидах"""
    
    leads = get_test_leads()
    
    print("🚀 ЗАПУСК ТЕСТОВОЙ EMAIL-КАМПАНИИ GEOREVIEW")
    print("=" * 50)
    print(f"📊 Лидов для тестирования: {len(leads)}")
    print(f"📧 SMTP: geo@georeview.ru через smtp.timeweb.ru")
    print("=" * 50)
    
    sent_count = 0
    failed_count = 0
    
    for i, lead in enumerate(leads):
        try:
            print(f"\n📧 [{i+1}/{len(leads)}] {lead['name']}")
            print(f"   Получатель: {lead['email']}")
            print(f"   Качество: {lead['rating']}⭐, {lead['reviews']} отзывов")
            
            # Создаем персонализированное письмо
            subject = create_personalized_subject(lead['name'], lead['rating'])
            html_content, plain_content = create_email_content(
                lead['name'], lead['rating'], lead['reviews'],
                lead['website'], lead['city']
            )
            
            print(f"   Тема: {subject}")
            
            # Отправляем
            success, error = send_email(lead['email'], subject, html_content, plain_content)
            
            if success:
                sent_count += 1
                print(f"   ✅ ОТПРАВЛЕНО успешно")
            else:
                failed_count += 1
                print(f"   ❌ ОШИБКА: {error}")
            
            # Пауза между отправками (warm-up режим)
            if i < len(leads) - 1:
                wait_time = random.randint(60, 120)  # 1-2 минуты
                print(f"   ⏳ Пауза: {wait_time}с")
                time.sleep(wait_time)
                
        except Exception as e:
            failed_count += 1
            print(f"   ❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")
    
    print("\n" + "=" * 50)
    print(f"🎯 РЕЗУЛЬТАТЫ ТЕСТОВОЙ КАМПАНИИ:")
    print(f"✅ Успешно отправлено: {sent_count}")
    print(f"❌ Ошибок: {failed_count}")
    
    if sent_count > 0:
        success_rate = sent_count / (sent_count + failed_count) * 100
        print(f"📈 Успешность: {success_rate:.1f}%")
        
        if success_rate >= 75:
            print(f"\n🔥 ОТЛИЧНО! Можно запускать массовую рассылку")
            print(f"   Следующий шаг: загрузить полную базу лидов")
        else:
            print(f"\n⚠️ ВНИМАНИЕ: Низкая успешность. Проверьте настройки")
    
    print(f"\n📊 Ожидайте результаты в течение 24 часов:")
    print(f"   - Open Rate: 25-35% = {int(sent_count * 0.3)} открытий")
    print(f"   - Reply Rate: 1-3% = {int(sent_count * 0.02)} ответов") 
    print(f"   - Leads: 1-2 заинтересованных клиента")

if __name__ == "__main__":
    print("⚠️ ВНИМАНИЕ! Запуск РЕАЛЬНОЙ email-рассылки")
    print("📧 Письма будут отправлены настоящим клиентам")
    
    confirm = input("\n❓ Продолжить? (да/нет): ").lower()
    
    if confirm in ['да', 'yes', 'y', 'д']:
        launch_test_campaign()
    else:
        print("❌ Рассылка отменена")