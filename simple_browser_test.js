const { chromium } = require('playwright');

async function testBrowser() {
    console.log('🌐 Простой тест браузера');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 2000,
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    const page = await browser.newPage();
    
    try {
        // Тест 1: Простая страница
        console.log('1️⃣ Тестируем простую загрузку...');
        await page.goto('https://httpbin.org/get');
        console.log('✅ Простая страница загрузилась');
        
        // Тест 2: Google поиск (проще чем Яндекс)
        console.log('2️⃣ Тестируем Google Maps...');
        await page.goto('https://www.google.com/maps/search/стоматология+москва/', { 
            timeout: 30000,
            waitUntil: 'load' 
        });
        console.log('✅ Google Maps загрузился');
        
        await page.waitForTimeout(5000);
        
        // Проверяем результаты в Google Maps
        const results = await page.$$('[data-value="Directions"], .hfpxzc');
        console.log(`📊 Найдено элементов в Google Maps: ${results.length}`);
        
        if (results.length > 0) {
            console.log('🎉 Google Maps работает! Можно использовать как альтернативу');
            
            // Пробуем извлечь первый результат
            try {
                const firstResult = results[0];
                const name = await firstResult.$eval('[data-value="Directions"] ~ div, .qBF1Pd', 
                    el => el.textContent.trim()).catch(() => 'Название не найдено');
                console.log(`✅ Первый результат: ${name}`);
            } catch (e) {
                console.log('❌ Не удалось извлечь данные из первого результата');
            }
        }
        
        console.log('⏳ Держим браузер открытым для визуального анализа...');
        await page.waitForTimeout(15000);
        
    } catch (error) {
        console.error('❌ Ошибка теста:', error);
        await page.screenshot({ path: 'browser_test_error.png' });
    } finally {
        await browser.close();
    }
}

testBrowser();