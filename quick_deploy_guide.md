# 🚀 Quick Deploy Guide - GeoReview Email Campaign

## 1. Upload files
```bash
scp georeview_email_campaign.tar.gz root@89.169.2.143:/var/www/
```

## 2. Setup on server
```bash
ssh root@89.169.2.143
cd /var/www
mkdir -p georeview/email_campaign  
cd georeview/email_campaign
mv ../georeview_email_campaign.tar.gz .
tar -xzf georeview_email_campaign.tar.gz
chmod +x *.py
```

## 3. Test first!
```bash
python3 test_campaign.py
```

## 4. If test OK - warm up
```bash
python3 run_warm_up.py --count 10
```

## 5. Monitor results, then scale up
```bash
# Day 2: 25 emails
python3 run_warm_up.py --count 25

# Day 3-7: 50 emails  
python3 run_warm_up.py --count 50

# Week 2: Full blast
python3 run_campaign.py
```

## Expected Results:
- 📧 113 emails total
- 📈 30-35% open rate = ~34 opens
- 💰 1-2 leads = 7,500-15,000₽ revenue
- 🎯 ROI: ~1,200%

## 🚨 Stop if:
- Bounce rate > 5%
- Multiple spam complaints
- IP blacklisted
```