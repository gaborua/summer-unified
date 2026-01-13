const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// GET /api/events
// Listar todos los eventos
// Query params: ?active=true (opcional)
// ==========================================
router.get('/', async (req, res) => {
    try {
        let query = supabase
            .from('events')
            .select(`
                *,
                package_events (
                    package_id,
                    packages (
                        id,
                        package_name
                    )
                )
            `)
            .order('event_date', { ascending: true });

        // Filtrar por activos si se solicita
        if (req.query.active === 'true') {
            query = query.eq('status', 'activo');
        }

        const { data: events, error } = await query;

        if (error) throw error;

        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// POST /api/events
// Crear un nuevo evento individual
// Body: { event_name, event_date, city, base_price, package_id (optional) }
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { event_name, event_date, city, base_price, package_id } = req.body;

        // Generar slug básico
        const event_slug = event_name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-') + '-' + Date.now();

        // 1. Crear el evento
        const { data: newEvent, error: eventError } = await supabase
            .from('events')
            .insert([{
                event_name,
                event_date,
                city,
                ticket_price: base_price,
                event_slug,
                status: 'activo'
            }])
            .select()
            .single();

        if (eventError) throw eventError;

        // 2. Asociar a paquete si se proporcionó package_id
        if (package_id) {
            const { error: linkError } = await supabase
                .from('package_events')
                .insert([{
                    package_id: parseInt(package_id),
                    event_id: newEvent.id
                }]);

            if (linkError) {
                // No fallamos toda la request, pero logueamos el error
                console.error('Error linking event to package:', linkError);
                // Podríamos decidir hacer rollback aquí si fuera crítico
            }
        }

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// DELETE /api/events/:id
// Desactivar un evento
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('events')
            .update({ status: 'inactivo' })
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Event deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating event:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;