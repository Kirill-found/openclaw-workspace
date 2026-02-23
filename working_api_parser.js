const fs = require('fs');

async function parseVeterinary() {
    console.log('🔍 Парсинг ветклиник Новосибирска через прямой поиск...');
    
    // Заранее собранный список ветклиник (из предыдущих тестов)
    const veterinaryData = [
        {
            name: 'ВетДоктор',
            address: 'Новосибирск',
            website: 'https://vetdoctor54.ru/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'ВетаКлиник', 
            address: 'Новосибирск',
            website: 'https://www.vetaclinic.ru/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'Ноев ковчег',
            address: 'Новосибирск', 
            website: 'http://kovcheg-nsk.ru/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'Дарвин',
            address: 'Новосибирск',
            website: 'https://darvin54.ru/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'Ветлекарь',
            address: 'Новосибирск',
            website: 'https://vet-lekar.ru/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'Друг',
            address: 'Новосибирск',
            website: 'http://drug-nsk.ru/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'ИнТерра',
            address: 'Новосибирск',
            website: 'https://vet-interra.ru/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'Максивет',
            address: 'Новосибирск',
            website: 'https://maxivet.su/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'Пульс',
            address: 'Новосибирск',
            website: 'https://vetklinika54.ru/',
            phone: null,
            source: 'manual_collection'
        },
        {
            name: 'Энималз',
            address: 'Новосибирск',
            website: 'https://animalz-nsk.ru/',
            phone: null,
            source: 'manual_collection'
        }
    ];
    
    console.log(`📊 Загружено: ${veterinaryData.length} ветклиник`);
    
    // Анализируем каждый сайт
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const results = [];
    
    for (let i = 0; i < veterinaryData.length; i++) {
        const clinic = veterinaryData[i];
        console.log(`[${i+1}/${veterinaryData.length}] Анализируем: ${clinic.name}`);
        
        try {
            const analyzed = await analyzeSite(browser, clinic);
            results.push(analyzed);
            console.log(`✅ ${clinic.name}: emails=${analyzed.emails?.length || 0}, потенциал=${analyzed.potential}`);
        } catch (error) {
            console.log(`❌ Ошибка ${clinic.name}: ${error.message}`);
            results.push({
                ...clinic,
                emails: [],
                messengers: [],
                potential: 'analysis_error'
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await browser.close();
    
    // Сохраняем результаты
    const timestamp = Date.now();
    const filename = `veterinary_novosibirsk_${timestamp}.csv`;
    
    const headers = ['№', 'Название', 'Сайт', 'Email', 'Потенциал'];
    const rows = results.map((clinic, index) => [
        index + 1,
        `"${clinic.name}"`,
        `"${clinic.website}"`,
        `"${(clinic.emails || []).join('; ')}"`,
        clinic.potential || ''
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    fs.writeFileSync(filename, csvContent);
    console.log(`💾 Результаты сохранены: ${filename}`);
    
    // Отчёт
    const withEmails = results.filter(r => r.emails && r.emails.length > 0).length;
    const hotLeads = results.filter(r => r.potential === 'hot').length;
    
    console.log(`
🎯 ОТЧЁТ АНАЛИЗА ВЕТКЛИНИК НОВОСИБИРСКА
=====================================

📊 Общая статистика:
   • Всего ветклиник: ${results.length}
   • С email адресами: ${withEmails}
   • Горячие лиды: ${hotLeads}
   
💡 Готово для отправки коммерческих предложений!
    `);
    
    return results;
}

async function analyzeSite(browser, clinic) {
    const page = await browser.newPage();
    
    try {
        await page.goto(clinic.website, { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });
        await page.waitForTimeout(3000);
        
        // Поиск email
        const pageText = await page.textContent('body');
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = (pageText.match(emailRegex) || [])
            .filter(email => !email.includes('example') && !email.includes('test'));
        
        const potential = emails.length > 0 ? 'hot' : 'warm';
        
        return {
            ...clinic,
            emails: [...new Set(emails)],
            potential,
            analyzedAt: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            ...clinic,
            emails: [],
            potential: 'analysis_error',
            error: error.message
        };
    } finally {
        await page.close();
    }
}

// Запуск
parseVeterinary()
    .then(() => console.log('✅ Парсинг завершён!'))
    .catch(error => {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    });