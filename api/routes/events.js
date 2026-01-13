/**
 * Rutas de API - Eventos
 * Gestión completa de eventos del sistema
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const {
    validateRequired,
    validatePositiveNumber,
    validateString
} = require('../utils/validators');

// ============================================================================
// GET /api/events - Listar todos los eventos
// ============================================================================

router.get('/', async (req, res) => {
    try {
        const { status, city, limit = 100, active_only } = req.query;

        let query = supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: true })
            .limit(parseInt(limit));

        // Filtros opcionales
        if (status) query = query.eq('status', status);
        if (city) query = query.eq('city', city);
        if (active_only === 'true') query = query.eq('status', 'activo');

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Error obteniendo eventos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// GET /api/events/:id - Obtener evento específico
// ============================================================================

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Evento no encontrado'
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error obteniendo evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// POST /api/events - Crear nuevo evento
// ============================================================================

router.post('/', async (req, res) => {
    try {
        const {
            event_name,
            event_slug,
            event_date,
            event_type,
            city,
            venue_name,
            capacity,
            ticket_price,
            status = 'activo'
        } = req.body;

        // Validaciones
        const validationErrors = [];

        if (!validateRequired(event_name, 'Nombre del evento')) {
            validationErrors.push('Nombre del evento es requerido');
        }

        if (!validateRequired(event_date, 'Fecha del evento')) {
            validationErrors.push('Fecha del evento es requerida');
        }

        if (!validateRequired(city, 'Ciudad')) {
            validationErrors.push('Ciudad es requerida');
        }

        if (!validatePositiveNumber(ticket_price, 'Precio del ticket')) {
            validationErrors.push('Precio del ticket debe ser un número positivo');
        }

        if (capacity && !validatePositiveNumber(capacity, 'Capacidad')) {
            validationErrors.push('Capacidad debe ser un número positivo');
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Errores de validación',
                details: validationErrors
            });
        }

        // Generar slug si no se proporciona
        let finalSlug = event_slug;
        if (!finalSlug) {
            finalSlug = generateSlug(event_name);
        }

        // Verificar que el slug sea único
        const { data: existingEvent } = await supabase
            .from('events')
            .select('id')
            .eq('event_slug', finalSlug)
            .single();

        if (existingEvent) {
            // Agregar timestamp para hacer único el slug
            finalSlug = `${finalSlug}-${Date.now()}`;
        }

        // Crear evento
        const eventData = {
            event_name: validateString(event_name),
            event_slug: finalSlug,
            event_date,
            event_type: event_type || null,
            city: validateString(city),
            venue_name: venue_name ? validateString(venue_name) : null,
            capacity: capacity ? parseInt(capacity) : null,
            ticket_price: parseFloat(ticket_price),
            status: validateString(status)
        };

        const { data, error } = await supabase
            .from('events')
            .insert(eventData)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: data,
            message: 'Evento creado exitosamente'
        });

    } catch (error) {
        console.error('Error creando evento:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                error: 'Ya existe un evento con ese nombre o identificador'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// PUT /api/events/:id - Actualizar evento
// ============================================================================

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            event_name,
            event_date,
            event_type,
            city,
            venue_name,
            capacity,
            ticket_price,
            status
        } = req.body;

        // Verificar que el evento existe
        const { data: existingEvent, error: fetchError } = await supabase
            .from('events')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !existingEvent) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        // Preparar datos de actualización (solo campos proporcionados)
        const updateData = {};

        if (event_name !== undefined) {
            if (!validateRequired(event_name, 'Nombre del evento')) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombre del evento es requerido'
                });
            }
            updateData.event_name = validateString(event_name);
        }

        if (event_date !== undefined) {
            if (!validateRequired(event_date, 'Fecha del evento')) {
                return res.status(400).json({
                    success: false,
                    error: 'Fecha del evento es requerida'
                });
            }
            updateData.event_date = event_date;
        }

        if (city !== undefined) {
            if (!validateRequired(city, 'Ciudad')) {
                return res.status(400).json({
                    success: false,
                    error: 'Ciudad es requerida'
                });
            }
            updateData.city = validateString(city);
        }

        if (ticket_price !== undefined) {
            if (!validatePositiveNumber(ticket_price, 'Precio del ticket')) {
                return res.status(400).json({
                    success: false,
                    error: 'Precio del ticket debe ser un número positivo'
                });
            }
            updateData.ticket_price = parseFloat(ticket_price);
        }

        if (event_type !== undefined) {
            updateData.event_type = event_type || null;
        }

        if (venue_name !== undefined) {
            updateData.venue_name = venue_name ? validateString(venue_name) : null;
        }

        if (capacity !== undefined) {
            if (capacity && !validatePositiveNumber(capacity, 'Capacidad')) {
                return res.status(400).json({
                    success: false,
                    error: 'Capacidad debe ser un número positivo'
                });
            }
            updateData.capacity = capacity ? parseInt(capacity) : null;
        }

        if (status !== undefined) {
            updateData.status = validateString(status);
        }

        // Actualizar evento
        const { data, error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data,
            message: 'Evento actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// DELETE /api/events/:id - Eliminar evento
// ============================================================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el evento existe
        const { data: existingEvent, error: fetchError } = await supabase
            .from('events')
            .select('event_name')
            .eq('id', id)
            .single();

        if (fetchError || !existingEvent) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

        // Verificar si hay ventas asociadas al evento
        const { data: sales, error: salesError } = await supabase
            .from('sale_events')
            .select('sale_id')
            .eq('event_id', id)
            .limit(1);

        if (salesError) throw salesError;

        if (sales && sales.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'No se puede eliminar un evento que tiene ventas registradas'
            });
        }

        // Eliminar evento
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: `Evento "${existingEvent.event_name}" eliminado exitosamente`
        });

    } catch (error) {
        console.error('Error eliminando evento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Generar slug único para el evento
 * @param {string} eventName - Nombre del evento
 * @returns {string} Slug generado
 */
function generateSlug(eventName) {
    return eventName
        .toLowerCase()
        .replace(/[áäàâã]/g, 'a')
        .replace(/[éëèê]/g, 'e')
        .replace(/[íïìî]/g, 'i')
        .replace(/[óöòôõ]/g, 'o')
        .replace(/[úüùû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

module.exports = router;