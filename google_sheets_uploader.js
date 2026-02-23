const { GoogleSpreadsheet } = require('google-spreadsheet');
const { parseAllVeterinary } = require('./full_veterinary_parser');

class GoogleSheetsUploader {
    constructor(spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
        this.doc = new GoogleSpreadsheet(spreadsheetId);
    }

    async authenticate() {
        try {
            // Попытка авторизации через API ключ (если есть)
            console.log('🔐 Пробуем авторизацию через API ключ...');
            
            // Для демо используем публичный доступ
            await this.doc.loadInfo();
            console.log(`✅ Подключились к таблице: ${this.doc.title}`);
            return true;
            
        } catch (error) {
            console.log('⚠️ Авторизация через API ключ не удалась');
            console.log('💡 Для полной интеграции нужны credentials Google API');
            return false;
        }
    }

    async createNewSheet(title, data) {
        try {
            console.log(`📋 Создаём новый лист: ${title}`);
            
            // Создаём новый лист
            const sheet = await this.doc.addSheet({ 
                title: title,
                headerValues: data[0] // Первая строка как заголовки
            });
            
            console.log(`✅ Лист "${title}" создан`);
            
            // Добавляем данные (пропускаем заголовки)
            if (data.length > 1) {
                console.log(`📊 Загружаем ${data.length - 1} строк данных...`);
                await sheet.addRows(
                    data.slice(1).map(row => {
                        const obj = {};
                        data[0].forEach((header, index) => {
                            obj[header] = row[index] || '';
                        });
                        return obj;
                    })
                );
                console.log('✅ Данные загружены!');
            }
            
            // Форматирование
            await this.formatSheet(sheet);
            
            return sheet;
            
        } catch (error) {
            console.error('❌ Ошибка создания листа:', error.message);
            throw error;
        }
    }

    async formatSheet(sheet) {
        try {
            console.log('🎨 Форматируем лист...');
            
            // Загружаем ячейки для форматирования
            await sheet.loadCells();
            
            // Форматируем заголовки (первая строка)
            for (let col = 0; col < sheet.columnCount; col++) {
                const headerCell = sheet.getCell(0, col);
                if (headerCell.value) {
                    headerCell.textFormat = { bold: true };
                    headerCell.backgroundColor = { red: 0.9, green: 0.9, blue: 0.9 };
                }
            }
            
            // Автоподбор ширины колонок
            await sheet.resize({ rowCount: sheet.rowCount, columnCount: sheet.columnCount });
            
            // Сохраняем форматирование
            await sheet.saveUpdatedCells();
            
            console.log('✅ Форматирование применено');
            
        } catch (error) {
            console.log('⚠️ Ошибка форматирования:', error.message);
        }
    }

    async uploadVeterinaryData() {
        console.log('🚀 ПОЛНЫЙ ПАРСИНГ И ЗАГРУЗКА В GOOGLE SHEETS');
        console.log('============================================');
        
        try {
            // 1. Парсим все ветклиники
            console.log('📊 Этап 1: Анализ всех ветклиник...');
            const { results, sheetsData } = await parseAllVeterinary();
            
            // 2. Подключаемся к Google Sheets
            console.log('🔗 Этап 2: Подключение к Google Sheets...');
            const authenticated = await this.authenticate();
            
            if (!authenticated) {
                console.log('💾 Сохраняем только в CSV файл');
                return { success: false, results };
            }
            
            // 3. Создаём новый лист
            const sheetTitle = `Ветклиники Новосибирска ${new Date().toLocaleDateString('ru-RU')}`;
            console.log('📋 Этап 3: Создание нового листа...');
            
            const sheet = await this.createNewSheet(sheetTitle, sheetsData);
            
            console.log(`
🎉 УСПЕШНО ЗАВЕРШЕНО!
====================
📊 Проанализировано: ${results.length} ветклиник
📋 Создан лист: "${sheetTitle}"
🔗 Ссылка: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}
            `);
            
            return { 
                success: true, 
                results, 
                sheet,
                url: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}` 
            };
            
        } catch (error) {
            console.error('💥 Критическая ошибка:', error);
            throw error;
        }
    }
}

// Демо-версия без полной авторизации
class DemoSheetsUploader {
    async uploadDemo() {
        console.log('📊 ДЕМО: Парсинг ветклиник для Google Sheets');
        console.log('===========================================');
        
        // Парсим данные
        const { results, sheetsData, filename } = await parseAllVeterinary();
        
        // Готовим инструкции для ручной загрузки
        console.log(`
🎯 ДАННЫЕ ГОТОВЫ ДЛЯ GOOGLE SHEETS!
=================================

📁 CSV файл создан: ${filename}

📋 ИНСТРУКЦИИ ДЛЯ РУЧНОЙ ЗАГРУЗКИ:
1. Откройте: https://docs.google.com/spreadsheets/d/1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0/edit
2. Создайте новый лист: "Ветклиники Новосибирска"
3. Импортируйте CSV файл: Файл → Импорт → Загрузить → ${filename}

📊 СТАТИСТИКА:
• Всего ветклиник: ${results.length}
• С email: ${results.filter(r => r.emails && r.emails.length > 0).length}
• С телефонами: ${results.filter(r => r.phones && r.phones.length > 0).length}
• Горячие лиды: ${results.filter(r => r.potential === 'hot').length}

💡 Для автоматической загрузки нужны Google API credentials
        `);
        
        return { results, sheetsData, filename };
    }
}

// Запуск
async function main() {
    const spreadsheetId = '1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0';
    
    // Пробуем полную интеграцию
    const uploader = new GoogleSheetsUploader(spreadsheetId);
    
    try {
        const result = await uploader.uploadVeterinaryData();
        if (!result.success) {
            // Fallback на демо версию
            console.log('🔄 Переходим на демо режим...');
            const demoUploader = new DemoSheetsUploader();
            await demoUploader.uploadDemo();
        }
    } catch (error) {
        console.log('🔄 Запускаем демо версию...');
        const demoUploader = new DemoSheetsUploader();
        await demoUploader.uploadDemo();
    }
}

if (require.main === module) {
    main();
}

module.exports = { GoogleSheetsUploader, DemoSheetsUploader };