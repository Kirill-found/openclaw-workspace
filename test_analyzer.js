const WebsiteAnalyzer = require('./website_analyzer');

async function testAnalyzer() {
    console.log('🧪 Тестируем исправленный анализатор сайтов...');
    
    // Создаем тестовые данные
    const testClinics = [
        {
            name: 'Тест Стоматология',
            address: 'Москва, Тестовая улица, 1',
            website: 'https://httpbin.org/html',  // Простая тестовая страница
            phone: '+7 123 456-78-90'
        },
        {
            name: 'Клиника без сайта',
            address: 'Москва, Другая улица, 2',
            website: null,
            phone: '+7 987 654-32-10'
        }
    ];
    
    const analyzer = new WebsiteAnalyzer();
    
    try {
        await analyzer.init();
        console.log('✅ Анализатор инициализирован');
        
        for (const clinic of testClinics) {
            console.log(`\\n🔍 Анализируем: ${clinic.name}`);
            const result = await analyzer.analyzeSite(clinic);
            
            console.log('📊 Результат анализа:');
            console.log(`   Сайт: ${result.hasWebsite ? 'есть' : 'нет'}`);
            console.log(`   Emails: ${result.emails.length}`);
            console.log(`   Потенциал: ${result.potential}`);
            console.log(`   Статус: ${result.analysis}`);
        }
        
        console.log('\\n✅ Тест анализатора завершен успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error);
        throw error;
    } finally {
        await analyzer.close();
    }
}

testAnalyzer()
    .then(() => console.log('🎉 Анализатор работает!'))
    .catch(err => console.error('💥 Ошибка:', err));