-- Sample/Seed Data for Fixed Assets
-- Run: npm run seed
-- Requires: schema and users already exist (run setup-db first)

-- Departments
INSERT INTO public.departments (name, code) VALUES
  ('IT Department', 'IT'),
  ('Human Resources', 'HR'),
  ('Finance', 'FIN'),
  ('Operations', 'OPS'),
  ('Marketing', 'MKT')
ON CONFLICT (code) DO NOTHING;

-- Asset Categories (with depreciation settings)
INSERT INTO public.asset_categories (name, code, useful_life_years, depreciation_method, residual_value) VALUES
  ('Computers & Laptops', 'COM', 3, 'straight_line', 0),
  ('Office Furniture', 'FUR', 5, 'straight_line', 500000),
  ('Vehicles', 'VEH', 5, 'declining_balance', 2000000),
  ('Machinery', 'MAC', 10, 'straight_line', 1000000),
  ('Office Equipment', 'EQP', 4, 'straight_line', 100000)
ON CONFLICT (code) DO NOTHING;

-- Assets (references departments and categories by code)
INSERT INTO public.assets (asset_code, name, serial_number, category_id, purchase_price, acquisition_date, department_id, custodian, location, status, notes, created_by) VALUES
  ('LAP-001', 'Dell Latitude 5520', 'DL5520-XYZ001', (SELECT id FROM public.asset_categories WHERE code = 'COM' LIMIT 1), 25000000, '2023-01-15', (SELECT id FROM public.departments WHERE code = 'IT' LIMIT 1), 'Nguyen Van A', 'Floor 2 - IT Room', 'active', 'Laptop for developer', 'superadmin@email.com'),
  ('LAP-002', 'HP EliteBook 840', 'HP840-ABC002', (SELECT id FROM public.asset_categories WHERE code = 'COM' LIMIT 1), 22000000, '2023-03-20', (SELECT id FROM public.departments WHERE code = 'IT' LIMIT 1), 'Tran Thi B', 'Floor 2 - IT Room', 'active', NULL, 'superadmin@email.com'),
  ('DSK-001', 'Office Desk 1.2m', 'DSK-1200-001', (SELECT id FROM public.asset_categories WHERE code = 'FUR' LIMIT 1), 3500000, '2022-06-01', (SELECT id FROM public.departments WHERE code = 'HR' LIMIT 1), NULL, 'Floor 1 - HR Office', 'active', NULL, 'superadmin@email.com'),
  ('DSK-002', 'Office Desk 1.4m', 'DSK-1400-002', (SELECT id FROM public.asset_categories WHERE code = 'FUR' LIMIT 1), 4200000, '2022-06-01', (SELECT id FROM public.departments WHERE code = 'FIN' LIMIT 1), NULL, 'Floor 1 - Finance', 'active', NULL, 'superadmin@email.com'),
  ('PRJ-001', 'Epson Projector EB-X06', 'EPN-X06-001', (SELECT id FROM public.asset_categories WHERE code = 'EQP' LIMIT 1), 15000000, '2023-02-10', (SELECT id FROM public.departments WHERE code = 'OPS' LIMIT 1), 'Le Van C', 'Meeting Room A', 'active', 'Conference projector', 'superadmin@email.com'),
  ('AC-001', 'LG Air Conditioner 2HP', 'LG-2HP-001', (SELECT id FROM public.asset_categories WHERE code = 'EQP' LIMIT 1), 12000000, '2021-08-15', (SELECT id FROM public.departments WHERE code = 'IT' LIMIT 1), NULL, 'Server Room', 'maintenance', NULL, 'superadmin@email.com'),
  ('PC-001', 'Desktop Dell OptiPlex', 'DOP-7020-001', (SELECT id FROM public.asset_categories WHERE code = 'COM' LIMIT 1), 18000000, '2022-11-01', (SELECT id FROM public.departments WHERE code = 'MKT' LIMIT 1), 'Pham Van D', 'Floor 3 - Marketing', 'active', NULL, 'superadmin@email.com'),
  ('CHR-001', 'Ergonomic Office Chair', 'CHR-ERG-001', (SELECT id FROM public.asset_categories WHERE code = 'FUR' LIMIT 1), 2500000, '2023-04-05', (SELECT id FROM public.departments WHERE code = 'IT' LIMIT 1), NULL, 'Floor 2', 'active', NULL, 'superadmin@email.com'),
  ('OLD-001', 'Old Desktop PC', 'OLD-PC-001', (SELECT id FROM public.asset_categories WHERE code = 'COM' LIMIT 1), 8000000, '2019-05-20', (SELECT id FROM public.departments WHERE code = 'IT' LIMIT 1), NULL, 'Storage', 'disposed', 'Obsolete - replaced', 'superadmin@email.com')
