#!/usr/bin/env node

// Быстрый тест селекторов Яндекс.Карт
const { chromium } = require('playwright');

async function testYandexMaps() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log('🌐 Переходим на Яндекс.Карты...');
        await page.goto('https://yandex.ru/maps/', { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });
        
        await page.waitForTimeout(5000);
        
        console.log('🔍 Поиск селекторов...');
        
        // Список селекторов для тестирования
        const selectors = [
            'input[placeholder*="поиск"]',
            'input[placeholder*="Поиск"]', 
            'input[name="text"]',
            '.input__control',
            'input[type="text"]',
            'input.search-form__input',
            '.serp-header .input__control',
            '[data-testid="search-input"]'
        ];
        
        let workingSelector = null;
        
        for (const selector of selectors) {
            try {
                console.log(`Тестируем: ${selector}`);
                const element = await page.$(selector);
                if (element) {
                    const isVisible = await element.isVisible();
                    if (isVisible) {
                        console.log(`✅ РАБОТАЕТ: ${selector}`);
                        workingSelector = selector;
                        
                        // Тестируем ввод
                        await page.fill(selector, 'стоматология москва');
                        console.log('✅ Ввод работает');
                        break;
                    }
                }
            } catch (e) {
                console.log(`❌ Не работает: ${selector}`);
            }
        }
        
        if (workingSelector) {
            console.log(`🎯 НАЙДЕН РАБОЧИЙ СЕЛЕКТОР: ${workingSelector}`);
        } else {
            console.log('❌ НИ ОДИН СЕЛЕКТОР НЕ РАБОТАЕТ');
            
            // Попробуем найти любые input элементы
            const allInputs = await page.$$('input');
            console.log(`📝 Всего найдено input элементов: ${allInputs.length}`);
            
            for (let i = 0; i < Math.min(allInputs.length, 5); i++) {
                const input = allInputs[i];
                const placeholder = await input.getAttribute('placeholder');
                const name = await input.getAttribute('name');
                const type = await input.getAttribute('type');
                console.log(`Input ${i}: placeholder="${placeholder}", name="${name}", type="${type}"`);
            }
        }
        
        await browser.close();
        return workingSelector;
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await browser.close();
        return null;
    }
}

// Запуск
testYandexMaps();