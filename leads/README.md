# GeoReview — База лидов

Единая таблица потенциальных клиентов для виджета GeoReview.

## Файлы
- `leads.csv` — основная база лидов
- По городам/нишам: `fitness_krasnodar.json`, `fitness_leads.json` и т.д.

## Колонки leads.csv
| Колонка | Описание |
|---------|----------|
| city | Город |
| category | Тип бизнеса (фитнес, стоматология, рестораны...) |
| name | Название организации |
| address | Адрес |
| website | Сайт |
| has_reviews_widget | Есть ли виджет отзывов на сайте (да/нет) |
| reviews_source | Источник отзывов на сайте (none/own/yandex/2gis) |
| yandex_rating | Рейтинг на Яндекс Картах |
| yandex_reviews | Кол-во оценок на Яндексе |
| yandex_url | URL на Яндекс Картах |
| twogis_rating | Рейтинг на 2ГИС |
| twogis_reviews | Кол-во оценок на 2ГИС |
| twogis_url | URL на 2ГИС |
| email | Email |
| phone | Телефон |
| whatsapp | WhatsApp |
| telegram | Telegram |
| instagram | Instagram |
| vk | VK |
| unique_info | Уникальность для КП |
| slogan | Слоган |
| status | Статус (new/contacted/demo/client/rejected) |
| notes | Заметки |

## Добавление лидов
Запусти парсинг: "собери лидов [ниша] в [город]"
