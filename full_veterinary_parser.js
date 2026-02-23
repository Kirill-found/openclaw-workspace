const fs = require('fs');

async function parseAllVeterinary() {
    console.log('🔍 ПОЛНЫЙ парсинг ВСЕХ ветклиник Новосибирска...');
    
    // Расширенный список ветклиник (из разных источников)
    const veterinaryData = [
        // Основные клиники
        { name: 'ВетДоктор', website: 'https://vetdoctor54.ru/' },
        { name: 'ВетаКлиник', website: 'https://www.vetaclinic.ru/' },
        { name: 'Ноев ковчег', website: 'http://kovcheg-nsk.ru/' },
        { name: 'Дарвин', website: 'https://darvin54.ru/' },
        { name: 'Ветлекарь', website: 'https://vet-lekar.ru/' },
        { name: 'Друг', website: 'http://drug-nsk.ru/' },
        { name: 'ИнТерра', website: 'https://vet-interra.ru/' },
        { name: 'Максивет', website: 'https://maxivet.su/' },
        { name: 'Пульс', website: 'https://vetklinika54.ru/' },
        { name: 'Энималз', website: 'https://animalz-nsk.ru/' },
        
        // Дополнительные клиники
        { name: 'Айболит', website: 'https://aibolit54.ru/' },
        { name: 'ВетМедЦентр', website: 'https://vetmed-nsk.ru/' },
        { name: 'Зооветсервис', website: 'https://zoovetservice.ru/' },
        { name: 'Доктор Айболит', website: 'https://dr-aibolit.nsk.ru/' },
        { name: 'Ветеринарная клиника №1', website: 'https://vetclinic1.ru/' },
        { name: 'Бэст', website: 'https://vetclinika.com/' },
        { name: 'Артемида+', website: 'http://sibvetclinic.ru/' },
        { name: 'Дай лапу', website: 'http://kotey88.wixsite.com/daylapu' },
        { name: 'Зоополис', website: 'https://vk.com/vet54' },
        { name: 'Айс', website: 'https://vk.com/aic.vetklinica' },
        { name: 'Ветнора', website: 'https://t.me/+79537728088' },
        
        // Специализированные центры
        { name: 'ВетМед', website: 'https://vetmed54.ru/' },
        { name: 'Зооцентр', website: 'https://zoocenter-nsk.ru/' },
        { name: 'ВетЛайф', website: 'https://vetlife54.ru/' },
        { name: 'Четыре лапы', website: 'https://4lapy-nsk.ru/' },
        { name: 'ЗооДоктор', website: 'https://zoodoctor-nsk.ru/' },
        { name: 'ВетПомощь', website: 'https://vethelp54.ru/' },
        { name: 'АнималЦентр', website: 'https://animalcenter-nsk.ru/' },
        { name: 'ВетАльянс', website: 'https://vetalliance54.ru/' },
        { name: 'ЗооВет+', website: 'https://zoovet-plus.ru/' },
        { name: 'Мурка и Барбос', website: 'https://murka-barbos.ru/' }
    ];
    
    console.log(`📊 Загружено: ${veterinaryData.length} ветклиник для анализа`);
    
    // Анализируем каждый сайт
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ 
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security'
        ]
    });
    
    const results = [];
    
    for (let i = 0; i < veterinaryData.length; i++) {
        const clinic = veterinaryData[i];
        console.log(`[${i+1}/${veterinaryData.length}] Анализируем: ${clinic.name}`);
        
        try {
            const analyzed = await analyzeSite(browser, clinic);
            results.push(analyzed);
            console.log(`✅ ${clinic.name}: emails=${analyzed.emails?.length || 0}, phones=${analyzed.phones?.length || 0}, potential=${analyzed.potential}`);
        } catch (error) {
            console.log(`❌ Ошибка ${clinic.name}: ${error.message}`);
            results.push({
                ...clinic,
                address: 'Новосибирск',
                emails: [],
                phones: [],
                messengers: [],
                potential: 'analysis_error',
                error: error.message
            });
        }
        
        // Пауза между анализами
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await browser.close();
    
    // Сохраняем результаты в CSV
    const timestamp = Date.now();
    const filename = `all_veterinary_novosibirsk_${timestamp}.csv`;
    
    const headers = [
        '№', 'Название', 'Адрес', 'Сайт', 'Email', 'Телефоны', 
        'Мессенджеры', 'Потенциал', 'Дата анализа'
    ];
    
    const rows = results.map((clinic, index) => [
        index + 1,
        `"${clinic.name}"`,
        `"${clinic.address || 'Новосибирск'}"`,
        `"${clinic.website}"`,
        `"${(clinic.emails || []).join('; ')}"`,
        `"${(clinic.phones || []).join('; ')}"`,
        `"${(clinic.messengers || []).map(m => `${m.type}: ${m.url}`).join('; ')}"`,
        clinic.potential || '',
        new Date().toLocaleDateString('ru-RU')
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    fs.writeFileSync(filename, csvContent);
    console.log(`💾 CSV результаты сохранены: ${filename}`);
    
    // Подготавливаем данные для Google Sheets
    const sheetsData = [headers, ...rows.map(row => row.map(cell => 
        typeof cell === 'string' ? cell.replace(/"/g, '') : cell
    ))];
    
    // Отчёт
    const withEmails = results.filter(r => r.emails && r.emails.length > 0).length;
    const withPhones = results.filter(r => r.phones && r.phones.length > 0).length;
    const hotLeads = results.filter(r => r.potential === 'hot').length;
    const warmLeads = results.filter(r => r.potential === 'warm').length;
    
    console.log(`
🎯 ОТЧЁТ ПОЛНОГО АНАЛИЗА ВЕТКЛИНИК НОВОСИБИРСКА
==============================================

📊 Общая статистика:
   • Всего ветклиник: ${results.length}
   • С email адресами: ${withEmails} (${Math.round(withEmails/results.length*100)}%)
   • С телефонами: ${withPhones} (${Math.round(withPhones/results.length*100)}%)
   • 🔥 Горячие лиды: ${hotLeads} (готовы для КП)
   • 🔶 Теплые лиды: ${warmLeads} (требуют проработки)

💰 Бизнес потенциал:
   • Готовых контактов: ${withEmails + withPhones}
   • Потенциальная выручка: ${(hotLeads * 15000).toLocaleString()}₽/год
   
📋 Готово для загрузки в Google Sheets!
    `);
    
    return { results, sheetsData, filename };
}

async function analyzeSite(browser, clinic) {
    const page = await browser.newPage();
    
    try {
        // Настройки страницы для обхода блокировок
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(clinic.website, { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });
        await page.waitForTimeout(3000);
        
        // Поиск контактов
        const pageText = await page.textContent('body');
        
        // Email адреса
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = [...new Set((pageText.match(emailRegex) || [])
            .filter(email => 
                !email.includes('example') && 
                !email.includes('test') &&
                !email.includes('noreply')
            ))];
        
        // Телефоны
        const phoneRegex = /(?:\+7|8)[\s\-\(\)]?(?:\d{3})[\s\-\(\)]?(?:\d{3})[\s\-\(\)]?(?:\d{2})[\s\-\(\)]?(?:\d{2})/g;
        const phones = [...new Set((pageText.match(phoneRegex) || [])
            .map(phone => phone.replace(/[\s\-\(\)]/g, '')))];
        
        // Мессенджеры
        const messengers = [];
        const messengerPatterns = {
            whatsapp: ['whatsapp', 'wa.me'],
            telegram: ['telegram', 't.me', 'tg://'],
            viber: ['viber'],
            vk: ['vk.com']
        };
        
        for (const [type, patterns] of Object.entries(messengerPatterns)) {
            for (const pattern of patterns) {
                if (pageText.toLowerCase().includes(pattern)) {
                    const regex = new RegExp(`(https?://[^\\s]*${pattern}[^\\s]*)`, 'gi');
                    const matches = pageText.match(regex);
                    if (matches && matches.length > 0) {
                        messengers.push({
                            type: type,
                            url: matches[0]
                        });
                        break;
                    }
                }
            }
        }
        
        // Определение потенциала
        let potential = 'cold';
        if (emails.length > 0 || phones.length > 0) {
            potential = 'hot'; // Есть прямые контакты
        } else if (messengers.length > 0) {
            potential = 'warm'; // Есть мессенджеры
        }
        
        return {
            ...clinic,
            address: 'Новосибирск',
            emails,
            phones,
            messengers,
            potential,
            analyzedAt: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            ...clinic,
            address: 'Новосибирск',
            emails: [],
            phones: [],
            messengers: [],
            potential: 'analysis_error',
            error: error.message
        };
    } finally {
        await page.close();
    }
}

// Запуск
if (require.main === module) {
    parseAllVeterinary()
        .then((data) => {
            console.log(`✅ Анализ завершён! Данные готовы для Google Sheets.`);
            console.log(`📊 Всего: ${data.results.length} ветклиник`);
            console.log(`📁 CSV файл: ${data.filename}`);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error);
            process.exit(1);
        });
}

module.exports = { parseAllVeterinary };