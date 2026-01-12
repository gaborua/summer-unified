/**
 * Script de verificación de estructura del proyecto
 * Verifica que todos los archivos necesarios estén presentes
 */

const fs = require('fs');
const path = require('path');

function checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${description}: ${filePath}`);
    return exists;
}

function checkDirectory(dirPath, description) {
    const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${description}: ${dirPath}`);
    return exists;
}

function main() {
    console.log('🔍 Verificación de estructura del proyecto Summer Unified\n');
    console.log('=' .repeat(60));

    let allGood = true;

    // Verificar estructura de directorios
    console.log('\n📁 Directorios principales:');
    allGood &= checkDirectory('./api', 'Directorio API');
    allGood &= checkDirectory('./api/routes', 'Rutas de API');
    allGood &= checkDirectory('./api/utils', 'Utilidades de API');
    allGood &= checkDirectory('./db', 'Directorio de base de datos');
    allGood &= checkDirectory('./db/migrations', 'Migraciones de BD');
    allGood &= checkDirectory('./db/storage', 'Configuración de Storage');
    allGood &= checkDirectory('./public', 'Directorio público');

    // Verificar archivos de configuración
    console.log('\n⚙️ Archivos de configuración:');
    allGood &= checkFile('./package.json', 'Configuración de Node.js');
    allGood &= checkFile('./vercel.json', 'Configuración de Vercel');
    allGood &= checkFile('./.env.template', 'Template de variables de entorno');

    // Verificar archivos de API
    console.log('\n🔧 API y Backend:');
    allGood &= checkFile('./api/index.js', 'Servidor principal');
    allGood &= checkFile('./api/utils/supabase.js', 'Cliente de Supabase');
    allGood &= checkFile('./api/utils/validators.js', 'Validadores');
    allGood &= checkFile('./api/routes/sales.js', 'Rutas de ventas');
    allGood &= checkFile('./api/routes/expenses.js', 'Rutas de gastos');
    allGood &= checkFile('./api/routes/calculations.js', 'Rutas de cálculos');

    // Verificar migraciones
    console.log('\n🗄️ Migraciones de base de datos:');
    allGood &= checkFile('./db/migrations/001_unified_schema.sql', 'Schema principal');
    allGood &= checkFile('./db/migrations/002_event_calculations.sql', 'Tabla de cálculos');
    allGood &= checkFile('./db/storage/setup_buckets.sql', 'Configuración de Storage');

    // Verificar frontend
    console.log('\n🌐 Frontend:');
    allGood &= checkFile('./public/index.html', 'Página principal');
    allGood &= checkFile('./public/ventas/index.html', 'Módulo de ventas');
    allGood &= checkFile('./public/ventas/paquetes/index.html', 'Venta de paquetes');

    // Verificar archivos de documentación
    console.log('\n📚 Documentación:');
    allGood &= checkFile('./STORAGE_SETUP.md', 'Guía de setup de Storage');

    // Resumen final
    console.log('\n' + '='.repeat(60));
    if (allGood) {
        console.log('✅ Estructura del proyecto verificada correctamente');
        console.log('🚀 El proyecto está listo para deployment y desarrollo');
    } else {
        console.log('❌ Faltan algunos archivos en el proyecto');
        console.log('📋 Revisa los elementos marcados con ❌ arriba');
    }

    // Información adicional
    console.log('\n📊 Estadísticas del proyecto:');
    
    // Contar archivos en cada directorio
    const dirs = [
        { path: './api/routes', name: 'Rutas de API' },
        { path: './public', name: 'Páginas HTML' },
        { path: './db/migrations', name: 'Migraciones' }
    ];

    dirs.forEach(dir => {
        if (fs.existsSync(dir.path)) {
            const files = fs.readdirSync(dir.path).filter(f => 
                fs.statSync(path.join(dir.path, f)).isFile()
            );
            console.log(`  - ${dir.name}: ${files.length} archivos`);
        }
    });

    console.log('\n🔗 Próximos pasos:');
    console.log('  1. Configurar variables de entorno (.env)');
    console.log('  2. Ejecutar migraciones en Supabase');
    console.log('  3. Configurar buckets de Storage');
    console.log('  4. Probar API endpoints');
    console.log('  5. Verificar funcionalidad completa');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { checkFile, checkDirectory };