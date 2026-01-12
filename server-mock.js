/**
 * Servidor mock para desarrollo del frontend
 * Simula la API sin necesidad de Supabase
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde public
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// MOCK API ENDPOINTS
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API Mock funcionando correctamente',
        timestamp: new Date().toISOString(),
        mode: 'development-mock'
    });
});

// Mock - Estadísticas de ventas
app.get('/api/sales/stats', (req, res) => {
    console.log('📊 Mock: Solicitando estadísticas de ventas');
    
    // Datos simulados
    const mockStats = {
        success: true,
        data: {
            total_sales: 25,
            package_sales: 15,
            individual_sales: 10,
            total_revenue: 125000.50
        }
    };
    
    // Simular un pequeño delay como en una API real
    setTimeout(() => {
        res.json(mockStats);
        console.log('✅ Mock: Estadísticas enviadas');
    }, 500);
});

// Mock - Listar ventas
app.get('/api/sales', (req, res) => {
    console.log('📋 Mock: Solicitando lista de ventas');
    
    const mockSales = {
        success: true,
        data: [
            {
                id: 1,
                sale_type: 'package',
                customer_name: 'María García',
                total_amount: 850.00,
                payment_status: 'confirmado',
                created_at: '2026-01-10T10:30:00Z'
            },
            {
                id: 2,
                sale_type: 'individual',
                customer_name: 'Carlos Rodríguez',
                total_amount: 200.00,
                payment_status: 'pendiente',
                created_at: '2026-01-11T15:45:00Z'
            }
        ]
    };
    
    setTimeout(() => {
        res.json(mockSales);
        console.log('✅ Mock: Ventas enviadas');
    }, 300);
});

// Mock - Obtener eventos
app.get('/api/events', (req, res) => {
    const mockEvents = {
        success: true,
        data: [
            {
                id: 1,
                event_name: 'Año Nuevo 2026 - Tarija',
                event_date: '2025-12-31',
                city: 'Tarija',
                ticket_price: 200.00,
                status: 'activo'
            },
            {
                id: 2,
                event_name: 'Carnaval 2026 - Santa Cruz',
                event_date: '2026-02-15',
                city: 'Santa Cruz',
                ticket_price: 180.00,
                status: 'activo'
            }
        ]
    };
    
    res.json(mockEvents);
});

// Mock - Obtener paquetes
app.get('/api/packages', (req, res) => {
    const mockPackages = {
        success: true,
        data: [
            {
                id: 1,
                package_name: 'Paquete Año Nuevo 2026',
                package_price: 850.00,
                discount_percent: 15,
                active: true
            },
            {
                id: 2,
                package_name: 'Paquete Carnaval 2026',
                package_price: 450.00,
                discount_percent: 15,
                active: true
            }
        ]
    };
    
    res.json(mockPackages);
});

// Mock - Crear venta (simplificado)
app.post('/api/sales/:type', (req, res) => {
    const { type } = req.params;
    console.log(`💰 Mock: Creando venta ${type}`);
    
    // Simular creación exitosa
    const mockSale = {
        success: true,
        data: {
            id: Date.now(),
            sale_type: type,
            customer_name: req.body.customer_name || 'Cliente Demo',
            total_amount: parseFloat(req.body.total_amount) || 200,
            payment_status: 'confirmado',
            created_at: new Date().toISOString()
        },
        message: `Venta ${type} creada exitosamente`
    };
    
    setTimeout(() => {
        res.status(201).json(mockSale);
        console.log('✅ Mock: Venta creada');
    }, 800);
});

// Catch-all para endpoints no implementados
app.all('/api/*', (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Endpoint no implementado en modo mock',
        endpoint: req.path,
        method: req.method
    });
});

// Manejar rutas SPA (redirigir a index.html para rutas del frontend)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ 
            success: false,
            error: 'Endpoint no encontrado' 
        });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
    });
});

app.listen(PORT, () => {
    console.log('=' .repeat(60));
    console.log('🚀 SERVIDOR MOCK CORRIENDO');
    console.log('=' .repeat(60));
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API Mock: http://localhost:${PORT}/api`);
    console.log(`💰 Ventas: http://localhost:${PORT}/ventas/index.html`);
    console.log(`📊 Health: http://localhost:${PORT}/api/health`);
    console.log('=' .repeat(60));
    console.log('ℹ️  Modo: DESARROLLO SIN BASE DE DATOS');
    console.log('ℹ️  Los datos son simulados para probar el frontend');
    console.log('=' .repeat(60));
});