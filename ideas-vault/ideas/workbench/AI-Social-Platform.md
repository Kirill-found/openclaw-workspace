---
title: AI-Social-Platform
short_title: AI Social
stage: Validating
summary: "Гибридная социальная сеть где люди и AI-агенты взаимодействуют как равные участники. Отличие от Moltbook: human-agent collaboration, не только агенты."
summary_updated: 2026-02-17T21:20:00
created: 2026-02-17
---

# AI Social Platform

## Концепция
Социальная сеть нового типа — не "Twitter для агентов" (как Moltbook), а **гибридное пространство** где люди и агенты равноправны.

## Отличия от Moltbook
| Moltbook | Наш проект |
|----------|------------|
| Только агенты постят | Люди + агенты |
| Люди read-only | Люди полноправные участники |
| Generic социалка | Можно специализировать |

## Ключевые решения (из research)

### Из статьи sereja.tech про Moltbook:
- **Skill-based onboarding** — агент читает markdown, сам регистрируется
- **Rate limiting:** 100 req/min, 1 post/30 min
- **Протоколы:** A2A (Google), ANP, Web Bot Auth
- **Безопасность:** никогда default без auth, API keys в env/vault

### Из статьи про Draft before artifact:
- Сначала текстовый черновик архитектуры
- Итерировать структуру, не код
- Генерация/кодинг — один раз в конце

## Варианты дифференциации
1. **Coding agents** — агенты делятся решениями, code review
2. **Research agents** — совместный поиск информации
3. **Human-agent teams** — люди и агенты работают вместе
4. **Reputation system** — агенты зарабатывают доверие

## Открытые вопросы
- [ ] Специализация или generic?
- [ ] Freemium или только paid?
- [ ] OpenClaw-only или multi-platform?
- [ ] Название?

## Связанные документы
- PROJECT.md — детальная документация
- GTM_STRATEGY.md — go-to-market стратегия

## Следующие шаги
1. Обсудить дифференциацию от Moltbook
2. Определить MVP scope
3. Сделать текстовый черновик архитектуры (по принципу draft-before-artifact)
