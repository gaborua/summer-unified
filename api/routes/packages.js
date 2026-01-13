const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// GET /api/packages
// Listar todos los paquetes con sus eventos
// ==========================================
router.get('/', async (req, res) => {
    try {
        let query = supabase
            .from('packages')
            .select(`
                *,
                package_events (
                    event_id,
                    events (
                        id,
                        event_name,
                        event_date,
                        city
                    )
                )
            `)
            .order('created_at', { ascending: false });

        // Por defecto solo activos, a menos que se pida incluir inactivos
        if (req.query.include_inactive !== 'true') {
            query = query.eq('is_active', true);
        }

        const { data: packages, error } = await query;

        if (error) throw error;

        // Formatear respuesta para limpiar la estructura anidada
        const formattedPackages = packages.map(pkg => ({
            ...pkg,
            events: pkg.package_events.map(pe => pe.events)
        }));

        res.json(formattedPackages);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// POST /api/packages
// Crear un nuevo paquete ("Evento Madre")
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { package_name, package_price, description, discount_percent, event_ids } = req.body;

        // 1. Crear el paquete
        const { data: newPackage, error: pkgError } = await supabase
            .from('packages')
            .insert([{
                package_name,
                package_price,
                description,
                discount_percent,
                is_active: true
            }])
            .select()
            .single();

        if (pkgError) throw pkgError;

        // 2. Asociar eventos si se proporcionaron
        if (event_ids && event_ids.length > 0) {
            const packageEvents = event_ids.map(eventId => ({
                package_id: newPackage.id,
                event_id: eventId
            }));

            const { error: linkError } = await supabase
                .from('package_events')
                .insert(packageEvents);

            if (linkError) throw linkError;
        }

        res.status(201).json(newPackage);
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// POST /api/packages/:id/events
// Agregar eventos a un paquete existente
// ==========================================
router.post('/:id/events', async (req, res) => {
    try {
        const { id } = req.params;
        const { event_ids } = req.body;

        if (!event_ids || event_ids.length === 0) {
            return res.status(400).json({ error: 'No event_ids provided' });
        }

        const packageEvents = event_ids.map(eventId => ({
            package_id: id,
            event_id: eventId
        }));

        const { error } = await supabase
            .from('package_events')
            .insert(packageEvents);

        if (error) throw error;

        res.json({ message: 'Events added successfully' });
    } catch (error) {
        console.error('Error adding events to package:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// DELETE /api/packages/:id
// "Eliminar" (desactivar) un paquete
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('packages')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Package deactivated successfully' });
    } catch (error) {
        console.error('Error deleting package:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;