const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeGoogleMapsStomatology() {
    console.log('🦷 Парсинг стоматологий через Google Maps');
    
    const browser = await chromium.launch({ 
        headless: false,  // Видимый для отладки
        slowMo: 1000,
        args: ['--disable-web-security']
    });
    
    const page = await browser.newPage();
    
    try {
        // Переходим на Google Maps с поиском стоматологий в Москве
        console.log('🌍 Загружаем Google Maps...');
        await page.goto('https://www.google.com/maps/search/стоматология+москва/', { 
            timeout: 60000,
            waitUntil: 'networkidle' 
        });
        
        // Ждем загрузки результатов
        await page.waitForTimeout(5000);
        
        const dentalData = [];
        let processedCount = 0;
        const maxResults = 100;
        
        console.log('📊 Начинаем сбор данных...');
        
        // Ждем появления результатов
        await page.waitForSelector('[data-value="Directions"], .hfpxzc', { timeout: 30000 });
        
        let scrollAttempts = 0;
        const maxScrollAttempts = 20;
        
        while (processedCount < maxResults && scrollAttempts < maxScrollAttempts) {
            console.log(`📍 Попытка ${scrollAttempts + 1}/${maxScrollAttempts}, обработано: ${processedCount}`);
            
            // Находим все карточки организаций
            const cards = await page.$$('[data-value="Directions"]');
            console.log(`🔍 Найдено карточек на странице: ${cards.length}`);
            
            // Обрабатываем новые карточки
            for (let i = processedCount; i < Math.min(cards.length, maxResults); i++) {
                try {
                    const card = cards[i];
                    
                    // Прокручиваем к элементу
                    await card.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(500);
                    
                    // Извлекаем название
                    let name = null;
                    try {
                        // Ищем название в родительском элементе
                        const parentCard = await card.$('..');
                        name = await parentCard.$eval('.qBF1Pd.fontHeadlineSmall, .qBF1Pd, [data-value="Directions"] ~ div', 
                            el => el.textContent.trim()).catch(() => null);
                        
                        if (!name) {
                            // Альтернативный поиск
                            name = await page.evaluate((cardElement) => {
                                // Ищем ближайший элемент с названием
                                const parent = cardElement.closest('[jsaction]') || cardElement.parentElement;
                                const titleEl = parent?.querySelector('.qBF1Pd') || 
                                               parent?.querySelector('[data-value="Directions"] ~ div') ||
                                               parent?.querySelector('.fontHeadlineSmall');
                                return titleEl?.textContent?.trim() || null;
                            }, card);
                        }
                    } catch (e) {
                        console.log(`⚠️ Не удалось получить название для карточки ${i}: ${e.message}`);
                    }
                    
                    if (!name || name.length < 3) {
                        console.log(`⚠️ Пропускаем карточку ${i} - некорректное название: "${name}"`);
                        continue;
                    }
                    
                    // Кликаем на карточку для получения подробной информации
                    await card.click();
                    await page.waitForTimeout(2000);
                    
                    // Извлекаем детальную информацию из боковой панели
                    let address = null;
                    let phone = null;
                    let website = null;
                    let rating = null;
                    let reviewCount = null;
                    
                    try {
                        // Адрес
                        address = await page.$eval('[data-item-id="address"] .rogA2c, .Io6YTe.fontBodyMedium', 
                            el => el.textContent.trim()).catch(() => null);
                        
                        // Телефон
                        const phoneElement = await page.$('[data-item-id="phone"] .rogA2c, [data-value*="+7"]');
                        if (phoneElement) {
                            phone = await phoneElement.textContent();
                            phone = phone.trim().replace(/[^+\d\s()-]/g, '');
                        }
                        
                        // Сайт
                        const websiteElement = await page.$('[data-item-id="authority"] a, [data-value="Website"] ~ a');
                        if (websiteElement) {
                            website = await websiteElement.getAttribute('href');
                            // Убираем Google-редиректы
                            if (website && website.includes('url?')) {
                                const urlMatch = website.match(/url=([^&]+)/);
                                if (urlMatch) {
                                    website = decodeURIComponent(urlMatch[1]);
                                }
                            }
                        }
                        
                        // Рейтинг и отзывы
                        const ratingText = await page.$eval('.MW4etd, .ceNzKf', 
                            el => el.textContent.trim()).catch(() => null);
                        if (ratingText) {
                            const ratingMatch = ratingText.match(/([\\d,]+)/);
                            if (ratingMatch) {
                                rating = parseFloat(ratingMatch[1].replace(',', '.'));
                            }
                        }
                        
                        const reviewText = await page.$eval('.UY7F9, .RDApEe.YrbPuc', 
                            el => el.textContent.trim()).catch(() => null);
                        if (reviewText) {
                            const reviewMatch = reviewText.match(/\\(([\d\\s]+)\\)/);
                            if (reviewMatch) {
                                reviewCount = parseInt(reviewMatch[1].replace(/\\s/g, ''));
                            }
                        }
                        
                    } catch (detailError) {
                        console.log(`⚠️ Ошибка получения деталей для ${name}: ${detailError.message}`);
                    }
                    
                    // Сохраняем результат
                    const clinic = {
                        name,
                        address,
                        phone,
                        website,
                        rating,
                        reviewCount,
                        source: 'google_maps',
                        parsedAt: new Date().toISOString()
                    };
                    
                    dentalData.push(clinic);
                    processedCount++;
                    
                    console.log(`✅ [${processedCount}] ${name}`);
                    console.log(`   📍 ${address || 'Адрес не указан'}`);
                    console.log(`   📞 ${phone || 'Телефон не найден'}`);
                    console.log(`   🌐 ${website || 'Сайт не найден'}`);
                    console.log(`   ⭐ ${rating || 'Без рейтинга'} (${reviewCount || 0} отзывов)`);
                    console.log('');
                    
                    // Закрываем детальную панель
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(1000);
                    
                    if (processedCount >= maxResults) break;
                    
                } catch (cardError) {
                    console.log(`❌ Ошибка обработки карточки ${i}: ${cardError.message}`);
                }
            }
            
            // Прокручиваем для загрузки новых результатов
            if (processedCount < maxResults) {
                console.log('⏬ Прокручиваем для загрузки новых результатов...');
                
                await page.evaluate(() => {
                    // Прокручиваем основной контейнер с результатами
                    const container = document.querySelector('[data-value="Directions"]')?.closest('[role="main"]') || 
                                     document.querySelector('.m6QErb.DxyBCb.kA9KIf.dS8AEf') ||
                                     document.querySelector('.TFQHme');
                    if (container) {
                        container.scrollTop += 1000;
                    } else {
                        window.scrollBy(0, 1000);
                    }
                });
                
                await page.waitForTimeout(3000);
                scrollAttempts++;
                
                // Проверяем появились ли новые результаты
                const newCards = await page.$$('[data-value="Directions"]');
                if (newCards.length <= cards.length) {
                    console.log('🔚 Новые результаты не появились, завершаем...');
                    break;
                }
            }
        }
        
        // Сохраняем данные
        const filename = `dental_google_${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(dentalData, null, 2));
        
        console.log(`
🎉 Парсинг Google Maps завершен!
📊 Всего собрано: ${dentalData.length} стоматологий  
🌐 С сайтами: ${dentalData.filter(d => d.website).length}
📞 С телефонами: ${dentalData.filter(d => d.phone).length}
⭐ С рейтингом: ${dentalData.filter(d => d.rating).length}
💾 Файл: ${filename}
        `);
        
        return dentalData;
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        await page.screenshot({ path: 'google_maps_error.png' });
        throw error;
    } finally {
        console.log('⏳ Браузер останется открытым 10 секунд для проверки...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

// Запуск
if (require.main === module) {
    scrapeGoogleMapsStomatology()
        .then(data => {
            console.log('🚀 Готово! Теперь можно запустить анализ лидов');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Ошибка:', error);
            process.exit(1);
        });
}