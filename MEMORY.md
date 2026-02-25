# MEMORY.md - Core Memory Index
*First 200 lines loaded every session. Details in memory/*.md files.*

## 🚨 CRITICAL SAFETY (2026-02-12 Incident)
**NEVER without confirmation:** `docker rm` DB containers, `DROP DATABASE`, destructive ops
**Process:** Backup → Ask → Confirm → Act
*Details: memory/debugging.md*

## 🎨 Skills & Tools
**Frontend Design:** Unique aesthetics, no AI slop. *Details: skills/frontend-design/SKILL.md*
**Parsing Toolkit:** 2GIS/Yandex scraper, anti-bot, proven 94 leads. *Details: memory/patterns.md*
**Sereja.tech Methods:** 2-fail rule, brainstorming first, specific prompts. *Details: memory/patterns.md*

## 🎯 Active Projects (*memory/projects.md*)

**GeoReview** (Priority #1): MVP live, review widgets. georeview.ru, 89.169.2.143
- ⚠️ ICP PIVOT (2026-02-25): НЕ шиномонтажи/автосервисы (они получают клиентов через карты, виджет не нужен)
- ✅ Новый ICP: компании с сайтом как источником лидов + хороший рейтинг на картах
- ✅ Tier 1 ниши: стоматологии (50к), медклиники (44к), ремонт квартир, автодилеры
- ✅ TAM: ~36к компаний, ~860 млн ₽/год
- ❌ Email аутрич в России не работает (low open rate, спам)
**Scoutly**: Maintenance mode, rebranded from Timly. scoutly.ru, 188.225.24.157  
**Agent Feed**: Social for agents, 40 posts, localhost:3000 → prod API
**Parsing Toolkit**: Ready, supports Novosibirsk (pending task)
**Beflora**: Migrated to 85.239.40.160, old server 185.76.242.32 SHUT DOWN (was sending false notifications)

## 🚨 BEFLORA LESSON (2026-02-24)
After server migration: ALWAYS fully stop old server! Sidekiq/cron keep running after DNS switch.
Old server credentials: 185.76.242.32 root/LOY3zoaZzR964 — DISABLED
New server: 85.239.40.160 root/ck#WkW_BJpW+4F
⚠️ SSL wildcard *.beflora.ru expires 2026-03-28 — RENEW!

## 📧 Email Campaign System (2026-02-24)
GeoReview email system: Python smtplib → geo@georeview.ru → smtp.timeweb.ru
✅ DKIM/SPF/DMARC all pass. From header must use formataddr+Header for UTF-8 names
⚠️ Simple personal email template works (no emoji, no spam words). Old flashy template → spam
Click tracker: https://georeview.ru/click → clicks.json on 89.169.2.143 (redirects to /)
Files: /var/www/georeview/email_campaign/ on server 89.169.2.143
Cron: Click monitor every 15 min → TG notification on new clicks

### Sent 2026-02-24: ~182 emails (91 vet + 3 dental + 88 auto). 2 real clicks (~1.5%)

## 🔧 Parsing Toolkit
- 2GIS parser: `parse_2gis_orgs.js` → `enrich_from_2gis_html.js` → `parse_websites.py`
- Pipeline: search → collect IDs → enrich contacts from 2GIS HTML → parse websites for more emails
- Автосервисы Москва: 326 orgs → 89 unique emails (41 from 2GIS + 48 from websites)
- All leads added to Google Sheet "Автосервисы" tab
- **АН Сочи (2026-02-25):** 97 агентств, 16 email → Google Sheet "Лист4"
- **sochi_mega_parser.py** — мега-парсер из 5 источников (субагент Opus за 6м)
- ⚠️ parse_2gis_orgs.js собирает мусор (объекты, не агентства) — enrich_from_2gis_html.js надёжнее
- ⚠️ Yell.ru email'ы = biz@yell.ru (фейковые). Yell блокирует сервер 89.169.2.143

## 🔑 Сервер GeoReview 89.169.2.143
- SSH: root / vgz^4hkW#jWM-5
- Python3: requests, bs4, gspread, google-auth установлены
- Email рассылка работает (geo@georeview.ru → smtp.timeweb.ru)
