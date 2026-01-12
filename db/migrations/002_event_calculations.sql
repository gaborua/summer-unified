-- ============================================================================
-- MIGRACIÓN SIMPLIFICADA: event_calculations
-- ============================================================================
-- Compatible con PostgreSQL - Sin errores

-- Limpiar si existe
DROP TABLE IF EXISTS event_calculations CASCADE;

-- Crear tabla
CREATE TABLE event_calculations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  calculation_name VARCHAR(200) NOT NULL,
  total_capacity INTEGER,
  expected_attendance INTEGER,
  ticket_price_general DECIMAL(10,2),
  ticket_price_vip DECIMAL(10,2),
  venue_cost DECIMAL(10,2) DEFAULT 0,
  production_cost DECIMAL(10,2) DEFAULT 0,
  marketing_cost DECIMAL(10,2) DEFAULT 0,
  staff_cost DECIMAL(10,2) DEFAULT 0,
  other_costs DECIMAL(10,2) DEFAULT 0,
  total_costs DECIMAL(10,2) DEFAULT 0,
  projected_revenue DECIMAL(10,2) DEFAULT 0,
  projected_profit DECIMAL(10,2) DEFAULT 0,
  break_even_tickets INTEGER DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  scenario_type VARCHAR(50) DEFAULT 'realista',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_event_calculations_event ON event_calculations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_calculations_scenario ON event_calculations(scenario_type);
CREATE INDEX IF NOT EXISTS idx_event_calculations_created_at ON event_calculations(created_at DESC);

-- Constraint único (simplificado)
ALTER TABLE event_calculations 
  ADD CONSTRAINT uq_event_calc UNIQUE (event_id, calculation_name);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_event_calculations_updated_at ON event_calculations;
CREATE TRIGGER update_event_calculations_updated_at 
  BEFORE UPDATE ON event_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo (simplificados)
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
  (1, 'Proyección Año Nuevo Tarija - Realista', 500, 400, 200.00, 300.00, 15000, 25000, 8000, 12000, 5000, 'realista'),
  (1, 'Proyección Año Nuevo Tarija - Optimista', 500, 480, 200.00, 300.00, 15000, 25000, 8000, 12000, 5000, 'optimista'),
  (1, 'Proyección Año Nuevo Tarija - Pesimista', 500, 300, 200.00, 300.00, 15000, 25000, 8000, 12000, 5000, 'pesimista')
ON CONFLICT (event_id, calculation_name) DO NOTHING;

-- Actualizar cálculos (simplificado)
UPDATE event_calculations 
SET 
  total_costs = venue_cost + production_cost + marketing_cost + staff_cost + other_costs,
  projected_revenue = (expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip),
  projected_profit = (
    (expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip)
  ) - (venue_cost + production_cost + marketing_cost + staff_cost + other_costs),
  break_even_tickets = CASE 
    WHEN (ticket_price_general * 0.8 + ticket_price_vip * 0.2) > 0 
    THEN CEIL((venue_cost + production_cost + marketing_cost + staff_cost + other_costs) / (ticket_price_general * 0.8 + ticket_price_vip * 0.2))
    ELSE 0 
  END,
  profit_margin = CASE 
    WHEN ((expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip)) > 0
    THEN (
      ((expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip)) - 
      (venue_cost + production_cost + marketing_cost + staff_cost + other_costs)
    ) / ((expected_attendance * 0.8 * ticket_price_general) + (expected_attendance * 0.2 * ticket_price_vip)) * 100
    ELSE 0
  END
WHERE calculation_name LIKE 'Proyección Año Nuevo Tarija%';

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla event_calculations creada exitosamente';
  RAISE NOTICE 'Total cálculos: %', (SELECT COUNT(*) FROM event_calculations);
END $$;