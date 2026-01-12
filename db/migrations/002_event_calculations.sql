-- ============================================================================
-- MIGRACIÓN: Tabla event_calculations para el módulo de calculadora
-- ============================================================================

-- Crear tabla de cálculos/proyecciones de eventos
CREATE TABLE IF NOT EXISTS event_calculations (
  id SERIAL PRIMARY KEY,
  
  -- Relación con evento (opcional)
  event_id INTEGER REFERENCES events(id),
  
  -- Información básica
  calculation_name VARCHAR(200) NOT NULL,
  
  -- Capacidad y asistencia
  total_capacity INTEGER,
  expected_attendance INTEGER,
  
  -- Precios de tickets
  ticket_price_general DECIMAL(10,2),
  ticket_price_vip DECIMAL(10,2),
  
  -- Categorías de costos
  venue_cost DECIMAL(10,2) DEFAULT 0,
  production_cost DECIMAL(10,2) DEFAULT 0,
  marketing_cost DECIMAL(10,2) DEFAULT 0,
  staff_cost DECIMAL(10,2) DEFAULT 0,
  other_costs DECIMAL(10,2) DEFAULT 0,
  total_costs DECIMAL(10,2) DEFAULT 0,
  
  -- Proyecciones calculadas
  projected_revenue DECIMAL(10,2) DEFAULT 0,
  projected_profit DECIMAL(10,2) DEFAULT 0,
  break_even_tickets INTEGER DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  
  -- Tipo de escenario
  scenario_type VARCHAR(50) DEFAULT 'realista',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_event_calculations_event ON event_calculations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_calculations_scenario ON event_calculations(scenario_type);
CREATE INDEX IF NOT EXISTS idx_event_calculations_created_at ON event_calculations(created_at DESC);

-- Comentarios
COMMENT ON TABLE event_calculations IS 'Proyecciones financieras y cálculos de eventos';
COMMENT ON COLUMN event_calculations.scenario_type IS 'Tipos: pesimista, realista, optimista';
COMMENT ON COLUMN event_calculations.profit_margin IS 'Margen de ganancia en porcentaje';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_event_calculations_updated_at ON event_calculations;
CREATE TRIGGER update_event_calculations_updated_at 
  BEFORE UPDATE ON event_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo
INSERT INTO event_calculations (
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
  scenario_type
) VALUES 
  (1, 'Proyección Año Nuevo Tarija - Escenario Realista', 500, 400, 200.00, 300.00, 15000, 25000, 8000, 12000, 5000, 'realista'),
  (1, 'Proyección Año Nuevo Tarija - Escenario Optimista', 500, 480, 200.00, 300.00, 15000, 25000, 8000, 12000, 5000, 'optimista'),
  (1, 'Proyección Año Nuevo Tarija - Escenario Pesimista', 500, 300, 200.00, 300.00, 15000, 25000, 8000, 12000, 5000, 'pesimista')
ON CONFLICT DO NOTHING;

-- Actualizar los costos totales y proyecciones en los datos de ejemplo
UPDATE event_calculations 
SET 
  total_costs = venue_cost + production_cost + marketing_cost + staff_cost + other_costs,
  projected_revenue = (expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip),
  projected_profit = ((expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip)) - (venue_cost + production_cost + marketing_cost + staff_cost + other_costs),
  break_even_tickets = CEIL((venue_cost + production_cost + marketing_cost + staff_cost + other_costs) / ((ticket_price_general * 0.8) + (ticket_price_vip * 0.2))),
  profit_margin = (
    ((expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip)) - 
    (venue_cost + production_cost + marketing_cost + staff_cost + other_costs)
  ) / ((expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip)) * 100
WHERE calculation_name LIKE 'Proyección Año Nuevo Tarija%';

RAISE NOTICE '✅ Tabla event_calculations creada exitosamente';