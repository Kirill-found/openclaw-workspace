# projects.md - Active Projects Status

## 🎯 GeoReview (Priority #1)
**Domain:** georeview.ru | **Server:** 89.169.2.143 | **Status:** MVP Live + Lead Gen Active

### Current Status (2026-02-23)
- **MVP Deployed:** Widget system working, dashboard done
- **Lead Generation:** 94 leads collected, pipeline established
- **Google Sheet:** `1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0`
- **Revenue Model:** Review widgets for client websites (NOT forms!)

### Technical Stack
- **Backend:** Rails 7.2, Ruby 3.3.7, PostgreSQL 16
- **Frontend:** Tailwind, Turbo
- **Scraping:** Playwright (Yandex.Maps + 2GIS)
- **Auth:** gog (Gmail kirillpogorelyy20@gmail.com)

### Lead Generation Pipeline
Scripts on server: `parse_2gis_v4.js`, `check_reviews.js`, `extract_emails.js`
**Key insight:** VPN blocks Yandex/2GIS → parse only from server

---

## 🔧 Parsing Toolkit (Supporting Tool)
**Path:** `/skills/parsing-toolkit/` | **Status:** Ready, Proven

### Capabilities  
- **Cities:** Moscow (733 vets), SPB (204 vets), Novosibirsk (pending)
- **Niches:** Dental 30% email, Auto 20% email, Cosmetics 25% email
- **Anti-bot:** 2GIS internal API interception

### Pending Tasks
- **Novosibirsk veterinary clinics** - was requested in previous session
- Command: `node scripts/parse_2gis_orgs.js "ветеринарная клиника" "Новосибирск" --limit 100`

---

## 🏢 Scoutly (ex-Timly HR)  
**Domain:** scoutly.ru | **Server:** 188.225.24.157 | **Status:** Maintenance Mode

### Recent Changes
- **Rebranded:** Timly → Scoutly (2026-02-13)
- **Email:** hello@scoutly.ru configured
- **SSL:** Valid until 2026-05-14
- **DB:** Safe after 2026-02-12 incident (backup protocols established)

---

## 🌐 Agent Feed
**API:** https://agent-feed-api-production.up.railway.app | **Status:** Active

### Current State
- **40 posts** from Claudie in feed
- **1 human user:** kiir (I liked their "hi!")
- **Frontend:** Running localhost:3000 → production API
- **My API key:** `agent_54e5ff7b132a98e8afd2aa8fd214ffb1f3511342ade8e46b414b6900e601288f`

---

## 🚀 Pending/Ideas
- **Beflora migration** - DNS switch pending
- **Frontend Design skill** - avoid AI slop, unique aesthetics
- **Local memory search** - offline semantic search
- **Jack Cloud integration** - payments, deployment