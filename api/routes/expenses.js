/**
 * Rutas de API - Gastos
 * TODO: Implementar en Fase 2
 */

const express = require('express');
const router = express.Router();

// Placeholder - se implementará en Fase 2
router.get('/', async (req, res) => {
    res.json({
        message: 'Módulo de Gastos - En desarrollo (Fase 2)',
        status: 'pending',
        endpoints_planned: [
            'GET /api/expenses',
            'GET /api/expenses/categories',
            'POST /api/expenses',
            'PATCH /api/expenses/:id/approve',
            'DELETE /api/expenses/:id'
        ]
    });
});

router.get('/categories', async (req, res) => {
    res.json({
        message: 'Categorías de gastos - En desarrollo',
        status: 'pending'
    });
});

module.exports = router;
