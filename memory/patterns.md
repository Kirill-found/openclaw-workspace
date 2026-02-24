# patterns.md - Architecture & Code Patterns

## 🏗️ Sereja.tech Methodology

### Rule of Two Fails
Agent fails twice in a row → `/clear` → new session with exact prompt.
95% context = tool results. Debug in same session costs more than new session.

### Brainstorming Before Code
NOT "do X" → first discussion: requirements → architecture → plan → execution.
30min brainstorming saves a day of rewrites.
**Web search mandatory** — LLM without search suggests outdated solutions.

### Fix → Rule  
Every bug = rule in files. Compound effect.
End of session: "What problems noticed? What to add to rules?"

### Specific Prompts
❌ "Check code for bugs" (50-70K tokens)
✅ "In auth.js check JWT validation" (3K tokens)

## 🎯 Project Patterns

### GeoReview Stack
- **Backend:** Rails 7.2, Ruby 3.3.7 (rbenv), PostgreSQL 16
- **Frontend:** Tailwind CSS, Turbo
- **Scraping:** Playwright (2GIS internal API, Yandex.Maps)
- **Server:** 89.169.2.143 (Timeweb VDS, 2GB RAM)
- **Deploy:** Git push → manual server restart
- **Concept:** Parse reviews from Yandex.Maps + 2GIS → widget for client sites

### Parsing Toolkit
- **Base:** `/skills/parsing-toolkit/`
- **Main script:** `parse_2gis_orgs.js` v4
- **Anti-bot:** Click from search + API interception
- **Cities:** Moscow, SPb, Sochi, Krasnodar + 20 more
- **Niches:** Dental, auto, cosmetics work best

### Scoutly (ex-Timly HR)
- **Domain:** scoutly.ru (rebranded 2026-02-13)
- **Stack:** Backend containers + React frontend
- **Server:** 188.225.24.157
- **DB:** timly_postgres_1 → timly_postgres_data volume
- **Backups:** /root/backups/ daily 03:00

## 🧠 Model Strategy

**Default:** Sonnet 4.5 (cost-effective, sufficient for 90% tasks)
**When 4.6:** Deep analysis >5 files, complex architecture, >200K context
**How:** `sessions_spawn(task="...", model="anthropic/claude-opus-4-6")`

**Principle:** Save tokens by default, scale when justified.
4.6 costs ~1.7x more in practice.