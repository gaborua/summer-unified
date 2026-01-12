/**
 * Rutas de API - Calculadora de Eventos
 * TODO: Implementar en Fase 3
 */

const express = require('express');
const router = express.Router();

// Placeholder - se implementará en Fase 3
router.get('/', async (req, res) => {
    res.json({
        message: 'Módulo de Calculadora - En desarrollo (Fase 3)',
        status: 'pending',
        endpoints_planned: [
            'GET /api/calculations',
            'POST /api/calculations',
            'GET /api/calculations/:id',
            'DELETE /api/calculations/:id'
        ]
    });
});

module.exports = router;
