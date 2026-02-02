-- Fixed Assets Software - Database Schema
-- Run this after creating the database

-- Enable UUID extension (optional, for future use)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL
);

-- Asset Categories
CREATE TABLE IF NOT EXISTS public.asset_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  useful_life_years INTEGER DEFAULT 5,
  depreciation_method TEXT DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance')),
  residual_value DECIMAL(15, 2) DEFAULT 0
);

-- Assets
CREATE TABLE IF NOT EXISTS public.assets (
  id SERIAL PRIMARY KEY,
  asset_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  serial_number TEXT,
  category_id INTEGER REFERENCES public.asset_categories(id) ON DELETE SET NULL,
  purchase_price DECIMAL(15, 2) DEFAULT 0,
  acquisition_date DATE,
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  custodian TEXT,
  location TEXT,
  warranty_expiry DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'transferred', 'disposed')),
  image TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  disposal_date DATE,
  disposal_reason TEXT,
  disposal_value DECIMAL(15, 2)
);

-- Asset Transfers
CREATE TABLE IF NOT EXISTS public.asset_transfers (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  from_dept_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  to_dept_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  reason TEXT,
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  transferred_by TEXT
);

-- Asset Maintenance
CREATE TABLE IF NOT EXISTS public.asset_maintenance (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  description TEXT,
  cost DECIMAL(15, 2) DEFAULT 0,
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Depreciation Calculation Runs (for Calculation History)
CREATE TABLE IF NOT EXISTS public.depreciation_calculation_runs (
  id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  reference_number TEXT,
  revaluate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Depreciation Records
CREATE TABLE IF NOT EXISTS public.depreciation_records (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  calculation_run_id INTEGER REFERENCES public.depreciation_calculation_runs(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users (for authentication - kept from original)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Log (for activity tracking - kept from original)
CREATE TABLE IF NOT EXISTS public.log (
  idlog SERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usr TEXT,
  method TEXT,
  endpoint TEXT,
  status_code TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON public.assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_department_id ON public.assets(department_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset_id ON public.asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset_id ON public.asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_records_asset_id ON public.depreciation_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_records_calculation_run ON public.depreciation_records(calculation_run_id);
