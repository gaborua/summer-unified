/**
 * Rutas de API - Paquetes
 * Gestión de paquetes y sus eventos asociados
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');

// ============================================================================
// GET /api/packages - Listar todos los paquetes
// ============================================================================

router.get('/', async (req, res) => {
    try {
        const { active_only } = req.query;

        let query = supabase
            .from('packages')
            .select('*')
            .order('created_at', { ascending: false });

        // Solo paquetes activos si se especifica
        if (active_only === 'true') {
            query = query.eq('active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Error obteniendo paquetes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// GET /api/packages/:id - Obtener paquete específico
// ============================================================================

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Paquete no encontrado'
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error obteniendo paquete:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// GET /api/packages/:id/events - Obtener eventos de un paquete
// ============================================================================

router.get('/:id/events', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el paquete existe
        const { data: packageData, error: packageError } = await supabase
            .from('packages')
            .select('id, package_name')
            .eq('id', id)
            .single();

        if (packageError || !packageData) {
            return res.status(404).json({
                success: false,
                error: 'Paquete no encontrado'
            });
        }

        // Obtener eventos asociados al paquete
        const { data, error } = await supabase
            .from('package_events')
            .select(`
                events (
                    id,
                    event_name,
                    event_date,
                    city,
                    venue_name,
                    ticket_price,
                    status
                )
            `)
            .eq('package_id', id);

        if (error) throw error;

        // Extraer solo los datos de eventos
        const events = data?.map(item => item.events).filter(Boolean) || [];

        res.json({
            success: true,
            data: events,
            package: packageData
        });

    } catch (error) {
        console.error('Error obteniendo eventos del paquete:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// POST /api/packages - Crear nuevo paquete
// ============================================================================

router.post('/', async (req, res) => {
    try {
        const {
            package_name,
            package_slug,
            description,
            package_price,
            discount_percent,
            active = true,
            event_ids = []
        } = req.body;

        // Validaciones básicas
        if (!package_name) {
            return res.status(400).json({
                success: false,
                error: 'Nombre del paquete es requerido'
            });
        }

        if (!package_price || parseFloat(package_price) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Precio del paquete debe ser mayor a 0'
            });
        }

        // Generar slug si no se proporciona
        let finalSlug = package_slug;
        if (!finalSlug) {
            finalSlug = package_name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
        }

        // Crear paquete
        const packageData = {
            package_name,
            package_slug: finalSlug,
            description: description || null,
            package_price: parseFloat(package_price),
            discount_percent: discount_percent ? parseFloat(discount_percent) : null,
            active: Boolean(active)
        };

        const { data: newPackage, error: packageError } = await supabase
            .from('packages')
            .insert(packageData)
            .select()
            .single();

        if (packageError) throw packageError;

        // Asociar eventos al paquete si se proporcionan
        if (event_ids.length > 0) {
            const packageEvents = event_ids.map(eventId => ({
                package_id: newPackage.id,
                event_id: parseInt(eventId)
            }));

            const { error: eventsError } = await supabase
                .from('package_events')
                .insert(packageEvents);

            if (eventsError) {
                console.error('Error asociando eventos al paquete:', eventsError);
                // No fallar la operación, solo log el error
            }
        }

        res.status(201).json({
            success: true,
            data: newPackage,
            message: 'Paquete creado exitosamente'
        });

    } catch (error) {
        console.error('Error creando paquete:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                error: 'Ya existe un paquete con ese nombre'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// PUT /api/packages/:id - Actualizar paquete
// ============================================================================

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            package_name,
            description,
            package_price,
            discount_percent,
            active,
            event_ids
        } = req.body;

        // Verificar que el paquete existe
        const { data: existingPackage, error: fetchError } = await supabase
            .from('packages')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !existingPackage) {
            return res.status(404).json({
                success: false,
                error: 'Paquete no encontrado'
            });
        }

        // Preparar datos de actualización
        const updateData = {};

        if (package_name !== undefined) {
            updateData.package_name = package_name;
        }
        if (description !== undefined) {
            updateData.description = description || null;
        }
        if (package_price !== undefined) {
            updateData.package_price = parseFloat(package_price);
        }
        if (discount_percent !== undefined) {
            updateData.discount_percent = discount_percent ? parseFloat(discount_percent) : null;
        }
        if (active !== undefined) {
            updateData.active = Boolean(active);
        }

        // Actualizar paquete
        const { data, error } = await supabase
            .from('packages')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Actualizar eventos asociados si se proporcionan
        if (event_ids !== undefined) {
            // Eliminar asociaciones existentes
            await supabase
                .from('package_events')
                .delete()
                .eq('package_id', id);

            // Crear nuevas asociaciones
            if (event_ids.length > 0) {
                const packageEvents = event_ids.map(eventId => ({
                    package_id: parseInt(id),
                    event_id: parseInt(eventId)
                }));

                const { error: eventsError } = await supabase
                    .from('package_events')
                    .insert(packageEvents);

                if (eventsError) {
                    console.error('Error actualizando eventos del paquete:', eventsError);
                }
            }
        }

        res.json({
            success: true,
            data: data,
            message: 'Paquete actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando paquete:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================================================
// DELETE /api/packages/:id - Eliminar paquete
// ============================================================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el paquete existe
        const { data: existingPackage, error: fetchError } = await supabase
            .from('packages')
            .select('package_name')
            .eq('id', id)
            .single();

        if (fetchError || !existingPackage) {
            return res.status(404).json({
                success: false,
                error: 'Paquete no encontrado'
            });
        }

        // Verificar si hay ventas asociadas al paquete
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('id')
            .eq('package_id', id)
            .limit(1);

        if (salesError) throw salesError;

        if (sales && sales.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'No se puede eliminar un paquete que tiene ventas registradas'
            });
        }

        // Eliminar asociaciones de eventos primero
        await supabase
            .from('package_events')
            .delete()
            .eq('package_id', id);

        // Eliminar paquete
        const { error } = await supabase
            .from('packages')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: `Paquete "${existingPackage.package_name}" eliminado exitosamente`
        });

    } catch (error) {
        console.error('Error eliminando paquete:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;