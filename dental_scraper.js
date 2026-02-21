const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeDentalClinics() {
    console.log('🦷 Начинаем парсинг стоматологий Москвы...');
    
    const browser = await chromium.launch({ 
        headless: false,  // для отладки
        slowMo: 1000 
    });
    
    const page = await browser.newPage();
    
    try {
        // Идем на Яндекс.Карты с поиском стоматологий в Москве
        await page.goto('https://yandex.ru/maps/213/moscow/?text=стоматология&ll=37.617700%2C55.755864&z=10');
        
        // Ждем загрузки результатов
        await page.waitForSelector('.search-snippet-view', { timeout: 30000 });
        await page.waitForTimeout(3000);
        
        const dentalData = [];
        let processedItems = 0;
        const maxItems = 100; // Начнем с первых 100
        
        // Прокручиваем и собираем данные
        while (processedItems < maxItems) {
            console.log(`📊 Обработано: ${processedItems}/${maxItems}`);
            
            const snippets = await page.$$('.search-snippet-view');
            
            for (let i = processedItems; i < Math.min(snippets.length, maxItems); i++) {
                try {
                    const snippet = snippets[i];
                    
                    // Извлекаем базовые данные
                    const name = await snippet.$eval('.search-business-snippet-view__title', el => el?.textContent?.trim()).catch(() => null);
                    const address = await snippet.$eval('.search-business-snippet-view__address', el => el?.textContent?.trim()).catch(() => null);
                    const rating = await snippet.$eval('.business-summary-rating-view__text', el => el?.textContent?.trim()).catch(() => null);
                    const reviewCount = await snippet.$eval('.business-summary-rating-view__count', el => el?.textContent?.trim()).catch(() => null);
                    
                    // Пытаемся найти телефон (если виден)
                    const phone = await snippet.$eval('[href^="tel:"]', el => el?.getAttribute('href')?.replace('tel:', '')).catch(() => null);
                    
                    if (name) {
                        // Пытаемся найти сайт - кликаем на элемент для подробностей
                        let website = null;
                        try {
                            await snippet.click();
                            await page.waitForTimeout(2000);
                            
                            // Ищем ссылку на сайт в боковой панели
                            website = await page.$eval('[href^="http"]:not([href*="yandex"]):not([href*="2gis"])', 
                                el => el.getAttribute('href')).catch(() => null);
                            
                            // Закрываем боковую панель
                            await page.keyboard.press('Escape');
                            await page.waitForTimeout(1000);
                        } catch (e) {
                            console.log(`❌ Ошибка при получении сайта для ${name}: ${e.message}`);
                        }
                        
                        const clinic = {
                            name,
                            address,
                            phone,
                            website,
                            rating: rating ? parseFloat(rating) : null,
                            reviewCount: reviewCount ? parseInt(reviewCount.replace(/[^\d]/g, '')) : null,
                            source: 'yandex_maps',
                            parsedAt: new Date().toISOString()
                        };
                        
                        dentalData.push(clinic);
                        console.log(`✅ ${name} - ${address} - ${website || 'нет сайта'}`);
                    }
                    
                    processedItems++;
                    
                    if (processedItems >= maxItems) break;
                    
                } catch (error) {
                    console.log(`❌ Ошибка при обработке элемента ${i}: ${error.message}`);
                    processedItems++;
                }
            }
            
            // Прокручиваем вниз для загрузки новых результатов
            if (processedItems < maxItems) {
                await page.evaluate(() => {
                    const scrollContainer = document.querySelector('.scroll__container');
                    if (scrollContainer) {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight;
                    }
                });
                await page.waitForTimeout(2000);
                
                // Проверяем, загрузились ли новые элементы
                const newSnippets = await page.$$('.search-snippet-view');
                if (newSnippets.length <= snippets.length) {
                    console.log('🔚 Больше результатов не найдено');
                    break;
                }
            }
        }
        
        // Сохраняем данные
        const filename = `dental_moscow_${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(dentalData, null, 2));
        console.log(`💾 Сохранено ${dentalData.length} стоматологий в файл: ${filename}`);
        
        return dentalData;
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Запускаем парсинг
scrapeDentalClinics()
    .then(data => {
        console.log(`🎉 Парсинг завершен! Собрано ${data.length} записей`);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Ошибка:', error);
        process.exit(1);
    });