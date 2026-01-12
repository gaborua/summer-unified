/**
 * Script de verificación de base de datos
 * Verifica que todas las tablas estén creadas correctamente
 */

require('dotenv').config();
const { supabase, testConnection } = require('../api/utils/supabase');

async function verifyTables() {
    console.log('🔍 Verificando tablas de la base de datos...\n');

    const tables = [
        'events',
        'packages', 
        'package_events',
        'sales',
        'sale_events',
        'expense_categories',
        'expense_subcategories', 
        'expenses',
        'event_calculations'
    ];

    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ Error en tabla ${table}:`, error.message);
            } else {
                console.log(`✅ Tabla ${table}: ${count || 0} registros`);
            }
        } catch (err) {
            console.log(`❌ Error conectando a tabla ${table}:`, err.message);
        }
    }
}

async function verifyData() {
    console.log('\n📊 Verificando datos de ejemplo...\n');

    try {
        // Verificar eventos
        const { data: events } = await supabase
            .from('events')
            .select('event_name, city, event_date')
            .limit(5);

        console.log('🎉 Eventos encontrados:');
        events?.forEach(event => {
            console.log(`  - ${event.event_name} (${event.city}) - ${event.event_date}`);
        });

        // Verificar categorías de gastos
        const { data: categories } = await supabase
            .from('expense_categories')
            .select('category_name, icon')
            .limit(5);

        console.log('\n💰 Categorías de gastos:');
        categories?.forEach(cat => {
            console.log(`  - ${cat.icon} ${cat.category_name}`);
        });

        // Verificar cálculos de eventos
        const { data: calculations } = await supabase
            .from('event_calculations')
            .select('calculation_name, scenario_type')
            .limit(3);

        console.log('\n📈 Cálculos de eventos:');
        calculations?.forEach(calc => {
            console.log(`  - ${calc.calculation_name} (${calc.scenario_type})`);
        });

    } catch (error) {
        console.log('❌ Error verificando datos:', error.message);
    }
}

async function verifyStorageBuckets() {
    console.log('\n🪣 Verificando buckets de storage...\n');

    const buckets = ['receipts', 'documents', 'event-images'];
    
    for (const bucketName of buckets) {
        try {
            const { data, error } = await supabase.storage.getBucket(bucketName);
            
            if (error) {
                console.log(`❌ Error en bucket ${bucketName}:`, error.message);
            } else {
                const isPublic = data.public ? '🌍 Público' : '🔒 Privado';
                console.log(`✅ Bucket ${bucketName}: ${isPublic}`);
            }
        } catch (err) {
            console.log(`❌ Error verificando bucket ${bucketName}:`, err.message);
        }
    }
}

async function main() {
    console.log('🚀 Verificación del sistema Summer Festival\n');
    console.log('=' .repeat(50));

    // Test conexión
    const isConnected = await testConnection();
    if (!isConnected) {
        console.log('❌ No se pudo conectar a la base de datos');
        return;
    }

    // Verificar estructura
    await verifyTables();
    
    // Verificar datos
    await verifyData();
    
    // Verificar storage
    await verifyStorageBuckets();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Verificación completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { verifyTables, verifyData, verifyStorageBuckets };