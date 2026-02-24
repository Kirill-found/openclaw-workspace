#!/usr/bin/env python3
# Прямой запуск рассылки без подтверждений

from email_campaign import send_email, create_personalized_subject, create_email_content
from test_leads import get_test_leads
import time

def direct_launch():
    """Прямой запуск кампании"""
    
    leads = get_test_leads()
    
    print("🚀 ПРЯМОЙ ЗАПУСК EMAIL-КАМПАНИИ GEOREVIEW")
    print("=" * 50)
    
    for i, lead in enumerate(leads):
        print(f"\n📧 [{i+1}/{len(leads)}] {lead['name']} -> {lead['email']}")
        
        try:
            subject = create_personalized_subject(lead['name'], lead['rating'])
            html_content, plain_content = create_email_content(
                lead['name'], lead['rating'], lead['reviews'],
                lead['website'], lead['city']
            )
            
            success, error = send_email(lead['email'], subject, html_content, plain_content)
            
            if success:
                print(f"   ✅ ОТПРАВЛЕНО")
            else:
                print(f"   ❌ ОШИБКА: {error}")
                
            # Пауза 30 секунд
            if i < len(leads) - 1:
                print(f"   ⏳ Пауза 30с...")
                time.sleep(30)
                
        except Exception as e:
            print(f"   ❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")
    
    print("\n🎯 КАМПАНИЯ ЗАВЕРШЕНА!")

if __name__ == "__main__":
    direct_launch()