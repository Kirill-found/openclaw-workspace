const { chromium } = require('playwright');

async function debugParsing() {
    console.log('🔍 ОТЛАДКА: Диагностика парсинга Яндекс.Карт');
    
    const browser = await chromium.launch({ 
        headless: false,  // Показываем браузер для отладки
        slowMo: 1000 
    });
    
    const page = await browser.newPage();
    
    try {
        // Шаг 1: Базовый переход на Яндекс.Карты
        console.log('1️⃣ Пробуем базовый переход на Яндекс.Карты...');
        await page.goto('https://yandex.ru/maps/', { 
            waitUntil: 'load',
            timeout: 60000 
        });
        
        console.log('✅ Страница загрузилась');
        await page.waitForTimeout(3000);
        
        // Шаг 2: Проверяем элементы поиска
        console.log('2️⃣ Ищем поле поиска...');
        
        const searchSelectors = [
            'input[placeholder*="поиск"]',
            'input.search-form-input__input',
            '.search-form input',
            '[data-test-id="search-input"]',
            'input[type="search"]'
        ];
        
        let searchInput = null;
        for (const selector of searchSelectors) {
            try {
                searchInput = await page.waitForSelector(selector, { timeout: 5000 });
                console.log(`✅ Найдено поле поиска: ${selector}`);
                break;
            } catch (e) {
                console.log(`❌ Селектор не найден: ${selector}`);
            }
        }
        
        if (!searchInput) {
            throw new Error('Поле поиска не найдено');
        }
        
        // Шаг 3: Вводим поисковый запрос
        console.log('3️⃣ Вводим "стоматология москва"...');
        await searchInput.fill('стоматология москва');
        await page.keyboard.press('Enter');
        
        // Шаг 4: Ждем результаты
        console.log('4️⃣ Ждем результаты поиска...');
        
        const resultSelectors = [
            '.search-snippet-view',
            '.search-business-snippet-view',
            '.search-result-item',
            '[data-test-id="search-result"]'
        ];
        
        let resultsFound = false;
        for (const selector of resultSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                const count = await page.$$eval(selector, els => els.length);
                console.log(`✅ Найдено ${count} результатов с селектором: ${selector}`);
                resultsFound = true;
                break;
            } catch (e) {
                console.log(`❌ Результаты не найдены: ${selector}`);
            }
        }
        
        if (!resultsFound) {
            // Скриншот для диагностики
            await page.screenshot({ path: 'debug_screenshot.png' });
            console.log('📸 Скриншот сохранен: debug_screenshot.png');
            throw new Error('Результаты поиска не найдены');
        }
        
        // Шаг 5: Пробуем извлечь первые 3 результата
        console.log('5️⃣ Пробуем извлечь данные...');
        
        const snippets = await page.$$('.search-snippet-view');
        console.log(`📊 Всего найдено элементов: ${snippets.length}`);
        
        for (let i = 0; i < Math.min(3, snippets.length); i++) {
            try {
                const snippet = snippets[i];
                
                // Пробуем разные селекторы для названия
                const titleSelectors = [
                    '.search-business-snippet-view__title',
                    '.search-snippet-view__title',
                    '.search-result__title',
                    '[data-test-id="title"]'
                ];
                
                let name = null;
                for (const selector of titleSelectors) {
                    try {
                        name = await snippet.$eval(selector, el => el.textContent.trim());
                        console.log(`✅ Название найдено (${selector}): ${name}`);
                        break;
                    } catch (e) {
                        console.log(`❌ Селектор названия не сработал: ${selector}`);
                    }
                }
                
                // Пробуем найти адрес
                const addressSelectors = [
                    '.search-business-snippet-view__address',
                    '.search-snippet-view__address',
                    '.search-result__address'
                ];
                
                let address = null;
                for (const selector of addressSelectors) {
                    try {
                        address = await snippet.$eval(selector, el => el.textContent.trim());
                        console.log(`✅ Адрес найден (${selector}): ${address}`);
                        break;
                    } catch (e) {
                        console.log(`❌ Селектор адреса не сработал: ${selector}`);
                    }
                }
                
                console.log(`📋 Результат ${i+1}:`);
                console.log(`   Название: ${name || 'НЕ НАЙДЕНО'}`);
                console.log(`   Адрес: ${address || 'НЕ НАЙДЕНО'}`);
                console.log('');
                
            } catch (error) {
                console.log(`❌ Ошибка обработки элемента ${i}: ${error.message}`);
            }
        }
        
        console.log('✅ Отладка завершена успешно');
        
    } catch (error) {
        console.error('❌ Ошибка отладки:', error);
        
        // Делаем скриншот для диагностики
        try {
            await page.screenshot({ path: 'error_screenshot.png' });
            console.log('📸 Скриншот ошибки сохранен: error_screenshot.png');
        } catch (e) {
            console.log('❌ Не удалось сделать скриншот');
        }
        
        throw error;
    } finally {
        // Оставляем браузер открытым на 10 секунд для визуального анализа
        console.log('⏳ Браузер останется открытым 10 секунд для анализа...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

// Запуск
debugParsing()
    .then(() => {
        console.log('🎉 Отладка завершена');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Критическая ошибка отладки:', error);
        process.exit(1);
    });