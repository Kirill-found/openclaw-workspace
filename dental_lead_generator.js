const WebsiteAnalyzer = require('./website_analyzer');
const fs = require('fs');

class DentalLeadGenerator {
    constructor() {
        this.analyzer = new WebsiteAnalyzer();
        this.results = [];
        this.stats = {
            total: 0,
            withWebsite: 0,
            withEmail: 0,
            hot: 0,
            warm: 0,
            cold: 0
        };
    }

    async processLeads(dataFile) {
        console.log('🚀 Запускаем анализ лидов для GeoReview...');
        
        // Читаем данные от парсера
        const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        console.log(`📊 Загружено ${rawData.length} стоматологий`);
        
        await this.analyzer.init();
        
        // Фильтруем только записи с сайтами для начала
        const withWebsites = rawData.filter(item => item.website && item.website !== 'нет сайта');
        console.log(`🌐 Найдено ${withWebsites.length} организаций с сайтами`);
        
        let processed = 0;
        
        for (const clinic of rawData) {
            try {
                const analyzed = await this.analyzer.analyzeSite(clinic);
                this.results.push(analyzed);
                this.updateStats(analyzed);
                
                processed++;
                
                if (processed % 10 === 0) {
                    console.log(`📈 Прогресс: ${processed}/${rawData.length} (${Math.round(processed/rawData.length*100)}%)`);
                    this.printCurrentStats();
                }
                
                // Небольшая пауза между запросами
                await this.delay(1000);
                
            } catch (error) {
                console.log(`❌ Ошибка обработки ${clinic.name}: ${error.message}`);
                
                // Добавляем как есть с пометкой об ошибке
                this.results.push({
                    ...clinic,
                    analysis: 'error',
                    error: error.message
                });
            }
        }
        
        await this.analyzer.close();
        
        // Сохраняем результаты
        await this.saveResults();
        
        // Генерируем отчет
        this.generateReport();
    }

    updateStats(clinic) {
        this.stats.total++;
        
        if (clinic.hasWebsite) {
            this.stats.withWebsite++;
        }
        
        if (clinic.emails && clinic.emails.length > 0) {
            this.stats.withEmail++;
        }
        
        switch(clinic.potential) {
            case 'hot':
                this.stats.hot++;
                break;
            case 'warm':
                this.stats.warm++;
                break;
            default:
                this.stats.cold++;
        }
    }

    printCurrentStats() {
        console.log(`
📊 Текущая статистика:
   Всего: ${this.stats.total}
   С сайтами: ${this.stats.withWebsite}
   С email: ${this.stats.withEmail}
   🔥 Горячие лиды: ${this.stats.hot}
   🔶 Теплые лиды: ${this.stats.warm}
   ❄️ Холодные лиды: ${this.stats.cold}
        `);
    }

    async saveResults() {
        const timestamp = Date.now();
        
        // Основной файл с результатами
        const mainFile = `dental_leads_${timestamp}.json`;
        fs.writeFileSync(mainFile, JSON.stringify(this.results, null, 2));
        console.log(`💾 Полные результаты сохранены в: ${mainFile}`);
        
        // Горячие лиды отдельно (готовые для КП)
        const hotLeads = this.results.filter(lead => lead.potential === 'hot');
        const hotLeadsFile = `hot_leads_${timestamp}.json`;
        fs.writeFileSync(hotLeadsFile, JSON.stringify(hotLeads, null, 2));
        console.log(`🔥 Горячие лиды (${hotLeads.length}) сохранены в: ${hotLeadsFile}`);
        
        // CSV для удобства
        await this.saveAsCSV(timestamp);
    }

    async saveAsCSV(timestamp) {
        const csvHeader = [
            'Название',
            'Адрес', 
            'Телефон',
            'Сайт',
            'Email',
            'Рейтинг',
            'Отзывов',
            'Есть Яндекс виджет',
            'Есть 2ГИС виджет', 
            'Другие виджеты',
            'Потенциал',
            'Статус анализа'
        ].join(',');
        
        const csvRows = this.results.map(lead => [
            `"${lead.name || ''}"`,
            `"${lead.address || ''}"`,
            `"${lead.phone || ''}"`,
            `"${lead.website || ''}"`,
            `"${(lead.emails || []).join('; ')}"`,
            lead.rating || '',
            lead.reviewCount || '',
            lead.hasYandexWidget ? 'Да' : 'Нет',
            lead.has2gisWidget ? 'Да' : 'Нет',
            `"${(lead.otherWidgets || []).join(', ')}"`,
            lead.potential || '',
            lead.analysis || ''
        ].join(','));
        
        const csvContent = [csvHeader, ...csvRows].join('\\n');
        const csvFile = `dental_leads_${timestamp}.csv`;
        fs.writeFileSync(csvFile, csvContent);
        console.log(`📈 CSV файл сохранен: ${csvFile}`);
    }

    generateReport() {
        console.log(`
🎯 ИТОГОВЫЙ ОТЧЕТ - Лидогенерация для GeoReview
=================================================

📊 Общая статистика:
   • Всего стоматологий: ${this.stats.total}
   • С сайтами: ${this.stats.withWebsite} (${Math.round(this.stats.withWebsite/this.stats.total*100)}%)
   • С email: ${this.stats.withEmail} (${Math.round(this.stats.withEmail/this.stats.total*100)}%)

🎯 Потенциал для GeoReview:
   🔥 Горячие лиды: ${this.stats.hot} (готовы для КП)
      - Нет виджетов отзывов + есть контакты
   
   🔶 Теплые лиды: ${this.stats.warm} (требуют проработки)  
      - Есть старые виджеты + есть контакты
   
   ❄️ Холодные лиды: ${this.stats.cold}
      - Нет контактов или уже есть современные виджеты

💰 Бизнес потенциал:
   • Готовых лидов для отправки КП: ${this.stats.hot}
   • Конверсия 10-15% = ${Math.round(this.stats.hot * 0.125)} потенциальных клиентов
   • Средний чек GeoReview: ~15,000₽/год
   • Потенциальная выручка: ${Math.round(this.stats.hot * 0.125 * 15000).toLocaleString()}₽

🚀 Рекомендации:
   1. Начать с горячих лидов - отправить КП
   2. Для теплых лидов - предложить модернизацию виджетов
   3. Холодные лиды - в базу для будущих кампаний
        `);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Функция для запуска
async function runLeadGeneration() {
    const generator = new DentalLeadGenerator();
    
    // Ищем последний файл с данными парсера
    const files = fs.readdirSync('.').filter(f => f.startsWith('dental_moscow_') && f.endsWith('.json'));
    
    if (files.length === 0) {
        console.log('❌ Не найден файл с данными парсера. Сначала запустите dental_scraper.js');
        process.exit(1);
    }
    
    const latestFile = files.sort().pop();
    console.log(`📂 Используем файл: ${latestFile}`);
    
    try {
        await generator.processLeads(latestFile);
        console.log('🎉 Анализ завершен!');
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
        process.exit(1);
    }
}

// Запуск при прямом вызове
if (require.main === module) {
    runLeadGeneration();
}

module.exports = DentalLeadGenerator;