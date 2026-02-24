#!/usr/bin/env python3
# Тестовые данные для первой рассылки

def get_test_leads():
    """Тестовые лиды из СПб"""
    return [
        {
            'name': 'Ветеринарная клиника доктора Сотникова',
            'city': 'СПб',
            'rating': '4.1',
            'reviews': '740',
            'email': 'vms-video@yandex.ru',
            'website': 'http://sotnikov-clinic.ru'
        },
        {
            'name': 'Барсель, ветклиника',
            'city': 'СПб', 
            'rating': '4.6',
            'reviews': '497',
            'email': 'info@vetklinikabars.ru',
            'website': 'http://vetklinikabars.ru'
        },
        {
            'name': 'Честер, ветеринарная клиника',
            'city': 'СПб',
            'rating': '4.6',
            'reviews': '415', 
            'email': 'chestervet@bk.ru',
            'website': 'http://chester-vet.ru'
        },
        # Добавляем твой email для тестирования
        {
            'name': 'Тестовая клиника GeoReview',
            'city': 'Москва',
            'rating': '4.8',
            'reviews': '156',
            'email': 'kirillpogorelyy20@gmail.com',
            'website': 'https://test-vet.ru'
        }
    ]

if __name__ == "__main__":
    leads = get_test_leads()
    print(f"🧪 ТЕСТОВЫЕ ЛИДЫ: {len(leads)}")
    for lead in leads:
        print(f"  {lead['name']} - {lead['email']}")