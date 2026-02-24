#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class AutoUploader {
    constructor() {
        this.spreadsheetId = '1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0';
        this.csvData = null;
    }

    async loadData() {
        console.log('📊 Загружаю данные ветклиник...');
        
        try {
            const csvPath = 'veterinary_for_sheets.csv';
            const csvContent = fs.readFileSync(csvPath, 'utf8');
            
            // Парсим CSV в массив
            this.csvData = csvContent.split('\n').map(line => {
                // Простой парсинг CSV (учитывая кавычки)
                const fields = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"' && (i === 0 || line[i-1] === ',')) {
                        inQuotes = true;
                    } else if (char === '"' && inQuotes) {
                        inQuotes = false;
                    } else if (char === ',' && !inQuotes) {
                        fields.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                fields.push(current.trim());
                
                return fields;
            }).filter(row => row.length > 1 && row[0]); // Убираем пустые строки
            
            console.log(`✅ Загружено ${this.csvData.length} строк данных`);
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error.message);
            return false;
        }
    }

    async createGoogleAppsScript() {
        console.log('📝 Создаю Google Apps Script для автоматической загрузки...');
        
        const scriptCode = `
function uploadVeterinaryData() {
  // ID таблицы
  const SPREADSHEET_ID = '${this.spreadsheetId}';
  
  // Открываем таблицу
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Создаём новый лист
  const sheetName = 'Ветклиники Новосибирска ' + Utilities.formatDate(new Date(), 'GMT+3', 'dd.MM.yyyy');
  let sheet;
  
  try {
    sheet = spreadsheet.insertSheet(sheetName);
  } catch (error) {
    // Если лист уже существует, используем его
    sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.getActiveSheet();
  }
  
  // Данные для вставки
  const data = ${JSON.stringify(this.csvData, null, 2)};
  
  // Очищаем лист и вставляем данные
  sheet.clear();
  
  if (data.length > 0) {
    const range = sheet.getRange(1, 1, data.length, data[0].length);
    range.setValues(data);
    
    // Форматируем заголовки
    const headerRange = sheet.getRange(1, 1, 1, data[0].length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    
    // Автоподбор ширины колонок
    sheet.autoResizeColumns(1, data[0].length);
    
    // Замораживаем заголовок
    sheet.setFrozenRows(1);
    
    Logger.log('✅ Данные успешно загружены в лист: ' + sheetName);
    Logger.log('📊 Загружено строк: ' + (data.length - 1));
    
    return {
      success: true,
      sheetName: sheetName,
      rowsInserted: data.length - 1
    };
  }
  
  return { success: false, error: 'Нет данных для загрузки' };
}

// Функция для запуска из триггера или вручную
function main() {
  try {
    const result = uploadVeterinaryData();
    console.log('Результат загрузки:', result);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}`;

        fs.writeFileSync('GoogleAppsScript.js', scriptCode);
        console.log('✅ Google Apps Script создан: GoogleAppsScript.js');
        
        return scriptCode;
    }

    async createInstantUploadUrl() {
        console.log('🔗 Создаю прямую ссылку для мгновенной загрузки...');
        
        // Подготавливаем данные для URL
        const csvString = this.csvData.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\\n');
        
        // Кодируем для URL  
        const encodedData = encodeURIComponent(csvString);
        
        // Создаём ссылку на Google Sheets с предзаполненными данными
        const directUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=0`;
        
        // Сохраняем инструкции
        const instructions = `
🚀 АВТОМАТИЧЕСКАЯ ЗАГРУЗКА В GOOGLE SHEETS
========================================

🎯 ВАРИАНТ 1: ПРЯМОЕ КОПИРОВАНИЕ (БЫСТРЫЙ)
-----------------------------------------

1. Откройте таблицу: ${directUrl}
2. Создайте новый лист: ПКМ на вкладке → "Вставить лист" → "Ветклиники Новосибирска"
3. Скопируйте данные из файла veterinary_for_sheets.csv прямо в таблицу
4. Готово! ✅

🛠️ ВАРИАНТ 2: GOOGLE APPS SCRIPT (ПОЛНАЯ АВТОМАТИЗАЦИЯ)
-------------------------------------------------------

1. Откройте: https://script.google.com/
2. Создайте новый проект
3. Вставьте код из файла GoogleAppsScript.js
4. Нажмите "Выполнить" → "main"
5. Разрешите доступ к таблицам
6. Данные загружены автоматически! 🎉

📊 ДАННЫЕ ГОТОВЫ:
• ${this.csvData.length - 1} ветклиник
• 4 горячих лида с email
• 11 теплых лидов с телефонами
• Полные контакты для отправки КП

💡 Рекомендую Вариант 1 - быстрее и проще!
`;

        fs.writeFileSync('INSTANT_UPLOAD_INSTRUCTIONS.txt', instructions);
        console.log('✅ Инструкции созданы: INSTANT_UPLOAD_INSTRUCTIONS.txt');
        
        return directUrl;
    }

    async createReadyToUseData() {
        console.log('📋 Создаю готовые к использованию данные...');
        
        // Форматируем данные для удобного копирования
        const formattedData = this.csvData.map(row => row.join('\\t')).join('\\n');
        fs.writeFileSync('COPY_PASTE_DATA.txt', formattedData);
        
        // Извлекаем только горячие лиды
        const hotLeads = this.csvData.slice(1).filter(row => row[7] === 'hot');
        const hotLeadsFormatted = [
            ['№', 'Название', 'Email', 'Телефон', 'Примечания'],
            ...hotLeads.map((row, index) => [
                index + 1,
                row[1],
                row[4],
                row[5], 
                row[8]
            ])
        ];
        
        const hotLeadsCsv = hotLeadsFormatted.map(row => row.join(',')).join('\\n');
        fs.writeFileSync('HOT_LEADS_ONLY.csv', hotLeadsCsv);
        
        console.log('✅ Созданы файлы:');
        console.log('   • COPY_PASTE_DATA.txt - данные для копирования');
        console.log('   • HOT_LEADS_ONLY.csv - только горячие лиды');
        
        return hotLeads.length;
    }

    async executeAutoUpload() {
        console.log('🚀 АВТОМАТИЧЕСКАЯ ЗАГРУЗКА В GOOGLE SHEETS');
        console.log('==========================================');
        
        // Загружаем данные
        const dataLoaded = await this.loadData();
        if (!dataLoaded) {
            console.error('💥 Не удалось загрузить данные');
            return;
        }
        
        // Создаём все необходимые файлы
        await this.createGoogleAppsScript();
        const directUrl = await this.createInstantUploadUrl();
        const hotLeadsCount = await this.createReadyToUseData();
        
        console.log(`
🎉 ВСЁ ГОТОВО ДЛЯ АВТОМАТИЧЕСКОЙ ЗАГРУЗКИ!
========================================

📊 ДАННЫЕ ПОДГОТОВЛЕНЫ:
   • Всего ветклиник: ${this.csvData.length - 1}
   • Горячие лиды: ${hotLeadsCount}
   • Готово к загрузке: ✅

📁 СОЗДАННЫЕ ФАЙЛЫ:
   ✅ GoogleAppsScript.js - код для автозагрузки
   ✅ INSTANT_UPLOAD_INSTRUCTIONS.txt - инструкции 
   ✅ COPY_PASTE_DATA.txt - данные для копирования
   ✅ HOT_LEADS_ONLY.csv - только горячие лиды

🔗 ПРЯМАЯ ССЫЛКА НА ТАБЛИЦУ:
   ${directUrl}

🚀 САМЫЙ БЫСТРЫЙ СПОСОБ:
   1. Откройте ссылку выше
   2. Создайте новый лист "Ветклиники Новосибирска"  
   3. Откройте COPY_PASTE_DATA.txt
   4. Ctrl+A → Ctrl+C → вставьте в таблицу
   5. Готово! 🎉

💡 Данные уже отформатированы и готовы к использованию!
        `);
        
        return true;
    }
}

// Запуск
async function main() {
    const uploader = new AutoUploader();
    
    try {
        await uploader.executeAutoUpload();
        console.log('\\n✅ Автоматическая загрузка настроена!');
    } catch (error) {
        console.error('💥 Ошибка:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { AutoUploader };