ON CONFLICT (asset_code) DO NOTHING;

-- Update disposed asset with disposal details
UPDATE public.assets SET
  disposal_date = '2024-01-15',
  disposal_reason = 'Obsolete - replaced with new equipment',
  disposal_value = 500000
WHERE asset_code = 'OLD-001' AND status = 'disposed';

-- Asset Transfers
INSERT INTO public.asset_transfers (asset_id, from_dept_id, to_dept_id, reason, transferred_by) VALUES
  ((SELECT id FROM public.assets WHERE asset_code = 'LAP-001' LIMIT 1), (SELECT id FROM public.departments WHERE code = 'IT' LIMIT 1), (SELECT id FROM public.departments WHERE code = 'OPS' LIMIT 1), 'Reallocation for project', 'superadmin@email.com'),
  ((SELECT id FROM public.assets WHERE asset_code = 'LAP-001' LIMIT 1), (SELECT id FROM public.departments WHERE code = 'OPS' LIMIT 1), (SELECT id FROM public.departments WHERE code = 'IT' LIMIT 1), 'Project completed - return to IT', 'superadmin@email.com');

-- Asset Maintenance
INSERT INTO public.asset_maintenance (asset_id, maintenance_date, description, cost, performed_by) VALUES
  ((SELECT id FROM public.assets WHERE asset_code = 'AC-001' LIMIT 1), '2024-06-01', 'Annual cleaning and gas refill', 1500000, 'HVAC Service Co'),
  ((SELECT id FROM public.assets WHERE asset_code = 'LAP-002' LIMIT 1), '2024-03-15', 'Battery replacement', 800000, 'HP Authorized Service'),
  ((SELECT id FROM public.assets WHERE asset_code = 'AC-001' LIMIT 1), '2023-06-10', 'Routine maintenance', 1200000, 'HVAC Service Co');

-- Depreciation Calculation Run
INSERT INTO public.depreciation_calculation_runs (period_start, period_end, reference_number, revaluate, created_by) VALUES
  ('2024-01-01', '2024-12-31', 'DEP-2024-01', false, 'superadmin@email.com');

-- Depreciation Records (sample for a few assets)
INSERT INTO public.depreciation_records (asset_id, calculation_run_id, period_start, period_end, amount) VALUES
  ((SELECT id FROM public.assets WHERE asset_code = 'LAP-001' LIMIT 1), (SELECT id FROM public.depreciation_calculation_runs ORDER BY id DESC LIMIT 1), '2024-01-01', '2024-01-31', 694444.44),
  ((SELECT id FROM public.assets WHERE asset_code = 'LAP-001' LIMIT 1), (SELECT id FROM public.depreciation_calculation_runs ORDER BY id DESC LIMIT 1), '2024-02-01', '2024-02-29', 694444.44),
  ((SELECT id FROM public.assets WHERE asset_code = 'DSK-001' LIMIT 1), (SELECT id FROM public.depreciation_calculation_runs ORDER BY id DESC LIMIT 1), '2024-01-01', '2024-01-31', 50000.00),
  ((SELECT id FROM public.assets WHERE asset_code = 'PRJ-001' LIMIT 1), (SELECT id FROM public.depreciation_calculation_runs ORDER BY id DESC LIMIT 1), '2024-01-01', '2024-01-31', 310416.67);
