-- ============================================================================
-- MIGRACIÓN SIMPLIFICADA - SISTEMA UNIFICADO SUMMER FESTIVAL
-- ============================================================================
-- Compatible con PostgreSQL y herramientas de desarrollo
-- ============================================================================

-- ============================================================================
-- 1. LIMPIAR SI EXISTEN
-- ============================================================================
DROP TABLE IF EXISTS sale_events CASCADE;
DROP TABLE IF EXISTS package_events CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_subcategories CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- ============================================================================
-- 2. FUNCIÓN DE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TABLA: events
-- ============================================================================
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(200) NOT NULL,
  event_slug VARCHAR(200) UNIQUE NOT NULL,
  event_date DATE NOT NULL,
  event_type VARCHAR(50),
  city VARCHAR(100),
  venue_name VARCHAR(200),
  status VARCHAR(50) DEFAULT 'planificacion',
  capacity INTEGER,
  ticket_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- Trigger
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos
INSERT INTO events (event_name, event_slug, event_date, city, ticket_price, status) VALUES
  ('Año Nuevo 2026 - Tarija', 'ano-nuevo-2026-tarija', '2025-12-31', 'Tarija', 200.00, 'activo'),
  ('Año Nuevo 2026 - Santa Cruz', 'ano-nuevo-2026-santa-cruz', '2025-12-31', 'Santa Cruz', 200.00, 'activo'),
  ('Año Nuevo 2026 - Cochabamba', 'ano-nuevo-2026-cochabamba', '2025-12-31', 'Cochabamba', 200.00, 'activo'),
  ('Año Nuevo 2026 - La Paz', 'ano-nuevo-2026-la-paz', '2025-12-31', 'La Paz', 200.00, 'activo'),
  ('Año Nuevo 2026 - Sucre', 'ano-nuevo-2026-sucre', '2025-12-31', 'Sucre', 200.00, 'activo'),
  ('Carnaval 2026 - Tarija', 'carnaval-2026-tarija', '2026-02-15', 'Tarija', 180.00, 'activo'),
  ('Carnaval 2026 - Santa Cruz', 'carnaval-2026-santa-cruz', '2026-02-15', 'Santa Cruz', 180.00, 'activo'),
  ('Carnaval 2026 - Cochabamba', 'carnaval-2026-cochabamba', '2026-02-15', 'Cochabamba', 180.00, 'activo')
ON CONFLICT (event_slug) DO NOTHING;

-- ============================================================================
-- 4. TABLA: packages
-- ============================================================================
CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  package_name VARCHAR(200) NOT NULL,
  package_slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  package_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at 
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos
INSERT INTO packages (package_name, package_slug, package_price, discount_percent) VALUES
  ('Paquete Año Nuevo 2026', 'paquete-ano-nuevo-2026', 850.00, 15),
  ('Paquete Carnaval 2026', 'paquete-carnaval-2026', 450.00, 15)
ON CONFLICT (package_slug) DO NOTHING;

-- ============================================================================
-- 5. TABLA: package_events
-- ============================================================================
CREATE TABLE package_events (
  package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, event_id)
);

-- Datos - Relación manual más simple
INSERT INTO package_events (package_id, event_id) VALUES
  -- Paquete Año Nuevo incluye eventos 1-5
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
  -- Paquete Carnaval incluye eventos 6-8
  (2, 6), (2, 7), (2, 8);

-- ============================================================================
-- 6. TABLA: sales
-- ============================================================================
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  sale_type VARCHAR(50) NOT NULL, -- 'package' o 'individual'
  package_id INTEGER REFERENCES packages(id),
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(200),
  customer_id_number VARCHAR(50),
  ticket_quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  team_leader VARCHAR(200),
  rrpp_name VARCHAR(200),
  rrpp_commission DECIMAL(10,2),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'transferencia',
  payment_status VARCHAR(50) DEFAULT 'pendiente',
  receipt_filename VARCHAR(500),
  receipt_url TEXT,
  tickets_delivered BOOLEAN DEFAULT FALSE,
  packages_delivered BOOLEAN DEFAULT FALSE,
  delivery_date TIMESTAMP,
  delivery_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sales_sale_type ON sales(sale_type);
CREATE INDEX IF NOT EXISTS idx_sales_package_id ON sales(package_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at 
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. TABLA: sale_events
-- ============================================================================
CREATE TABLE sale_events (
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (sale_id, event_id)
);

-- ============================================================================
-- 8. TABLA: expense_categories
-- ============================================================================
CREATE TABLE expense_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  category_slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- Datos por lotes
INSERT INTO expense_categories (category_name, category_slug, icon, sort_order) VALUES
  ('Producción', 'produccion', '🎬', 1),
  ('Marketing y Publicidad', 'marketing', '📢', 2),
  ('Personal y Staff', 'personal', '👥', 3),
  ('Logística', 'logistica', '🚚', 4),
  ('Alquiler de Espacios', 'alquiler', '🏢', 5),
  ('Seguridad', 'seguridad', '🛡️', 6),
  ('Catering y Bebidas', 'catering', '🍽️', 7),
  ('Tecnología y Equipos', 'tecnologia', '💻', 8),
  ('Legal y Permisos', 'legal', '⚖️', 9),
  ('Transporte', 'transporte', '🚗', 10),
  ('Decoración', 'decoracion', '🎨', 11),
  ('Limpieza', 'limpieza', '🧹', 12),
  ('Otros', 'otros', '📦', 99);

-- ============================================================================
-- 9. TABLA: expense_subcategories
-- ============================================================================
CREATE TABLE expense_subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES expense_categories(id) ON DELETE CASCADE,
  subcategory_name VARCHAR(100) NOT NULL,
  subcategory_slug VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(category_id, subcategory_slug)
);

