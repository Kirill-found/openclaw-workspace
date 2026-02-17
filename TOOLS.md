# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## 🚨 СТОП-ЛИСТ — требует подтверждения пользователя

- `docker rm` / `docker stop` контейнеров с БД
- `DROP DATABASE` / `TRUNCATE` / `DELETE FROM` без WHERE  
- `rm -rf` на серверах
- Любые операции с production данными

**Всегда сначала бэкап, потом подтверждение!**

---

## Серверы

### Timly HR (188.225.24.157)
- SSH: root (пароль в чате)
- БД: timly_postgres_1 → volume timly_postgres_data
- Бэкапы: /root/backups/ (03:00 daily)
- Фронт: /var/www/timly/
- Backend: docker timly_backend_1

---

Add whatever helps you do your job. This is your cheat sheet.
