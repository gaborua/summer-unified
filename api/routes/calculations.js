/**
 * Rutas de API - Calculadora de Eventos
 * Maneja proyecciones financieras y análisis de eventos
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
// GET /api/calculations - Listar todos los cálculos
// ============================================================================

router.get('/', async (req, res) => {
    try {
        const { event_id, scenario_type, limit = 50 } = req.query;

        let query = supabase
            .from('event_calculations')
            .select(`
                *,
                event:events(event_name, event_date, city)
            `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        // Filtros opcionales
        if (event_id) query = query.eq('event_id', event_id);
        if (scenario_type) query = query.eq('scenario_type', scenario_type);

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error obteniendo cálculos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/calculations/:id - Obtener cálculo específico
// ============================================================================

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('event_calculations')
            .select(`
                *,
                event:events(event_name, event_date, city, venue_name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Cálculo no encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error obteniendo cálculo:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// POST /api/calculations - Crear nueva proyección
// ============================================================================

router.post('/', async (req, res) => {
    try {
        const {
            event_id,
            calculation_name,
            total_capacity,
            expected_attendance,
            ticket_price_general,
            ticket_price_vip,
            venue_cost,
            production_cost,
            marketing_cost,
            staff_cost,
            other_costs,
            scenario_type = 'realista'
        } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, [
            'calculation_name',
            'total_capacity',
            'expected_attendance',
            'ticket_price_general'
        ]);

        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Validar nombre
        const nameValidation = validateString(calculation_name, 'Nombre del cálculo', 3, 200);
        if (!nameValidation.valid) {
            return res.status(400).json({ error: nameValidation.error });
        }

        // Validar números positivos
        const fields = [
            { value: total_capacity, name: 'Capacidad total' },
            { value: expected_attendance, name: 'Asistencia esperada' },
            { value: ticket_price_general, name: 'Precio ticket general' }
        ];

        for (const field of fields) {
            const validation = validatePositiveNumber(field.value, field.name);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.error });
            }
        }

        // Validar que la asistencia no exceda la capacidad
        if (parseInt(expected_attendance) > parseInt(total_capacity)) {
            return res.status(400).json({ 
                error: 'La asistencia esperada no puede exceder la capacidad total' 
            });
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

        // Cálculos financieros
        const capacity = parseInt(total_capacity);
        const attendance = parseInt(expected_attendance);
        const priceGeneral = parseFloat(ticket_price_general);
        const priceVip = parseFloat(ticket_price_vip || 0);

        // Distribución por defecto: 80% general, 20% VIP
        const generalTickets = Math.round(attendance * 0.8);
        const vipTickets = attendance - generalTickets;

        // Ingresos
        const generalRevenue = generalTickets * priceGeneral;
        const vipRevenue = vipTickets * priceVip;
        const totalRevenue = generalRevenue + vipRevenue;

        // Costos
        const costs = {
            venue: parseFloat(venue_cost || 0),
            production: parseFloat(production_cost || 0),
            marketing: parseFloat(marketing_cost || 0),
            staff: parseFloat(staff_cost || 0),
            other: parseFloat(other_costs || 0)
        };

        const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

        // Análisis
        const projectedProfit = totalRevenue - totalCosts;
        const profitMargin = totalRevenue > 0 ? (projectedProfit / totalRevenue) * 100 : 0;

        // Punto de equilibrio
        const avgTicketPrice = totalRevenue / attendance;
        const breakEvenTickets = totalCosts > 0 ? Math.ceil(totalCosts / avgTicketPrice) : 0;

        // Crear cálculo
        const { data: calculation, error: calcError } = await supabase
            .from('event_calculations')
            .insert([{
                event_id: event_id ? parseInt(event_id) : null,
                calculation_name: calculation_name.trim(),
                total_capacity: capacity,
                expected_attendance: attendance,
                ticket_price_general: priceGeneral,
                ticket_price_vip: priceVip,
                venue_cost: costs.venue,
                production_cost: costs.production,
                marketing_cost: costs.marketing,
                staff_cost: costs.staff,
                other_costs: costs.other,
                total_costs: totalCosts,
                projected_revenue: totalRevenue,
                projected_profit: projectedProfit,
                break_even_tickets: breakEvenTickets,
                profit_margin: profitMargin,
                scenario_type
            }])
            .select(`
                *,
                event:events(event_name, event_date)
            `)
            .single();

        if (calcError) throw calcError;

        // Agregar detalles del cálculo
        const response = {
            ...calculation,
            calculation_details: {
                tickets_breakdown: {
                    general_tickets: generalTickets,
                    vip_tickets: vipTickets,
                    total_tickets: attendance
                },
                revenue_breakdown: {
                    general_revenue: generalRevenue,
                    vip_revenue: vipRevenue,
                    total_revenue: totalRevenue
                },
                costs_breakdown: costs,
                financial_analysis: {
                    total_costs: totalCosts,
                    projected_profit: projectedProfit,
                    profit_margin: profitMargin,
                    break_even_tickets: breakEvenTickets,
                    avg_ticket_price: avgTicketPrice
                }
            }
        };

        res.status(201).json({
            success: true,
            calculation: response,
            message: 'Proyección financiera creada exitosamente'
        });

    } catch (error) {
        console.error('Error creando cálculo:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// POST /api/calculations/compare - Comparar múltiples escenarios
// ============================================================================

router.post('/compare', async (req, res) => {
    try {
        const { event_id, scenarios } = req.body;

        if (!Array.isArray(scenarios) || scenarios.length < 2) {
            return res.status(400).json({ 
                error: 'Debe proporcionar al menos 2 escenarios para comparar' 
            });
        }

        const comparisons = [];

        for (const scenario of scenarios) {
            // Reutilizar la lógica de cálculo del endpoint POST
            const {
                scenario_name,
                expected_attendance,
                ticket_price_general,
                ticket_price_vip = 0,
                total_capacity = 1000
            } = scenario;

            const attendance = parseInt(expected_attendance);
            const priceGeneral = parseFloat(ticket_price_general);
            const priceVip = parseFloat(ticket_price_vip);

            const generalTickets = Math.round(attendance * 0.8);
            const vipTickets = attendance - generalTickets;

            const generalRevenue = generalTickets * priceGeneral;
            const vipRevenue = vipTickets * priceVip;
            const totalRevenue = generalRevenue + vipRevenue;

            comparisons.push({
                scenario_name,
                attendance,
                total_revenue: totalRevenue,
                revenue_per_person: totalRevenue / attendance,
                tickets_breakdown: {
                    general: generalTickets,
                    vip: vipTickets
                }
            });
        }

        // Encontrar el mejor escenario
        const bestScenario = comparisons.reduce((best, current) => 
            current.total_revenue > best.total_revenue ? current : best
        );

        res.json({
            success: true,
            comparisons,
            best_scenario: bestScenario,
            summary: {
                total_scenarios: comparisons.length,
                revenue_range: {
                    min: Math.min(...comparisons.map(s => s.total_revenue)),
                    max: Math.max(...comparisons.map(s => s.total_revenue))
                }
            }
        });

    } catch (error) {
        console.error('Error comparando escenarios:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// DELETE /api/calculations/:id - Eliminar cálculo
// ============================================================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('event_calculations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Cálculo eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando cálculo:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /api/calculations/stats/summary - Resumen de todas las proyecciones
// ============================================================================

router.get('/stats/summary', async (req, res) => {
    try {
        const { data: calculations, error } = await supabase
            .from('event_calculations')
            .select('projected_revenue, projected_profit, scenario_type, created_at');

        if (error) throw error;

        const stats = {
            total_calculations: calculations.length,
            by_scenario: {
                pesimista: calculations.filter(c => c.scenario_type === 'pesimista').length,
                realista: calculations.filter(c => c.scenario_type === 'realista').length,
                optimista: calculations.filter(c => c.scenario_type === 'optimista').length
            },
            financial_summary: {
                total_projected_revenue: calculations.reduce((sum, c) => sum + parseFloat(c.projected_revenue), 0),
                total_projected_profit: calculations.reduce((sum, c) => sum + parseFloat(c.projected_profit), 0),
                avg_projected_revenue: calculations.length > 0 
                    ? calculations.reduce((sum, c) => sum + parseFloat(c.projected_revenue), 0) / calculations.length 
                    : 0
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo resumen:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;