# 🚀 GeoReview Email Campaign - Launch Checklist

## ⚠️ КРИТИЧНО! НЕ ПРОПУСКАЙТЕ ЭТАПЫ!

### 📋 PRE-LAUNCH (обязательно):

#### 1. DNS Configuration
```bash
# Проверить существующие DNS записи
nslookup -type=txt georeview.ru

# Добавить через панель Timeweb:
# SPF: "v=spf1 include:timeweb.ru ~all"  
# DMARC: "v=DMARC1; p=quarantine; rua=mailto:admin@georeview.ru"
```

#### 2. Test Email Delivery
```bash
# На сервере 89.169.2.143:
cd /var/www/georeview/email_campaign
python3 test_campaign.py

# ОБЯЗАТЕЛЬНО проверить:
# □ Письмо дошло?
# □ Не в спаме? 
# □ Оформление OK?
# □ Ссылки работают?
```

#### 3. Spam Score Check
```
1. Отправь тестовое письмо на: send-test123@mail-tester.com
2. Открой: https://mail-tester.com/test123  
3. Цель: 8+ из 10 баллов
4. Если < 8 баллов — FIX до запуска!
```

### 🎯 LAUNCH STRATEGY:

#### Week 1 - Warm Up (ОБЯЗАТЕЛЬНО!)
```bash
# День 1: 10 писем (лучшие лиды)
python3 run_warm_up.py --count 10

# День 2: 25 писем  
python3 run_warm_up.py --count 25

# День 3-7: по 50 писем
python3 run_warm_up.py --count 50
```

#### Week 2 - Scale Up  
```bash
# 100-150 писем в день
python3 run_campaign.py --batch-size 100
```

#### Week 3+ - Full Scale
```bash  
# Все оставшиеся лиды
python3 run_campaign.py --full
```

### 📊 MONITORING (ежедневно):

#### Email Metrics (Timeweb панель):
```
✅ Delivery Rate: >95%
⚠️ Bounce Rate: <2% 
🚨 Complaint Rate: <0.1%
```

#### Reputation Check:
```bash
# Blacklist check
curl "https://api.mxtoolbox.com/api/v1/lookup/blacklist/89.169.2.143"

# Sender Score  
# Зайти на: senderscore.org
```

#### Response Tracking:
```bash
# Ответы на geo@georeview.ru
# Считать: заинтересованы / отписки / жалобы
```

### 🚨 STOP CONDITIONS:

#### Немедленно ОСТАНОВИТЬ рассылку если:
- Bounce rate > 5%
- >3 жалоб на спам в день
- IP попал в blacklist 
- Timeweb заблокировал отправку

### 📈 SUCCESS METRICS:

#### Минимальные показатели:
```
Open Rate: >25%
Click Rate: >2% 
Reply Rate: >0.5%
Leads: >5 из первых 1000 писем
```

#### Целевые показатели:
```  
Open Rate: >35%
Click Rate: >5%
Reply Rate: >1%
Leads: >15 из первых 1000 писем
```

### 💰 ROI Calculation:
```
Cost: ~5₽ за письмо (время + сервер)
LTV клиента: 7,507₽  
Break-even: 1 клиент на 1,500 писем (0.07%)
Target: 1 клиент на 100 писем (1%)
```

### 📞 EMERGENCY CONTACTS:
```
Timeweb Support: support@timeweb.ru
Кирилл: kirillpogorelyy20@gmail.com
Server SSH: root@89.169.2.143
```

---

## 🎬 READY TO LAUNCH? 

**Последняя проверка:**
- [ ] DNS записи настроены
- [ ] Тестовое письмо отправлено и проверено
- [ ] Spam score > 8/10
- [ ] Файлы загружены на сервер  
- [ ] Теплый план на неделю готов

**Если все ✅ — МОЖНО ЗАПУСКАТЬ!**

```bash
# First blood 🩸
python3 test_campaign.py
# Если все ОК:
python3 run_warm_up.py --count 10
```