# debugging.md - Bugs & Solutions

## 🚨 CRITICAL: Database Operations (2026-02-12)
**Context:** Accidentally deleted 3 days of Timly data via `docker rm`

**Never do without confirmation:**
- `docker rm` containers with databases
- `DROP DATABASE` / `TRUNCATE` / `DELETE FROM` without WHERE
- `docker-compose down` with volumes
- `rm -rf` on servers

**Process:**
1. Check which container backend actually uses
2. Fresh backup: `pg_dump > backup_YYYYMMDD_HHMMSS.sql`  
3. Ask user: "About to do X, this will delete Y. Confirm?"
4. If something goes wrong - STOP, don't make more changes

**Recovery:**
- Look for backups BEFORE any restoration
- Timly backups in /root/backups/ (daily 03:00 cron)

## 🔍 2GIS Anti-Bot Bypass (2026-02-22)
**Problem:** Direct /firm/ URLs trigger CAPTCHA
**Solution:** Click from search results, intercept internal API
**Script:** `parse_2gis_orgs.js` v4 - proven with 94 leads

## 📧 Email Parsing Rates by Niche
**Dental clinics:** 30% have emails, 15% conversion
**Auto services:** 20% have emails, 12% conversion  
**Cosmetics:** 25% have emails, 18% conversion

## 🌐 VPN & Parsing Issues
**Problem:** Yandex.Maps/2GIS blocked from Mac (VPN)
**Solution:** Parse only from server with Russian IP
**Note:** Kirill can't access these sites directly