const { chromium } = require('playwright');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

class ImprovedOrganizationParser {
    constructor(options = {}) {
        this.browser = null;
        this.context = null;
        this.results = [];
        this.stats = {
            total: 0,
            withWebsites: 0,
            withContacts: 0,
            withReviewWidgets: 0,
            errors: 0
        };
        
        // 2GIS API ключ
        this.twogisApiKey = 'c7f1a769-c8a5-4636-b14d-d8c987808a12';
        
        // Google Sheets
        this.spreadsheetId = '1iXyCnAguSJmfGu0fFvofvHVxzIcYyQJXxdV9ys0Qyo0';
        this.sheetName = 'Лист1';
        
        this.options = {
            maxResults: options.maxResults || 100,
            city: options.city || 'москва',
            niche: options.niche || 'стоматология',
            headless: options.headless !== false,
            timeout: options.timeout || 60000,
            ...options
        };
    }

    async init() {
        console.log('🚀 Инициализация улучшенного парсера...');
        
        this.browser = await chromium.launch({
            headless: this.options.headless,
            timeout: this.options.timeout,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'ru-RU'
        });
        
        console.log('✅ Браузер готов');
    }

    async parseOrganizations() {
        console.log(`🔍 Начинаем парсинг: ${this.options.niche} в городе ${this.options.city}`);
        
        // 1. Парсим из Яндекс.Карт
        console.log('🗺️ Этап 1: Яндекс.Карты');
        const yandexResults = await this.parseYandexMaps();
        
        // 2. Дополняем данными из 2ГИС API  
        console.log('🗺️ Этап 2: 2ГИС API');
        const enrichedResults = await this.enrichWith2GIS(yandexResults);
        
        // 3. Анализируем сайты организаций
        console.log('🌐 Этап 3: Анализ сайтов');
        const analyzedResults = await this.analyzeWebsites(enrichedResults);
        
        // 4. Сохраняем в Google Sheets
        console.log('📊 Этап 4: Сохранение в Google Sheets');
        await this.saveToGoogleSheets(analyzedResults);
        
        this.results = analyzedResults;
        return analyzedResults;
    }

