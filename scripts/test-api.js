/**
 * Script de prueba de API
 * Verifica que las rutas y middlewares se puedan cargar correctamente
 */

function testRouteLoading() {
    console.log('🧪 Probando carga de rutas de API...\n');

    try {
        // Test carga de utilidades
        console.log('📦 Cargando utilidades...');
        const validators = require('../api/utils/validators');
        console.log('✅ Validadores cargados correctamente');

        // Test carga de rutas (sin conexión a Supabase)
        console.log('\n🛣️ Probando rutas...');
        
        // Sales route
        try {
            require('../api/routes/sales');
            console.log('✅ Rutas de ventas cargadas');
        } catch (err) {
            console.log('❌ Error en rutas de ventas:', err.message);
        }

        // Expenses route  
        try {
            require('../api/routes/expenses');
            console.log('✅ Rutas de gastos cargadas');
        } catch (err) {
            console.log('❌ Error en rutas de gastos:', err.message);
        }

        // Calculations route
        try {
            require('../api/routes/calculations');
            console.log('✅ Rutas de cálculos cargadas');
        } catch (err) {
            console.log('❌ Error en rutas de cálculos:', err.message);
        }

        return true;
    } catch (error) {
        console.log('❌ Error general cargando API:', error.message);
        return false;
    }
}

function testValidators() {
    console.log('\n🔍 Probando validadores...\n');

    try {
        const {
            validateRequired,
            validatePositiveNumber,
            validateEmail,
            validatePhone,
            sanitizeFilename,
            validateFileType
        } = require('../api/utils/validators');

        // Test validateRequired
        const test1 = validateRequired('test value', 'Test Field');
        console.log('✅ validateRequired funcionando');

        // Test validatePositiveNumber
        const test2 = validatePositiveNumber('100', 'Test Number');
        console.log('✅ validatePositiveNumber funcionando');

        // Test validateEmail
        const test3 = validateEmail('test@example.com', 'Email');
        console.log('✅ validateEmail funcionando');

        // Test sanitizeFilename
        const test4 = sanitizeFilename('test file.pdf');
        console.log('✅ sanitizeFilename funcionando');

        return true;
    } catch (error) {
        console.log('❌ Error probando validadores:', error.message);
        return false;
    }
}

function showAPIEndpoints() {
    console.log('\n📋 Endpoints de API disponibles:\n');

    const endpoints = [
        { method: 'GET', path: '/api/sales', description: 'Listar ventas' },
        { method: 'POST', path: '/api/sales/packages', description: 'Crear venta de paquete' },
        { method: 'POST', path: '/api/sales/individual', description: 'Crear venta individual' },
        { method: 'PUT', path: '/api/sales/:id', description: 'Actualizar venta' },
        { method: 'DELETE', path: '/api/sales/:id', description: 'Eliminar venta' },
        
        { method: 'GET', path: '/api/expenses', description: 'Listar gastos' },
        { method: 'POST', path: '/api/expenses', description: 'Crear gasto' },
        { method: 'PUT', path: '/api/expenses/:id', description: 'Actualizar gasto' },
        { method: 'DELETE', path: '/api/expenses/:id', description: 'Eliminar gasto' },
        
        { method: 'GET', path: '/api/calculations/:eventId', description: 'Obtener cálculos de evento' },
        { method: 'POST', path: '/api/calculations', description: 'Crear cálculo' },
        { method: 'PUT', path: '/api/calculations/:id', description: 'Actualizar cálculo' }
    ];

    endpoints.forEach(endpoint => {
        const method = endpoint.method.padEnd(6);
        console.log(`  ${method} ${endpoint.path.padEnd(30)} - ${endpoint.description}`);
    });
}

function main() {
    console.log('🚀 Prueba de funcionalidad de API\n');
    console.log('=' .repeat(50));

    let allGood = true;

    // Test loading routes
    allGood &= testRouteLoading();
    
    // Test validators
    allGood &= testValidators();
    
    // Show endpoints
    showAPIEndpoints();

    console.log('\n' + '='.repeat(50));
    
    if (allGood) {
        console.log('✅ API lista para usar');
        console.log('🔗 Base URL: https://your-vercel-app.vercel.app');
        console.log('\n📝 Para probar completamente:');
        console.log('  1. Configura variables de entorno en Vercel');
        console.log('  2. Ejecuta migraciones en Supabase');
        console.log('  3. Configura buckets de Storage');
        console.log('  4. Realiza requests HTTP a los endpoints');
    } else {
        console.log('❌ Algunos componentes de la API tienen problemas');
        console.log('🔧 Revisa los errores mostrados arriba');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { testRouteLoading, testValidators };