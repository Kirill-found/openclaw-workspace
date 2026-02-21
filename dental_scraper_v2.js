const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeDentalClinics() {
    console.log('🦷 Версия 2.0 - Парсинг стоматологий Москвы...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🌐 Переходим на Яндекс.Карты...');
        await page.goto('https://yandex.ru/maps/213/moscow/', { waitUntil: 'networkidle' });
        
        // Ждем загрузки страницы
        await page.waitForTimeout(3000);
        
        // Вводим поисковый запрос
        console.log('🔍 Ищем стоматологии...');
        const searchInput = await page.waitForSelector('input.search-form-input__input', { timeout: 10000 });
        await searchInput.fill('стоматология москва');
        await page.keyboard.press('Enter');
        
        // Ждем результатов поиска
        await page.waitForSelector('.search-snippet-view', { timeout: 30000 });
        await page.waitForTimeout(5000);
        
        const dentalData = [];
        let processedItems = 0;
        const maxItems = 50; // Уменьшаем для надежности
        let noNewResultsCount = 0;
        
        console.log('📊 Начинаем сбор данных...');
        
        while (processedItems < maxItems && noNewResultsCount < 3) {
            const snippets = await page.$$('.search-snippet-view');
            console.log(`📍 Найдено элементов на странице: ${snippets.length}`);
            
            if (snippets.length <= processedItems) {
                console.log('⏳ Пробуем прокрутить для загрузки новых результатов...');
                
                // Прокручиваем страницу
                await page.evaluate(() => {
                    const container = document.querySelector('.sidebar__content') || 
                                     document.querySelector('.scroll__container') ||
                                     document.querySelector('.search-list-view');
                    if (container) {
                        container.scrollTop += 1000;
                    } else {
                        window.scrollBy(0, 1000);
                    }
                });
                
                await page.waitForTimeout(3000);
                noNewResultsCount++;
                continue;
            }
            
            // Обрабатываем новые элементы
            for (let i = processedItems; i < Math.min(snippets.length, maxItems); i++) {
                try {
                    const snippet = snippets[i];
                    
                    // Извлекаем название
                    let name = null;
                    try {
                        name = await snippet.$eval('.search-business-snippet-view__title, .search-snippet-view__title', 
                            el => el.textContent.trim());
                    } catch (e) {
                        console.log(`⚠️ Не удалось извлечь название для элемента ${i}`);
                        continue;
                    }
                    
                    // Извлекаем адрес
                    let address = null;
                    try {
                        address = await snippet.$eval('.search-business-snippet-view__address, .search-snippet-view__address', 
                            el => el.textContent.trim());
                    } catch (e) {
                        // Адрес не критичен
                    }
                    
                    // Извлекаем рейтинг и отзывы
                    let rating = null;
                    let reviewCount = null;
                    try {
                        const ratingText = await snippet.$eval('.business-summary-rating-view__text', 
                            el => el.textContent.trim());
                        rating = parseFloat(ratingText);
                        
                        const reviewText = await snippet.$eval('.business-summary-rating-view__count',
                            el => el.textContent.trim());
                        reviewCount = parseInt(reviewText.replace(/[^\\d]/g, ''));
                    } catch (e) {
                        // Рейтинг не критичен
                    }
                    
                    // Пытаемся найти телефон
                    let phone = null;
                    try {
                        const phoneLink = await snippet.$('[href^=\"tel:\"]');
                        if (phoneLink) {
                            phone = await phoneLink.getAttribute('href');
                            phone = phone.replace('tel:', '').trim();
                        }
                    } catch (e) {
                        // Телефон не всегда есть
                    }
                    
                    // Ищем сайт - более аккуратный подход
                    let website = null;
                    try {
                        // Кликаем на элемент для открытия деталей
                        await page.evaluate(el => el.scrollIntoView(), snippet);
                        await snippet.click({ force: true });
                        await page.waitForTimeout(2000);
                        
                        // Ищем сайт в боковой панели
                        try {
                            const websiteElement = await page.$('.business-contacts-view__website a, .business-url-view a, [data-type=\"url\"] a');
                            if (websiteElement) {
                                website = await websiteElement.getAttribute('href');
                                // Проверяем, что это не внутренняя ссылка Яндекса
                                if (website && !website.includes('yandex') && !website.includes('yastatic')) {
                                    console.log(`🌐 Найден сайт: ${website}`);
                                }
                            }
                        } catch (e) {
                            // Сайт не найден
                        }
                        
                        // Также пытаемся найти дополнительные телефоны
                        try {
                            const phoneElements = await page.$$('.business-contacts-view__phone a[href^=\"tel:\"]');
                            if (phoneElements.length > 0 && !phone) {
                                phone = await phoneElements[0].getAttribute('href');
                                phone = phone.replace('tel:', '').trim();
                            }
                        } catch (e) {
                            // Дополнительные телефоны не найдены
                        }
                        
                        // Закрываем боковую панель
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(1000);
                        
                    } catch (clickError) {
                        console.log(`⚠️ Не удалось получить детали для ${name}: ${clickError.message}`);
                    }
                    
                    if (name) {
                        const clinic = {
                            name,
                            address,
                            phone,
                            website: website || null,
                            rating,
                            reviewCount,
                            source: 'yandex_maps_v2',
                            parsedAt: new Date().toISOString()
                        };
                        
                        dentalData.push(clinic);
                        console.log(`✅ [${i+1}] ${name}`);
                        console.log(`   📍 ${address || 'Адрес не указан'}`);
                        console.log(`   📞 ${phone || 'Телефон не найден'}`);
                        console.log(`   🌐 ${website || 'Сайт не найден'}`);
                        console.log(`   ⭐ ${rating || 'Без рейтинга'} (${reviewCount || 0} отзывов)`);
                        console.log('');
                    }
                    
                    processedItems++;
                    if (processedItems >= maxItems) break;
                    
                    // Пауза между обработкой элементов
                    await page.waitForTimeout(500);
                    
                } catch (error) {
                    console.log(`❌ Ошибка при обработке элемента ${i}: ${error.message}`);
                    processedItems++;
                }
            }
            
            noNewResultsCount = 0; // Сбрасываем счетчик, если нашли новые результаты
        }
        
        // Сохраняем результаты
        const filename = `dental_moscow_v2_${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(dentalData, null, 2));
        
        console.log(`
🎉 Парсинг завершен!
📊 Всего собрано: ${dentalData.length} стоматологий
🌐 С сайтами: ${dentalData.filter(d => d.website).length}
📞 С телефонами: ${dentalData.filter(d => d.phone).length}
⭐ С рейтингом: ${dentalData.filter(d => d.rating).length}
💾 Файл: ${filename}
        `);
        
        return dentalData;
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Запускаем
if (require.main === module) {
    scrapeDentalClinics()
        .then(data => {
            console.log('✅ Готово к анализу лидов!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Ошибка:', error);
            process.exit(1);
        });
}