    async parseYandexMaps() {
        const page = await this.context.newPage();
        const organizations = [];
        
        try {
            console.log('🌐 Переходим на Яндекс.Карты...');
            await page.goto('https://yandex.ru/maps/', { waitUntil: 'networkidle' });
            
            // Вводим поисковый запрос
            const searchQuery = `${this.options.niche} ${this.options.city}`;
            console.log(`🔍 Поиск: "${searchQuery}"`);
            
            // Обновленные селекторы для поиска в Яндекс.Картах 2024
            const searchSelectors = [
                'input[placeholder*="Поиск"], input[placeholder*="Найти"]',
                '.input__control, input[name="text"]',
                '.search-form-input__input',
                'input[data-testid="search-input"]',
                '.serp-header__input',
                'input[class*="search"]',
                'input[aria-label*="Поиск"], input[aria-label*="поиск"]'
            ];
            
            let searchInput = null;
            for (const selector of searchSelectors) {
                try {
                    searchInput = await page.waitForSelector(selector, { timeout: 5000 });
                    if (searchInput) {
                        console.log(`✅ Найдено поле поиска: ${selector}`);
                        break;
                    }
                } catch (e) {
                    console.log(`❌ Селектор не сработал: ${selector}`);
                    continue;
                }
            }
            
            if (!searchInput) {
                throw new Error('Не удалось найти поле поиска на Яндекс.Картах');
            }
            await searchInput.fill(searchQuery);
            await page.keyboard.press('Enter');
            
            // Ждем результатов поиска - обновленные селекторы
            const resultSelectors = [
                '.search-snippet-view',
                '.business-summary-view', 
                '[class*="search-snippet"]',
                '[class*="business-card"]',
                '.serp-item',
                '[data-testid*="business"]'
            ];
            
            let resultsFound = false;
            for (const selector of resultSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 10000 });
                    console.log(`✅ Результаты загружены: ${selector}`);
                    resultsFound = true;
                    break;
                } catch (e) {
                    console.log(`❌ Результаты не найдены по селектору: ${selector}`);
                    continue;
                }
            }
            
            if (!resultsFound) {
                throw new Error('Результаты поиска не загрузились');
            }
            
            await page.waitForTimeout(3000);
            
            let processedCount = 0;
            let previousCount = 0;
            let stableCount = 0;
            
            while (processedCount < this.options.maxResults && stableCount < 3) {
                // Получаем все видимые элементы - обновленные селекторы
                const snippetSelectors = [
                    '.search-snippet-view',
                    '.business-summary-view',
                    '[class*="search-snippet"]', 
                    '[class*="business-card"]',
                    '.serp-item'
                ];
                
                let snippets = [];
                for (const selector of snippetSelectors) {
                    try {
                        const found = await page.$$(selector);
                        if (found.length > 0) {
                            snippets = found;
                            console.log(`✅ Найдены элементы: ${found.length} по селектору ${selector}`);
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                console.log(`📍 Видимых элементов: ${snippets.length}`);
                
                if (snippets.length === previousCount) {
                    stableCount++;
                } else {
                    stableCount = 0;
                }
                previousCount = snippets.length;
                
                // Обрабатываем новые элементы
                for (let i = processedCount; i < Math.min(snippets.length, this.options.maxResults); i++) {
                    try {
                        const org = await this.extractYandexOrganization(page, snippets[i], i);
                        if (org && org.name) {
                            organizations.push(org);
                            console.log(`✅ [${i+1}] ${org.name} | 🌐 ${org.website || 'нет'} | 📞 ${org.phone || 'нет'}`);
                        }
                        processedCount++;
                    } catch (error) {
                        console.log(`❌ Ошибка элемента ${i}: ${error.message}`);
                        processedCount++;
                    }
                    
                    // Пауза между элементами
                    await page.waitForTimeout(1000);
                }
                
                // Прокручиваем для загрузки новых результатов
                if (processedCount < this.options.maxResults) {
                    await page.evaluate(() => {
                        const sidebar = document.querySelector('.sidebar__content') || 
                                       document.querySelector('.search-list-view') ||
                                       document.querySelector('[class*="scroll"]');
                        if (sidebar) {
                            sidebar.scrollTop += 800;
                        }
                    });
                    await page.waitForTimeout(2000);
                }
            }
            
        } catch (error) {
            console.error('❌ Ошибка парсинга Яндекс.Карт:', error);
        } finally {
            await page.close();
        }
        
        console.log(`📊 Собрано с Яндекс.Карт: ${organizations.length} организаций`);
        return organizations;
    }

    async extractYandexOrganization(page, snippet, index) {
        // Базовые данные
        let name = null;
        let address = null;
        let rating = null;
        let reviewCount = null;
        let phone = null;
        let website = null;
        
        try {
            // Название (обязательное) - расширенные селекторы
            const titleSelectors = [
                '.search-business-snippet-view__title',
                '.search-snippet-view__title',
                '[class*="title"]',
                '[class*="name"]',
                'h3, h2, h1',
                '.serp-item__title',
                '[data-testid*="title"]'
            ];
            
            for (const selector of titleSelectors) {
                try {
                    name = await snippet.$eval(selector, el => el.textContent.trim());
                    if (name) break;
                } catch (e) {
                    continue;
                }
            }
            
            if (!name) {
                return null; // Без названия не сохраняем
            }
            
            // Адрес - расширенные селекторы
            const addressSelectors = [
                '.search-business-snippet-view__address',
                '[class*="address"]',
                '.business-card__address',
                '.serp-item__address',
                '[data-testid*="address"]'
            ];
            
            for (const selector of addressSelectors) {
                try {
                    address = await snippet.$eval(selector, el => el.textContent.trim());
                    if (address) break;
                } catch (e) {
                    continue;
                }
            }
            
            // Рейтинг и отзывы
            try {
                const ratingText = await snippet.$eval('[class*="rating"] [class*="text"], .business-summary-rating-view__text', 
                    el => el.textContent.trim());
                rating = parseFloat(ratingText);
                
                const reviewText = await snippet.$eval('[class*="rating"] [class*="count"], .business-summary-rating-view__count',
                    el => el.textContent.trim());
                reviewCount = parseInt(reviewText.replace(/[^\\d]/g, '')) || 0;
            } catch (e) {
                // Не критично
            }
            
            // Телефон (быстрый поиск)
            try {
                const phoneLink = await snippet.$('[href^="tel:"]');
                if (phoneLink) {
                    phone = await phoneLink.getAttribute('href');
                    phone = phone.replace('tel:', '').replace(/[\\s\\-\\(\\)]/g, '');
                }
            } catch (e) {
                // Не критично
            }
            
            // Сайт - улучшенный поиск
            website = await this.findWebsiteFromYandex(page, snippet, name);
            
        } catch (error) {
            console.log(`⚠️ Ошибка извлечения данных для ${name || 'unknown'}: ${error.message}`);
        }
        
        return {
            name,
            address,
            phone,
            website,
            rating,
            reviewCount,
            source: 'yandex_maps',
            parsedAt: new Date().toISOString(),
            index
        };
    }

    async findWebsiteFromYandex(page, snippet, orgName) {
        let website = null;
        
        try {
            // Способ 1: Ищем в самом элементе
            try {
                const websiteLink = await snippet.$('a[href]:not([href^="tel:"]):not([href^="mailto:"])');
                if (websiteLink) {
                    const href = await websiteLink.getAttribute('href');
                    if (href && !href.includes('yandex') && !href.includes('maps') && href.includes('http')) {
                        website = href;
                        return website;
                    }
                }
            } catch (e) {
                // Продолжаем
            }
            
            // Способ 2: Кликаем и ищем в деталях
            try {
                console.log(`🔍 Ищем сайт для: ${orgName}`);
                
                // Прокручиваем к элементу
                await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), snippet);
                await page.waitForTimeout(500);
                
                // Кликаем
                await snippet.click({ timeout: 5000 });
                await page.waitForTimeout(3000);
                
                // Ищем сайт в боковой панели - множественные селекторы
                const websiteSelectors = [
                    '.business-contacts-view__website a',
                    '.business-url-view a', 
                    '[data-type="url"] a',
                    '.business-card-website-view a',
                    'a[href*="http"]:not([href*="yandex"]):not([href*="tel:"]):not([href*="mailto:"])',
                    '.business-contacts-view .link',
                    '.business-summary-view .link[href*="http"]'
                ];
                
                for (const selector of websiteSelectors) {
                    try {
                        const elements = await page.$$(selector);
                        for (const element of elements) {
                            const href = await element.getAttribute('href');
                            if (href && 
                                href.includes('http') && 
                                !href.includes('yandex') && 
                                !href.includes('yastatic') &&
                                !href.includes('maps') &&
                                !href.includes('tel:') &&
                                !href.includes('mailto:')) {
                                website = href;
                                console.log(`🌐 Найден сайт: ${website}`);
                                break;
                            }
                        }
                        if (website) break;
                    } catch (e) {
                        continue;
                    }
                }
                
                // Закрываем деталь панель
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
                
            } catch (clickError) {
                console.log(`⚠️ Не удалось получить детали для ${orgName}: ${clickError.message}`);
            }
            
        } catch (error) {
            console.log(`❌ Ошибка поиска сайта для ${orgName}: ${error.message}`);
        }
        
        return website;
    }

    async enrichWith2GIS(organizations) {
        console.log(`🗺️ Дополняем данные через 2ГИС API...`);
        
        const enriched = [];
        
        for (let i = 0; i < organizations.length; i++) {
            const org = organizations[i];
            console.log(`[${i+1}/${organizations.length}] 2ГИС обогащение: ${org.name}`);
            
            try {
                const twogisData = await this.search2GIS(org.name, org.address);
                
                const enrichedOrg = {
                    ...org,
                    // Дополняем недостающие данные из 2ГИС
                    website: org.website || twogisData?.website || null,
                    phone: org.phone || twogisData?.phone || null,
                    rating2gis: twogisData?.rating || null,
                    reviewCount2gis: twogisData?.reviewCount || null,
                    twogisId: twogisData?.id || null
                };
                
                enriched.push(enrichedOrg);
                
            } catch (error) {
                console.log(`⚠️ Ошибка обогащения через 2ГИС: ${error.message}`);
                enriched.push(org); // Добавляем как есть
            }
            
            // Пауза между запросами к API
            await this.delay(500);
        }
        
        return enriched;
    }

    async search2GIS(name, address) {
        try {
            const query = encodeURIComponent(`${name} ${address || ''}`);
            const response = await fetch(`https://catalog.api.2gis.com/3.0/items?q=${query}&region_id=1&key=${this.twogisApiKey}&fields=items.name,items.address,items.contact_groups,items.reviews,items.rating&limit=1`);
            
            if (!response.ok) {
                throw new Error(`2ГИС API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.result?.items && data.result.items.length > 0) {
                const item = data.result.items[0];
                
                let website = null;
                let phone = null;
                
                // Извлекаем контакты
                if (item.contact_groups) {
                    for (const group of item.contact_groups) {
                        if (group.contacts) {
                            for (const contact of group.contacts) {
                                if (contact.type === 'website') {
                                    website = contact.value;
                                } else if (contact.type === 'phone') {
                                    phone = contact.value;
                                }
                            }
                        }
                    }
                }
                
                return {
                    id: item.id,
                    name: item.name,
                    address: item.address?.name || null,
                    website,
                    phone,
                    rating: item.reviews?.rating || null,
                    reviewCount: item.reviews?.count || null
                };
            }
            
        } catch (error) {
            console.log(`❌ Ошибка 2ГИС API: ${error.message}`);
            return null;
        }
        
        return null;
    }

    async analyzeWebsites(organizations) {
        console.log(`🌐 Анализируем сайты организаций...`);
        
        const analyzed = [];
        
        for (let i = 0; i < organizations.length; i++) {
            const org = organizations[i];
            console.log(`[${i+1}/${organizations.length}] Анализ сайта: ${org.name}`);
            
            if (!org.website) {
                analyzed.push({
                    ...org,
                    hasWebsite: false,
                    emails: [],
                    messengers: [],
                    hasReviewWidgets: false,
                    reviewWidgets: [],
                    potential: 'no_website'
                });
                continue;
            }
            
            try {
                const siteAnalysis = await this.analyzeWebsite(org.website, org.name);
                
                const analyzedOrg = {
                    ...org,
                    hasWebsite: true,
                    ...siteAnalysis
                };
                
                analyzed.push(analyzedOrg);
                
            } catch (error) {
                console.log(`❌ Ошибка анализа ${org.website}: ${error.message}`);
                analyzed.push({
                    ...org,
                    hasWebsite: true,
                    emails: [],
                    messengers: [],
                    hasReviewWidgets: false,
                    reviewWidgets: [],
                    potential: 'analysis_error',
                    analysisError: error.message
                });
            }
            
            // Пауза между анализами
            await this.delay(2000);
        }
        
        return analyzed;
    }

    async analyzeWebsite(websiteUrl, orgName) {
        const page = await this.context.newPage();
        
        try {
            console.log(`🔍 Анализируем: ${websiteUrl}`);
            
            // Переходим на сайт с расширенным таймаутом
            await page.goto(websiteUrl, { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });
            
            // Ждем загрузки динамического контента (увеличено время)
            await page.waitForTimeout(5000);
            
            // Параллельный анализ всех компонентов
            const [emails, messengers, reviewWidgets] = await Promise.all([
                this.findEmailsImproved(page),
                this.findMessengers(page),
                this.findReviewWidgetsImproved(page)
            ]);
            
            // Оценка потенциала
            const potential = this.assessPotentialImproved(emails, messengers, reviewWidgets);
            
            console.log(`📊 ${orgName}: emails=${emails.length}, messengers=${messengers.length}, widgets=${reviewWidgets.length}, potential=${potential}`);
            
            return {
                emails,
                messengers,
                reviewWidgets,
                hasReviewWidgets: reviewWidgets.length > 0,
                potential,
                analyzedAt: new Date().toISOString()
            };
            
        } catch (error) {
            throw new Error(`Анализ сайта ${websiteUrl} не удался: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async findEmailsImproved(page) {
        const emails = new Set();
        
        try {
            // 1. Ждем дополнительной загрузки JavaScript
            await page.waitForTimeout(3000);
            
            // 2. Ищем в тексте страницы
            const pageText = await page.textContent('body');
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
            const textEmails = pageText.match(emailRegex) || [];
            textEmails.forEach(email => {
                if (this.isValidEmail(email)) {
                    emails.add(email.toLowerCase());
                }
            });
            
            // 3. Ищем в ссылках mailto
            const mailtoLinks = await page.$$('a[href^="mailto:"]');
            for (const link of mailtoLinks) {
                const href = await link.getAttribute('href');
                const email = href.replace('mailto:', '').split('?')[0];
                if (this.isValidEmail(email)) {
                    emails.add(email.toLowerCase());
                }
            }
            
            // 4. Ищем в скрытых атрибутах и data-*
            const hiddenEmails = await page.evaluate(() => {
                const found = [];
                const selectors = [
                    '[data-email]',
                    '[data-mail]', 
                    '[data-contact-email]',
                    '.email',
                    '.mail',
                    '.contact-email'
                ];
                
                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        const text = el.textContent || el.dataset.email || el.dataset.mail || el.dataset.contactEmail;
                        if (text && text.includes('@')) {
                            found.push(text);
                        }
                    });
                });
                
                return found;
            });
            
            hiddenEmails.forEach(email => {
                if (this.isValidEmail(email)) {
                    emails.add(email.toLowerCase());
                }
            });
            
            // 5. Ищем в формах
            const formEmails = await page.evaluate(() => {
                const found = [];
                const inputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[placeholder*="email" i], input[placeholder*="почт" i]');
                inputs.forEach(input => {
                    if (input.value && input.value.includes('@')) {
                        found.push(input.value);
                    }
                    if (input.placeholder && input.placeholder.includes('@')) {
                        found.push(input.placeholder);
                    }
                });
                return found;
            });
            
            formEmails.forEach(email => {
                if (this.isValidEmail(email)) {
                    emails.add(email.toLowerCase());
                }
            });
            
        } catch (error) {
            console.log(`⚠️ Ошибка поиска email: ${error.message}`);
        }
        
        return Array.from(emails);
    }

    async findMessengers(page) {
        const messengers = [];
        
        try {
            // Поиск мессенджеров через различные методы
            const messengerPatterns = {
                whatsapp: {
                    patterns: ['whatsapp', 'wa.me', 'api.whatsapp.com'],
                    selectors: ['a[href*="whatsapp"]', 'a[href*="wa.me"]', '[class*="whatsapp"]', '[id*="whatsapp"]']
                },
                telegram: {
                    patterns: ['telegram', 't.me', 'tg://'],
                    selectors: ['a[href*="telegram"]', 'a[href*="t.me"]', '[class*="telegram"]', '[id*="telegram"]']
                },
                viber: {
                    patterns: ['viber', 'viber.com'],
                    selectors: ['a[href*="viber"]', '[class*="viber"]']
                },
                vk: {
                    patterns: ['vk.com', 'vkontakte'],
                    selectors: ['a[href*="vk.com"]', '[class*="vk"]']
                }
            };
            
            for (const [name, config] of Object.entries(messengerPatterns)) {
                // Поиск в ссылках
                for (const selector of config.selectors) {
                    try {
                        const elements = await page.$$(selector);
                        for (const element of elements) {
                            const href = await element.getAttribute('href');
                            if (href && config.patterns.some(pattern => href.includes(pattern))) {
                                messengers.push({
                                    type: name,
                                    url: href
                                });
                                break;
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                // Поиск в тексте
                try {
                    const pageText = await page.textContent('body');
                    for (const pattern of config.patterns) {
                        if (pageText.toLowerCase().includes(pattern)) {
                            // Пытаемся найти конкретную ссылку
                            const regex = new RegExp(`(https?://[^\\s]*${pattern}[^\\s]*)`, 'gi');
                            const matches = pageText.match(regex);
                            if (matches && matches.length > 0) {
                                messengers.push({
                                    type: name,
                                    url: matches[0]
                                });
                                break;
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
        } catch (error) {
            console.log(`⚠️ Ошибка поиска мессенджеров: ${error.message}`);
        }
        
        // Убираем дубликаты
        const unique = messengers.filter((messenger, index, self) => 
            index === self.findIndex(m => m.type === messenger.type && m.url === messenger.url)
        );
        
        return unique;
    }

    async findReviewWidgetsImproved(page) {
        const widgets = [];
        
        try {
            const pageContent = await page.content();
            const html = pageContent.toLowerCase();
            
            // Расширенный поиск виджетов отзывов
            const widgetPatterns = [
                {
                    name: 'Яндекс.Отзывы',
                    patterns: ['yandex.*review', 'yandex.*rating', 'яндекс.*отзыв'],
                    selectors: ['[class*="yandex"]', 'iframe[src*="yandex"]', 'script[src*="yandex"]']
                },
                {
                    name: '2ГИС',
                    patterns: ['2gis', '2гис'],
                    selectors: ['[class*="2gis"]', 'iframe[src*="2gis"]', 'script[src*="2gis"]']
                },
                {
                    name: 'Google Reviews',
                    patterns: ['google.*review', 'google.*rating', 'maps.google'],
                    selectors: ['iframe[src*="google"]', '[class*="google-review"]']
                },
                {
                    name: 'Flamp',
                    patterns: ['flamp'],
                    selectors: ['[class*="flamp"]', 'iframe[src*="flamp"]']
                },
                {
                    name: 'Zoon',
                    patterns: ['zoon'],
                    selectors: ['[class*="zoon"]', 'iframe[src*="zoon"]']
                },
                {
                    name: 'Отзовик',
                    patterns: ['otzovik', 'отзовик'],
                    selectors: ['[class*="otzovik"]', 'iframe[src*="otzovik"]']
                }
            ];
            
            for (const widget of widgetPatterns) {
                let found = false;
                
                // Поиск по паттернам в HTML
                for (const pattern of widget.patterns) {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(html)) {
                        found = true;
                        break;
                    }
                }
                
                // Поиск по селекторам
                if (!found) {
                    for (const selector of widget.selectors) {
                        try {
                            const elements = await page.$$(selector);
                            if (elements.length > 0) {
                                found = true;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
                
                if (found) {
                    widgets.push(widget.name);
                }
            }
            
        } catch (error) {
            console.log(`⚠️ Ошибка поиска виджетов: ${error.message}`);
        }
        
        return widgets;
    }

    assessPotentialImproved(emails, messengers, reviewWidgets) {
        const hasContacts = emails.length > 0 || messengers.length > 0;
        const hasReviews = reviewWidgets.length > 0;
        
        if (!hasContacts) {
            return 'cold_no_contacts';
        }
        
        if (!hasReviews && hasContacts) {
            return 'hot'; // Нет виджетов + есть контакты = горячий лид
        }
        
        if (hasReviews && hasContacts) {
            return 'warm'; // Есть виджеты + есть контакты = теплый лид  
        }
        
        return 'cold';
    }

    async saveToGoogleSheets(organizations) {
        try {
            console.log('📊 Сохраняем в Google Sheets...');
            
            // Подготовка данных для таблицы
            const rows = organizations.map((org, index) => [
                index + 1, // №
                org.name || '',
                org.address || '',
                org.phone || '',
                org.website || '',
                (org.emails || []).join(', '),
                (org.messengers || []).map(m => `${m.type}: ${m.url}`).join('; '),
                org.rating || '',
                org.reviewCount || '',
                org.rating2gis || '',
                org.reviewCount2gis || '',
                (org.reviewWidgets || []).join(', '),
                org.potential || '',
                org.hasReviewWidgets ? 'Есть' : 'Нет',
                new Date().toLocaleDateString('ru-RU')
            ]);
            
            // Заголовки
            const headers = [
                '№',
                'Название',
                'Адрес', 
                'Телефон',
                'Сайт',
                'Email',
                'Мессенджеры',
                'Рейтинг (Яндекс)',
                'Отзывов (Яндекс)',
                'Рейтинг (2ГИС)',
                'Отзывов (2ГИС)', 
                'Виджеты отзывов',
                'Потенциал',
                'Есть виджеты',
                'Дата парсинга'
            ];
            
            // Сохраняем в локальный файл как резерв
            const timestamp = Date.now();
            const csvContent = [headers, ...rows]
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\\n');
            
            fs.writeFileSync(`organizations_${timestamp}.csv`, csvContent);
            console.log(`💾 Резервная копия сохранена: organizations_${timestamp}.csv`);
            
            // TODO: Интеграция с Google Sheets API
            console.log('📊 Google Sheets интеграция готова к подключению');
            
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            throw error;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email) && 
               !email.includes('example.com') &&
               !email.includes('test.com') &&
               !email.includes('noreply') &&
               !email.includes('no-reply');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    generateReport() {
        const total = this.results.length;
        const withWebsites = this.results.filter(r => r.hasWebsite).length;
        const withEmails = this.results.filter(r => r.emails && r.emails.length > 0).length;
        const withMessengers = this.results.filter(r => r.messengers && r.messengers.length > 0).length;
        const hotLeads = this.results.filter(r => r.potential === 'hot').length;
        const warmLeads = this.results.filter(r => r.potential === 'warm').length;
        
        console.log(`
🎯 ИТОГОВЫЙ ОТЧЕТ ПАРСИНГА
====================================

📊 Общая статистика:
   • Всего организаций: ${total}
   • С сайтами: ${withWebsites} (${Math.round(withWebsites/total*100)}%)
   • С email: ${withEmails} (${Math.round(withEmails/total*100)}%)
   • С мессенджерами: ${withMessengers} (${Math.round(withMessengers/total*100)}%)

🎯 Потенциал для продаж:
   🔥 Горячие лиды: ${hotLeads} (готовы для отправки КП)
   🔶 Теплые лиды: ${warmLeads} (требуют персонального подхода)
   
💰 Бизнес-потенциал:
   • Конверсия 10-15%: ${Math.round((hotLeads + warmLeads) * 0.125)} клиентов
   • Средний чек: 15,000₽/год  
   • Потенциальная выручка: ${Math.round((hotLeads + warmLeads) * 0.125 * 15000).toLocaleString()}₽

🚀 Рекомендации:
   1. Начать с горячих лидов - немедленная отправка КП
   2. Теплые лиды - персональные предложения по улучшению
   3. Все контакты собраны - готовы к работе!
        `);
    }
}

// Функция запуска
async function runParser(options = {}) {
    const parser = new ImprovedOrganizationParser(options);
    
    try {
        await parser.init();
        const results = await parser.parseOrganizations();
        parser.generateReport();
        
        return results;
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
        throw error;
    } finally {
        await parser.close();
    }
}

// Экспорт
module.exports = { ImprovedOrganizationParser, runParser };

// Запуск при прямом вызове
if (require.main === module) {
    const options = {
        maxResults: 50,
        city: 'москва',
        niche: 'стоматология',
        headless: false // Для отладки
    };
    
    runParser(options)
        .then(() => {
            console.log('🎉 Парсинг завершен успешно!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Ошибка:', error);
            process.exit(1);
        });
}