/**
 * Summer Unified - API Principal
 * Punto de entrada para todas las rutas de la API
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Importar rutas
const salesRoutes = require('./routes/sales');
const expensesRoutes = require('./routes/expenses');
const calculationsRoutes = require('./routes/calculations');

// Inicializar Express
const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://summer-unified.vercel.app', 'https://summer-unified-gaborua.vercel.app']
        : '*',
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Error handling para Multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Archivo muy grande (máximo 4MB)' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Campo de archivo inesperado' });
        }
    }
    next(error);
});

// ============================================================================
// RUTAS
// ============================================================================

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Verificar conexión a Supabase
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { data, error } = await supabase
            .from('sales')
            .select('count')
            .limit(1);
            
        if (error) throw error;
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Info de deployment
app.get('/api/deploy-info', (req, res) => {
    res.json({
        service: 'Summer Unified API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        vercel_region: process.env.VERCEL_REGION || 'unknown',
        build_id: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown'
    });
});

// Rutas de módulos
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/calculations', calculationsRoutes);

// Estadísticas generales
app.get('/api/stats/general', async (req, res) => {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Obtener ventas
        const { data: salesData } = await supabase
            .from('sales')
            .select('sale_type, total_amount, payment_status, ticket_quantity');

        // Obtener gastos
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount, status');

        // Calcular estadísticas
        const stats = {
            sales: {
                total_count: salesData?.length || 0,
                total_revenue: salesData
                    ?.filter(s => s.payment_status === 'pagado')
                    ?.reduce((sum, s) => sum + parseFloat(s.total_amount), 0) || 0,
                pending_revenue: salesData
                    ?.filter(s => s.payment_status === 'pendiente')
                    ?.reduce((sum, s) => sum + parseFloat(s.total_amount), 0) || 0,
                total_tickets: salesData
                    ?.reduce((sum, s) => sum + s.ticket_quantity, 0) || 0
            },
            expenses: {
                total_count: expensesData?.length || 0,
                total_amount: expensesData
                    ?.filter(e => e.status === 'aprobado')
                    ?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0,
                pending_amount: expensesData
                    ?.filter(e => e.status === 'pendiente')
                    ?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0
            }
        };

        // Calcular utilidad neta
        stats.net_profit = stats.sales.total_revenue - stats.expenses.total_amount;

        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas generales:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Ruta no encontrada
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        method: req.method,
        path: req.originalUrl
    });
});

// Error handler global
app.use((error, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, error);
    
    // Error de validación
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Datos de entrada inválidos' });
    }
    
    // Error de Supabase
    if (error.code && error.message) {
        return res.status(500).json({ 
            error: 'Error de base de datos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
    
    // Error genérico
    res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// ============================================================================
// EXPORT
// ============================================================================

module.exports = app;