-- Subcategorías por lotes - Producción
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (1, 'Sistema de Sonido', 'sonido'),
  (1, 'Iluminación', 'iluminacion'),
  (1, 'DJ/Artistas', 'dj-artistas'),
  (1, 'Escenario', 'escenario'),
  (1, 'Efectos Especiales', 'efectos');

-- Marketing
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (2, 'Publicidad en Redes Sociales', 'redes-sociales'),
  (2, 'Flyers y Material Impreso', 'material-impreso'),
  (2, 'Publicidad en Radio', 'radio'),
  (2, 'Banners y Gigantografías', 'banners'),
  (2, 'Influencers/Promotores', 'influencers');

-- Personal
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (3, 'Coordinadores', 'coordinadores'),
  (3, 'Personal de Barra', 'personal-barra'),
  (3, 'Meseros', 'meseros'),
  (3, 'Cajeros', 'cajeros'),
  (3, 'Fotógrafos/Videógrafos', 'foto-video');

-- Logística
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (4, 'Transporte de Equipos', 'transporte-equipos'),
  (4, 'Almacenamiento', 'almacenamiento'),
  (4, 'Mobiliario (Mesas/Sillas)', 'mobiliario');

-- Alquiler
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (5, 'Alquiler de Local/Venue', 'local'),
  (5, 'Alquiler de Carpas', 'carpas'),
  (5, 'Generadores Eléctricos', 'generadores');

-- Seguridad
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (6, 'Personal de Seguridad', 'personal-seguridad'),
  (6, 'Vallas y Control de Acceso', 'vallas');

-- Catering
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (7, 'Bebidas Alcohólicas', 'bebidas-alcoholicas'),
  (7, 'Bebidas sin Alcohol', 'bebidas-sin-alcohol'),
  (7, 'Hielo', 'hielo'),
  (7, 'Comida/Snacks', 'comida'),
  (7, 'Vasos/Descartables', 'descartables');

-- Tecnología
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (8, 'Sistema de Ticketing', 'ticketing'),
  (8, 'Internet/WiFi', 'internet'),
  (8, 'Sistemas POS', 'pos');

-- Legal
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (9, 'Permisos Municipales', 'permisos'),
  (9, 'Seguros', 'seguros'),
  (9, 'Honorarios Legales', 'honorarios');

-- Transporte
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (10, 'Transporte de Staff', 'transporte-staff'),
  (10, 'Combustible', 'combustible'),
  (10, 'Taxis/Uber', 'taxis');

-- Decoración
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (11, 'Decoración Temática', 'decoracion-tematica'),
  (11, 'Globos y Ambientación', 'globos'),
  (11, 'Flores/Plantas', 'flores');

-- Limpieza
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (12, 'Personal de Limpieza', 'personal-limpieza'),
  (12, 'Materiales de Limpieza', 'materiales'),
  (12, 'Baños Portátiles', 'banos');

-- Otros
INSERT INTO expense_subcategories (category_id, subcategory_name, subcategory_slug) VALUES
  (13, 'Varios', 'varios'),
  (13, 'No Categorizado', 'no-categorizado');

-- ============================================================================
-- 10. TABLA: expenses (SIMPLIFICADA)
-- ============================================================================
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  category_id INTEGER NOT NULL REFERENCES expense_categories(id),
  subcategory_id INTEGER NOT NULL REFERENCES expense_subcategories(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BOB',
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  vendor_name VARCHAR(200),
  vendor_id VARCHAR(100),
  invoice_number VARCHAR(100),
  receipt_filename VARCHAR(500),
  receipt_url TEXT,
  status VARCHAR(50) DEFAULT 'pendiente',
  requested_by VARCHAR(200),
  approved_by VARCHAR(200),
  approved_at TIMESTAMP,
  payment_date DATE,
  payment_method VARCHAR(50),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_expenses_event ON expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_subcategory ON expenses(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración simplificada completada exitosamente';
  RAISE NOTICE 'Tablas creadas: events, packages, sales, expenses, categorías';
  RAISE NOTICE 'Total eventos: %', (SELECT COUNT(*) FROM events);
  RAISE NOTICE 'Total paquetes: %', (SELECT COUNT(*) FROM packages);
  RAISE NOTICE 'Total categorías gastos: %', (SELECT COUNT(*) FROM expense_categories);
  RAISE NOTICE 'Total subcategorías: %', (SELECT COUNT(*) FROM expense_subcategories);
END $$;