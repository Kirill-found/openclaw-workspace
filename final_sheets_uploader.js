#!/usr/bin/env node

const { createVerifiedDataset } = require('./verified_veterinary_data');
const fs = require('fs');

class FinalSheetsUploader {
    constructor() {
        this.spreadsheetId = '1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0';
    }

    async processData() {
        console.log('🚀 ФИНАЛЬНАЯ ОБРАБОТКА ВЕТКЛИНИК НОВОСИБИРСКА');
        console.log('═══════════════════════════════════════════');
        
        try {
            // Создаём проверенный датасет
            const result = await createVerifiedDataset();
            
            // Создаём инструкции для загрузки
            await this.createUploadInstructions(result);
            
            // Создаём готовый к импорту файл
            await this.createImportReadyFile(result);
            
            return result;
            
        } catch (error) {
            console.error('💥 Критическая ошибка:', error);
            throw error;
        }
    }

    async createImportReadyFile(result) {
        const importFilename = 'IMPORT_TO_SHEETS.csv';
        
        // Создаём CSV с улучшенным форматированием для Google Sheets
        const csvContent = result.sheetsData
            .map(row => row.map(cell => {
                // Экранируем запятые и кавычки для корректного импорта
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(','))
            .join('\n');
        
        fs.writeFileSync(importFilename, csvContent);
        
        console.log(`📁 Файл для импорта создан: ${importFilename}`);
        
        return importFilename;
    }

    async createUploadInstructions(result) {
        const instructions = `
🎯 ИНСТРУКЦИИ ПО ЗАГРУЗКЕ В GOOGLE SHEETS
========================================

📊 ВАШИ ДАННЫЕ ГОТОВЫ!
• Всего ветклиник: ${result.data.length}
• Горячие лиды с email: ${result.stats.hotLeads}
• Проверенные контакты: ${result.stats.withEmails + result.stats.withPhones}

🔗 ССЫЛКА НА ТАБЛИЦУ:
https://docs.google.com/spreadsheets/d/1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0/edit

📋 ПОШАГОВАЯ ИНСТРУКЦИЯ:

1️⃣ ОТКРОЙТЕ ТАБЛИЦУ
   Нажмите на ссылку выше

2️⃣ СОЗДАЙТЕ НОВЫЙ ЛИСТ  
   Внизу экрана: правый клик → "Вставить лист"
   Название: "Ветклиники Новосибирска $(date +%d.%m.%Y)"

3️⃣ ИМПОРТИРУЙТЕ ДАННЫЕ
   Файл → Импорт → Загрузить файл → IMPORT_TO_SHEETS.csv
   
   Настройки импорта:
   ✅ Тип разделителя: Запятая
   ✅ Преобразовать текст в числа: Да
   ✅ Создать новый лист: Нет (используйте созданный)

4️⃣ РЕЗУЛЬТАТ
   🎉 ${result.data.length} ветклиник с полными контактами!

💡 ГОРЯЧИЕ ЛИДЫ ДЛЯ НЕМЕДЛЕННОЙ ОТПРАВКИ КП:
${result.data.filter(v => v.potential === 'hot').map(v => 
`   🔥 ${v.name}: ${v.emails.join(', ')}`
).join('\n')}

📈 ГОТОВО К ОТПРАВКЕ КОММЕРЧЕСКИХ ПРЕДЛОЖЕНИЙ!
`;

        fs.writeFileSync('UPLOAD_INSTRUCTIONS.txt', instructions);
        console.log('📋 Инструкции сохранены: UPLOAD_INSTRUCTIONS.txt');
        
        return instructions;
    }

    async displayResults(result) {
        console.log(`
🎉 ОБРАБОТКА ЗАВЕРШЕНА УСПЕШНО!
==============================

📊 СТАТИСТИКА:
   • Проанализировано: ${result.data.length} ветклиник
   • Горячие лиды: ${result.stats.hotLeads} (с email)
   • Теплые лиды: ${result.data.length - result.stats.hotLeads} (телефоны/мессенджеры)
   • Общий охват: ${result.stats.withPhones} контактов

📁 СОЗДАННЫЕ ФАЙЛЫ:
   • ${result.filename} - исходные данные
   • IMPORT_TO_SHEETS.csv - готов к импорту
   • UPLOAD_INSTRUCTIONS.txt - инструкции

🔗 ПРЯМАЯ ССЫЛКА НА ТАБЛИЦУ:
   https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit

🚀 СЛЕДУЮЩИЕ ШАГИ:
   1. Откройте таблицу по ссылке выше
   2. Создайте новый лист "Ветклиники Новосибирска"
   3. Импортируйте файл IMPORT_TO_SHEETS.csv
   4. Начинайте отправку КП горячим лидам!

💰 ПОТЕНЦИАЛЬНАЯ ВЫРУЧКА: ${(result.stats.hotLeads * 15000).toLocaleString()}₽/год
        `);
    }
}

// Запуск
async function main() {
    const uploader = new FinalSheetsUploader();
    
    try {
        const result = await uploader.processData();
        await uploader.displayResults(result);
        
        console.log('\n✅ ВСЁ ГОТОВО! Проверьте созданные файлы.');
        
    } catch (error) {
        console.error('💥 Ошибка:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { FinalSheetsUploader };