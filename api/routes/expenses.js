/**
 * Rutas de API - Gastos
 * Maneja el registro y seguimiento de gastos
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase, STORAGE_BUCKETS, getPublicUrl, uploadFile } = require('../utils/supabase');
const {
    validateRequired,
    validatePositiveNumber,
    validateString,
    sanitizeFilename,
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
// GET /api/expenses - Listar todos los gastos
// ============================================================================

router.get('/', async (req, res) => {
    try {
        const { category_id, status, event_id, limit = 100 } = req.query;

        let query = supabase
            .from('expenses')
            .select(`
                *,
                category:expense_categories(category_name, icon),
                subcategory:expense_subcategories(subcategory_name),
                event:events(event_name, event_date)
            `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        // Filtros opcionales
        if (category_id) query = query.eq('category_id', category_id);
        if (status) query = query.eq('status', status);
        if (event_id) query = query.eq('event_id', event_id);

        const { data, error } = await query;

        if (error) throw error;

        // Agregar URLs públicas de recibos
        const expensesWithUrls = data.map(expense => ({
            ...expense,
            receipt_url: expense.receipt_filename
                ? getPublicUrl('expense-receipts', expense.receipt_filename)
                : null
        }));

        res.json(expensesWithUrls);
    } catch (error) {
        console.error('Error obteniendo gastos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/expenses/stats - Estadísticas de gastos
// ============================================================================

router.get('/stats', async (req, res) => {
    try {
        // Total de gastos
        const { data: allExpenses, error: expensesError } = await supabase
            .from('expenses')
            .select(`
                amount, 
                status, 
                category:expense_categories(category_name)
            `);

        if (expensesError) throw expensesError;

        // Gastos por categoría
        const { data: categories, error: categoriesError } = await supabase
            .from('expense_categories')
            .select('id, category_name')
            .order('sort_order');

        if (categoriesError) throw categoriesError;

        const stats = {
            total_expenses: allExpenses.length,
            
            // Por estado
            approved_amount: allExpenses
                .filter(e => e.status === 'aprobado')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0),
            pending_amount: allExpenses
                .filter(e => e.status === 'pendiente')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0),
            rejected_amount: allExpenses
                .filter(e => e.status === 'rechazado')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0),

            // Conteos por estado
            approved_count: allExpenses.filter(e => e.status === 'aprobado').length,
            pending_count: allExpenses.filter(e => e.status === 'pendiente').length,
            rejected_count: allExpenses.filter(e => e.status === 'rechazado').length,

            // Por categoría
            by_category: categories.map(cat => {
                const categoryExpenses = allExpenses.filter(e => 
                    e.category?.category_name === cat.category_name
                );
                return {
                    category_name: cat.category_name,
                    total_amount: categoryExpenses
                        .filter(e => e.status === 'aprobado')
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0),
                    count: categoryExpenses.length
                };
            })
        };

        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas de gastos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/expenses/categories - Obtener categorías y subcategorías
// ============================================================================

router.get('/categories', async (req, res) => {
    try {
        const { data: categories, error } = await supabase
            .from('expense_categories')
            .select(`
                *,
                subcategories:expense_subcategories(*)
            `)
            .order('sort_order');

        if (error) throw error;

        res.json(categories);
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// POST /api/expenses - Crear nuevo gasto
// ============================================================================

router.post('/', upload.single('receipt'), async (req, res) => {
    try {
        const {
            event_id,
            category_id,
            subcategory_id,
            description,
            amount,
            quantity = 1,
            vendor_name,
            invoice_number,
            expense_date
        } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, [
            'category_id',
            'subcategory_id',
            'description',
            'amount'
        ]);

        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Validar descripción
        const descValidation = validateString(description, 'Descripción', 3, 500);
        if (!descValidation.valid) {
            return res.status(400).json({ error: descValidation.error });
        }

        // Validar cantidad y monto
        const amountValidation = validatePositiveNumber(amount, 'Monto');
        if (!amountValidation.valid) {
            return res.status(400).json({ error: amountValidation.error });
        }

        const quantityValidation = validatePositiveNumber(quantity, 'Cantidad');
        if (!quantityValidation.valid) {
            return res.status(400).json({ error: quantityValidation.error });
        }

        // Verificar que la categoría existe
        const { data: category, error: catError } = await supabase
            .from('expense_categories')
            .select('id')
            .eq('id', category_id)
            .single();

        if (catError || !category) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Verificar que la subcategoría existe y pertenece a la categoría
        const { data: subcategory, error: subError } = await supabase
            .from('expense_subcategories')
            .select('id, category_id')
            .eq('id', subcategory_id)
            .single();

        if (subError || !subcategory) {
            return res.status(404).json({ error: 'Subcategoría no encontrada' });
        }

        if (subcategory.category_id !== parseInt(category_id)) {
            return res.status(400).json({ error: 'Subcategoría no pertenece a la categoría seleccionada' });
        }

        // Verificar evento si se proporciona
        if (event_id) {
            const { data: event, error: eventError } = await supabase
                .from('events')
                .select('id')
                .eq('id', event_id)
                .single();

            if (eventError || !event) {
                return res.status(404).json({ error: 'Evento no encontrado' });
            }
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

            await uploadFile(STORAGE_BUCKETS.RECEIPTS, receipt_filename, req.file.buffer, req.file.mimetype);
        }

        // Calcular precio unitario
        const totalAmount = parseFloat(amount);
        const qty = parseInt(quantity);
        const unit_price = totalAmount / qty;

        // Crear gasto
        const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .insert([{
                event_id: event_id ? parseInt(event_id) : null,
                category_id: parseInt(category_id),
                subcategory_id: parseInt(subcategory_id),
                description: description.trim(),
                amount: totalAmount,
                quantity: qty,
                unit_price,
                vendor_name: vendor_name?.trim() || null,
                invoice_number: invoice_number?.trim() || null,
                receipt_filename,
                status: 'pendiente',
                expense_date: expense_date || new Date().toISOString().split('T')[0]
            }])
            .select(`
                *,
                category:expense_categories(category_name),
                subcategory:expense_subcategories(subcategory_name),
                event:events(event_name)
            `)
            .single();

        if (expenseError) throw expenseError;

        res.status(201).json({
            success: true,
            expense: {
                ...expense,
                receipt_url: receipt_filename ? getPublicUrl('expense-receipts', receipt_filename) : null
            },
            message: 'Gasto registrado exitosamente'
        });

    } catch (error) {
        console.error('Error creando gasto:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// PATCH /api/expenses/:id/status - Actualizar estado del gasto
// ============================================================================

router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pendiente', 'aprobado', 'rechazado'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Estado inválido. Válidos: ${validStatuses.join(', ')}`
            });
        }

        const updateData = { status };
        
        // Si se aprueba, agregar fecha de pago
        if (status === 'aprobado') {
            updateData.payment_date = new Date().toISOString().split('T')[0];
        }

        const { data, error } = await supabase
            .from('expenses')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                category:expense_categories(category_name),
                subcategory:expense_subcategories(subcategory_name)
            `)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        res.json({
            success: true,
            expense: data,
            message: `Gasto ${status}`
        });

    } catch (error) {
        console.error('Error actualizando estado de gasto:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// DELETE /api/expenses/:id - Eliminar gasto
// ============================================================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener el gasto para eliminar el recibo del storage
        const { data: expense } = await supabase
            .from('expenses')
            .select('receipt_filename')
            .eq('id', id)
            .single();

        // Eliminar gasto
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Eliminar recibo del storage si existe
        if (expense?.receipt_filename) {
            await supabase.storage
                .from('expense-receipts')
                .remove([expense.receipt_filename]);
        }

        res.json({
            success: true,
            message: 'Gasto eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando gasto:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;