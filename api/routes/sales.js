/**
 * Rutas de API - Ventas
 * Maneja ventas de paquetes e individuales
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase, getPublicUrl, uploadFile } = require('../utils/supabase');
const {
    validateRequired,
    validatePositiveNumber,
    validateEmail,
    validatePhone,
    sanitizeFilename,
    validateFileSize,
    validateFileType
} = require('../utils/validators');

// Configurar Multer para upload de archivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 4 * 1024 * 1024 // 4MB
    }
});

// ============================================================================
// GET /api/sales - Listar todas las ventas
// ============================================================================

router.get('/', async (req, res) => {
    try {
        const { sale_type, city, payment_status, limit = 100 } = req.query;

        let query = supabase
            .from('sales')
            .select(`
        *,
        package:packages(package_name, package_price),
        sale_events(
          event:events(id, event_name, city, event_date, ticket_price)
        )
      `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        // Filtros opcionales
        if (sale_type) query = query.eq('sale_type', sale_type);
        if (city) query = query.eq('city', city);
        if (payment_status) query = query.eq('payment_status', payment_status);

        const { data, error } = await query;

        if (error) throw error;

        // Agregar URLs públicas de recibos
        const salesWithUrls = data.map(sale => ({
            ...sale,
            receipt_url: sale.receipt_filename
                ? getPublicUrl('receipts', sale.receipt_filename)
                : null
        }));

        res.json(salesWithUrls);
    } catch (error) {
        console.error('Error obteniendo ventas:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/sales/stats - Estadísticas de ventas
// ============================================================================

router.get('/stats', async (req, res) => {
    try {
        // Total de ventas
        const { data: allSales, error: salesError } = await supabase
            .from('sales')
            .select('sale_type, ticket_quantity, total_amount, payment_status');

        if (salesError) throw salesError;

        const stats = {
            total_sales: allSales.length,

            // Por tipo
            package_sales: allSales.filter(s => s.sale_type === 'package').length,
            individual_sales: allSales.filter(s => s.sale_type === 'individual').length,

            // Tickets
            total_tickets: allSales.reduce((sum, s) => sum + s.ticket_quantity, 0),
            package_tickets: allSales
                .filter(s => s.sale_type === 'package')
                .reduce((sum, s) => sum + s.ticket_quantity, 0),
            individual_tickets: allSales
                .filter(s => s.sale_type === 'individual')
                .reduce((sum, s) => sum + s.ticket_quantity, 0),

            // Ingresos
            total_revenue: allSales
                .filter(s => s.payment_status === 'pagado')
                .reduce((sum, s) => sum + parseFloat(s.total_amount), 0),
            pending_revenue: allSales
                .filter(s => s.payment_status === 'pendiente')
                .reduce((sum, s) => sum + parseFloat(s.total_amount), 0),

            // Por estado de pago
            paid_sales: allSales.filter(s => s.payment_status === 'pagado').length,
            pending_sales: allSales.filter(s => s.payment_status === 'pendiente').length
        };

        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// POST /api/sales/package - Crear venta de paquete
// ============================================================================

router.post('/package', upload.single('receipt'), async (req, res) => {
    try {
        const {
            package_id,
            customer_name,
            customer_phone,
            customer_email,
            ticket_quantity,
            city,
            team_leader,
            rrpp_name,
            payment_method = 'transferencia'
        } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, [
            'package_id',
            'customer_name',
            'ticket_quantity'
        ]);

        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Validar cantidad
        const quantityValidation = validatePositiveNumber(ticket_quantity, 'Cantidad de tickets');
        if (!quantityValidation.valid) {
            return res.status(400).json({ error: quantityValidation.error });
        }

        // Validar email si se proporciona
        if (customer_email) {
            const emailValidation = validateEmail(customer_email);
            if (!emailValidation.valid) {
                return res.status(400).json({ error: emailValidation.error });
            }
        }

        // Validar teléfono si se proporciona
        if (customer_phone) {
            const phoneValidation = validatePhone(customer_phone);
            if (!phoneValidation.valid) {
                return res.status(400).json({ error: phoneValidation.error });
            }
        }

        // Obtener información del paquete
        const { data: packageData, error: pkgError } = await supabase
            .from('packages')
            .select('package_price, active')
            .eq('id', package_id)
            .single();

        if (pkgError || !packageData) {
            return res.status(404).json({ error: 'Paquete no encontrado' });
        }

        if (!packageData.active) {
            return res.status(400).json({ error: 'Paquete no disponible' });
        }

        // Upload de recibo si existe
        let receipt_filename = null;
        if (req.file) {
            const fileTypeValidation = validateFileType(req.file.mimetype);
            if (!fileTypeValidation.valid) {
                return res.status(400).json({ error: fileTypeValidation.error });
            }

            const safeName = sanitizeFilename(req.file.originalname);
            receipt_filename = `${Date.now()}-${safeName}`;

            await uploadFile('receipts', receipt_filename, req.file.buffer, req.file.mimetype);
        }

        // Calcular total
        const total_amount = packageData.package_price * parseInt(ticket_quantity);

        // Crear venta
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert([{
                sale_type: 'package',
                package_id: parseInt(package_id),
                customer_name: customer_name.trim(),
                customer_phone: customer_phone?.trim() || null,
                customer_email: customer_email?.trim() || null,
                ticket_quantity: parseInt(ticket_quantity),
                unit_price: packageData.package_price,
                total_amount,
                team_leader: team_leader?.trim() || null,
                rrpp_name: rrpp_name?.trim() || null,
                payment_method,
                payment_status: 'pendiente',
                city: city?.trim() || null,
                receipt_filename,
                tickets_delivered: false
            }])
            .select()
            .single();

        if (saleError) throw saleError;

        res.status(201).json({
            success: true,
            sale: {
                ...sale,
                receipt_url: receipt_filename ? getPublicUrl('receipts', receipt_filename) : null
            },
            message: 'Venta de paquete registrada exitosamente'
        });

    } catch (error) {
        console.error('Error creando venta de paquete:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// POST /api/sales/individual - Crear venta individual
// ============================================================================

router.post('/individual', upload.single('receipt'), async (req, res) => {
    try {
        const {
            event_ids,  // Array de IDs de eventos
            customer_name,
            customer_phone,
            customer_email,
            ticket_quantity,
            city,
            team_leader,
            rrpp_name,
            payment_method = 'transferencia'
        } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, [
            'event_ids',
            'customer_name',
            'ticket_quantity'
        ]);

        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Parsear event_ids si viene como string
        let eventIdsArray = typeof event_ids === 'string'
            ? JSON.parse(event_ids)
            : event_ids;

        if (!Array.isArray(eventIdsArray) || eventIdsArray.length === 0) {
            return res.status(400).json({ error: 'Debe seleccionar al menos un evento' });
        }

        // Validar cantidad
        const quantityValidation = validatePositiveNumber(ticket_quantity, 'Cantidad de tickets');
        if (!quantityValidation.valid) {
            return res.status(400).json({ error: quantityValidation.error });
        }

        // Validar email
        if (customer_email) {
            const emailValidation = validateEmail(customer_email);
            if (!emailValidation.valid) {
                return res.status(400).json({ error: emailValidation.error });
            }
        }

        // Validar teléfono
        if (customer_phone) {
            const phoneValidation = validatePhone(customer_phone);
            if (!phoneValidation.valid) {
                return res.status(400).json({ error: phoneValidation.error });
            }
        }

        // Obtener información de los eventos
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, ticket_price, status')
            .in('id', eventIdsArray);

        if (eventsError) throw eventsError;

        if (events.length !== eventIdsArray.length) {
            return res.status(404).json({ error: 'Uno o más eventos no encontrados' });
        }

        // Verificar que todos los eventos estén activos
        const inactiveEvents = events.filter(e => e.status !== 'activo' && e.status !== 'planificacion');
        if (inactiveEvents.length > 0) {
            return res.status(400).json({ error: 'Uno o más eventos no están disponibles' });
        }

        // Calcular precio total (suma de precios de todos los eventos)
        const totalPrice = events.reduce((sum, e) => sum + parseFloat(e.ticket_price), 0);
        const total_amount = totalPrice * parseInt(ticket_quantity);

        // Upload de recibo
        let receipt_filename = null;
        if (req.file) {
            const fileTypeValidation = validateFileType(req.file.mimetype);
            if (!fileTypeValidation.valid) {
                return res.status(400).json({ error: fileTypeValidation.error });
            }

            const safeName = sanitizeFilename(req.file.originalname);
            receipt_filename = `${Date.now()}-${safeName}`;

            await uploadFile('receipts', receipt_filename, req.file.buffer, req.file.mimetype);
        }

        // Crear venta
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert([{
                sale_type: 'individual',
                package_id: null,
                customer_name: customer_name.trim(),
                customer_phone: customer_phone?.trim() || null,
                customer_email: customer_email?.trim() || null,
                ticket_quantity: parseInt(ticket_quantity),
                unit_price: totalPrice / eventIdsArray.length,  // Precio promedio
                total_amount,
                team_leader: team_leader?.trim() || null,
                rrpp_name: rrpp_name?.trim() || null,
                payment_method,
                payment_status: 'pendiente',
                city: city?.trim() || null,
                receipt_filename,
                tickets_delivered: false
            }])
            .select()
            .single();

        if (saleError) throw saleError;

        // Crear relaciones sale_events
        const saleEvents = eventIdsArray.map(eventId => ({
            sale_id: sale.id,
            event_id: parseInt(eventId)
        }));

        const { error: relError } = await supabase
            .from('sale_events')
            .insert(saleEvents);

        if (relError) throw relError;

        res.status(201).json({
            success: true,
            sale: {
                ...sale,
                receipt_url: receipt_filename ? getPublicUrl('receipts', receipt_filename) : null,
                events: events.map(e => ({ id: e.id, ticket_price: e.ticket_price }))
            },
            message: 'Venta individual registrada exitosamente'
        });

    } catch (error) {
        console.error('Error creando venta individual:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// PATCH /api/sales/:id/delivery - Actualizar estado de entrega
// ============================================================================

router.patch('/:id/delivery', async (req, res) => {
    try {
        const { id } = req.params;
        const { delivered } = req.body;

        if (typeof delivered !== 'boolean') {
            return res.status(400).json({ error: 'El campo "delivered" debe ser boolean' });
        }

        const { data, error } = await supabase
            .from('sales')
            .update({
                tickets_delivered: delivered,
                delivery_date: delivered ? new Date().toISOString() : null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        res.json({
            success: true,
            sale: data,
            message: delivered ? 'Entrega marcada' : 'Entrega desmarcada'
        });

    } catch (error) {
        console.error('Error actualizando entrega:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// PATCH /api/sales/:id/payment - Actualizar estado de pago
// ============================================================================

router.patch('/:id/payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        const validStatuses = ['pendiente', 'pagado', 'parcial', 'rechazado'];
        if (!validStatuses.includes(payment_status)) {
            return res.status(400).json({
                error: `Estado de pago inválido. Válidos: ${validStatuses.join(', ')}`
            });
        }

        const { data, error } = await supabase
            .from('sales')
            .update({ payment_status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        res.json({
            success: true,
            sale: data,
            message: `Estado de pago actualizado a: ${payment_status}`
        });

    } catch (error) {
        console.error('Error actualizando pago:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// DELETE /api/sales/:id - Eliminar venta
// ============================================================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener la venta para eliminar el recibo del storage
        const { data: sale } = await supabase
            .from('sales')
            .select('receipt_filename')
            .eq('id', id)
            .single();

        // Eliminar venta (cascade eliminará sale_events automáticamente)
        const { error } = await supabase
            .from('sales')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Eliminar recibo del storage si existe
        if (sale?.receipt_filename) {
            await supabase.storage
                .from('receipts')
                .remove([sale.receipt_filename]);
        }

        res.json({
            success: true,
            message: 'Venta eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando venta:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
