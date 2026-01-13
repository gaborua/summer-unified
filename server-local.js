/**
 * Servidor local para desarrollo
 * Sirve archivos estáticos y maneja la API
 */

// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

// Importar rutas de API
const salesRoutes = require('./api/routes/sales');
const expensesRoutes = require('./api/routes/expenses');
const calculationsRoutes = require('./api/routes/calculations');
const eventsRoutes = require('./api/routes/events');
const packagesRoutes = require('./api/routes/packages');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde public
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de API
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/calculations', calculationsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/packages', packagesRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Manejar rutas SPA (redirigir a index.html para rutas del frontend)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint no encontrado' });
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
    console.log(`🚀 Servidor local corriendo en http://localhost:${PORT}`);
    console.log(`📱 Frontend disponible en: http://localhost:${PORT}`);
    console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
    console.log(`💰 Módulo de ventas: http://localhost:${PORT}/ventas/index.html`);
});