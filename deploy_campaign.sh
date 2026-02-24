#!/bin/bash
# Деплой рассылки на сервер GeoReview

SERVER="89.169.2.143"
USER="root"
REMOTE_PATH="/var/www/georeview/email_campaign"

echo "🚀 Деплой email-кампании на сервер..."

# Создаем архив с файлами рассылки
tar -czf campaign.tar.gz *.py *.md

# Копируем на сервер
echo "📦 Копирование файлов..."
scp campaign.tar.gz ${USER}@${SERVER}:${REMOTE_PATH}/

# Распаковываем и настраиваем на сервере
ssh ${USER}@${SERVER} << 'EOF'
cd /var/www/georeview/email_campaign
tar -xzf campaign.tar.gz
rm campaign.tar.gz

# Устанавливаем зависимости Python если нужно
# python3 -m pip install --upgrade pip

# Делаем файлы исполняемыми
chmod +x *.py

# Устанавливаем gog CLI если еще не установлен
# curl -s https://api.github.com/repos/steipete/gogcli/releases/latest | grep "browser_download_url.*linux" | cut -d '"' -f 4 | wget -qi -
# chmod +x gog && mv gog /usr/local/bin/

echo "✅ Файлы развернуты в ${PWD}"
ls -la
EOF

echo "🎯 Готово! Теперь можно запускать тесты на сервере"
rm campaign.tar.gz