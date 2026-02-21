const { chromium } = require('playwright');
const fs = require('fs');

class WebsiteAnalyzer {
    constructor() {
        this.browser = null;
        this.results = [];
    }

    async init() {
        this.browser = await chromium.launch({ 
            headless: true,  // Скрытый режим для анализа сайтов
            timeout: 30000
        });
    }

    async analyzeSite(clinic) {
        if (!clinic.website || clinic.website === 'нет сайта') {
            return {
                ...clinic,
                hasWebsite: false,
                hasYandexWidget: false,
                has2gisWidget: false,
                hasOtherReviewWidgets: false,
                emails: [],
                additionalPhones: [],
                analysis: 'no_website'
            };
        }

        const page = await this.browser.newPage();
        
        try {
            console.log(`🔍 Анализируем сайт: ${clinic.website}`);
            
            await page.goto(clinic.website, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            
            await page.waitForTimeout(2000); // Даем время на загрузку динамического контента
            
            // 1. Поиск виджетов отзывов
            const widgets = await this.findReviewWidgets(page);
            
            // 2. Поиск email адресов
            const emails = await this.findEmails(page);
            
            // 3. Поиск дополнительных телефонов  
            const phones = await this.findPhones(page);
            
            // 4. Анализ потенциала для GeoReview
            const potential = this.assessPotential(widgets, emails);
            
            const result = {
                ...clinic,
                hasWebsite: true,
                hasYandexWidget: widgets.yandex,
                has2gisWidget: widgets.twogis,
                hasOtherReviewWidgets: widgets.other.length > 0,
                otherWidgets: widgets.other,
                emails: emails,
                additionalPhones: phones,
                potential: potential,
                analysis: 'analyzed',
                analyzedAt: new Date().toISOString()
            };
            
            console.log(`✅ ${clinic.name}: ${potential} (emails: ${emails.length}, виджеты: ${widgets.yandex || widgets.twogis ? 'есть' : 'нет'})`);
            
            return result;
            
        } catch (error) {
            console.log(`❌ Ошибка при анализе ${clinic.website}: ${error.message}`);
            
            return {
                ...clinic,
                hasWebsite: true,
                hasYandexWidget: false,
                has2gisWidget: false,
                hasOtherReviewWidgets: false,
                emails: [],
                additionalPhones: [],
                potential: 'error',
                analysis: 'error',
                error: error.message
            };
        } finally {
            await page.close();
        }
    }

    async findReviewWidgets(page) {
        const widgets = {
            yandex: false,
            twogis: false,
            other: []
        };
        
        try {
            const pageContent = await page.content();
            const html = pageContent.toLowerCase();
            
            // Поиск Яндекс виджетов
            if (html.includes('yandex') && (html.includes('reviews') || html.includes('отзыв') || html.includes('rating'))) {
                const yandexSelectors = [
                    '[class*="yandex"]',
                    '[id*="yandex"]', 
                    'iframe[src*="yandex"]',
                    'script[src*="yandex"]'
                ];
                
                for (const selector of yandexSelectors) {
                    const elements = await page.$$(selector);
                    if (elements.length > 0) {
                        widgets.yandex = true;
                        break;
                    }
                }
            }
            
            // Поиск 2ГИС виджетов
            if (html.includes('2gis') || html.includes('2гис')) {
                const twogisSelectors = [
                    '[class*="2gis"]',
                    '[id*="2gis"]',
                    'iframe[src*="2gis"]',
                    'script[src*="2gis"]'
                ];
                
                for (const selector of twogisSelectors) {
                    const elements = await page.$$(selector);
                    if (elements.length > 0) {
                        widgets.twogis = true;
                        break;
                    }
                }
            }
            
            // Поиск других популярных виджетов
            const otherWidgets = [
                { name: 'Google Reviews', patterns: ['google.*review', 'google.*rating', 'maps.google'] },
                { name: 'Flamp', patterns: ['flamp'] },
                { name: 'Zoon', patterns: ['zoon'] },
                { name: 'Отзовик', patterns: ['otzovik', 'отзовик'] },
                { name: 'Yell', patterns: ['yell.ru'] }
            ];
            
            for (const widget of otherWidgets) {
                for (const pattern of widget.patterns) {
                    if (html.includes(pattern)) {
                        widgets.other.push(widget.name);
                        break;
                    }
                }
            }
            
        } catch (error) {
            console.log(`❌ Ошибка поиска виджетов: ${error.message}`);
        }
        
        return widgets;
    }

    async findEmails(page) {
        const emails = new Set();
        
        try {
            // 1. Поиск в тексте страницы
            const pageText = await page.textContent('body');
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const textEmails = pageText.match(emailRegex) || [];
            textEmails.forEach(email => emails.add(email.toLowerCase()));
            
            // 2. Поиск в ссылках mailto
            const mailtoLinks = await page.$$('a[href^="mailto:"]');
            for (const link of mailtoLinks) {
                const href = await link.getAttribute('href');
                const email = href.replace('mailto:', '').split('?')[0];
                emails.add(email.toLowerCase());
            }
            
            // 3. Поиск в скрытых атрибутах
            const hiddenEmails = await page.evaluate(() => {
                const found = [];
                const elements = document.querySelectorAll('[data-email], [data-mail]');
                elements.forEach(el => {
                    const email = el.dataset.email || el.dataset.mail;
                    if (email && email.includes('@')) {
                        found.push(email);
                    }
                });
                return found;
            });
            hiddenEmails.forEach(email => emails.add(email.toLowerCase()));
            
        } catch (error) {
            console.log(`❌ Ошибка поиска email: ${error.message}`);
        }
        
        // Фильтруем нежелательные email
        const filteredEmails = Array.from(emails).filter(email => 
            !email.includes('example.com') &&
            !email.includes('test.com') &&
            !email.includes('noreply') &&
            !email.includes('no-reply')
        );
        
        return filteredEmails;
    }

    async findPhones(page) {
        const phones = new Set();
        
        try {
            // 1. Поиск в ссылках tel:
            const telLinks = await page.$$('a[href^="tel:"]');
            for (const link of telLinks) {
                const href = await link.getAttribute('href');
                const phone = href.replace('tel:', '').trim();
                phones.add(phone);
            }
            
            // 2. Поиск в тексте страницы
            const pageText = await page.textContent('body');
            const phoneRegex = /(?:\+7|8)[\s\-\(\)]?(?:\d{3})[\s\-\(\)]?(?:\d{3})[\s\-\(\)]?(?:\d{2})[\s\-\(\)]?(?:\d{2})/g;
            const textPhones = pageText.match(phoneRegex) || [];
            textPhones.forEach(phone => phones.add(phone.replace(/[\s\-\(\)]/g, '')));
            
        } catch (error) {
            console.log(`❌ Ошибка поиска телефонов: ${error.message}`);
        }
        
        return Array.from(phones);
    }

    assessPotential(widgets, emails) {
        // Горячий лид: нет виджетов отзывов + есть email
        if (!widgets.yandex && !widgets.twogis && widgets.other.length === 0 && emails.length > 0) {
            return 'hot';
        }
        
        // Теплый лид: есть старые/плохие виджеты + есть контакты
        if ((widgets.yandex || widgets.twogis || widgets.other.length > 0) && emails.length > 0) {
            return 'warm';
        }
        
        // Холодный лид: нет контактов или много современных виджетов
        if (emails.length === 0) {
            return 'cold_no_contacts';
        }
        
        return 'cold';
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

module.exports = WebsiteAnalyzer;