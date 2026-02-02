-- Migration 001: Add residual_value, disposal columns, depreciation calculation runs
-- Run: npm run migrate

-- Add residual_value to asset_categories (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='asset_categories' AND column_name='residual_value') THEN
    ALTER TABLE public.asset_categories ADD COLUMN residual_value DECIMAL(15, 2) DEFAULT 0;
  END IF;
END $$;

-- Add disposal columns to assets (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assets' AND column_name='disposal_date') THEN
    ALTER TABLE public.assets ADD COLUMN disposal_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assets' AND column_name='disposal_reason') THEN
    ALTER TABLE public.assets ADD COLUMN disposal_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assets' AND column_name='disposal_value') THEN
    ALTER TABLE public.assets ADD COLUMN disposal_value DECIMAL(15, 2);
  END IF;
END $$;

-- Depreciation calculation runs (for Calculation History)
CREATE TABLE IF NOT EXISTS public.depreciation_calculation_runs (
  id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  reference_number TEXT,
  revaluate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Add calculation_run_id to depreciation_records (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='depreciation_records' AND column_name='calculation_run_id') THEN
    ALTER TABLE public.depreciation_records ADD COLUMN calculation_run_id INTEGER REFERENCES public.depreciation_calculation_runs(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_depreciation_records_calculation_run ON public.depreciation_records(calculation_run_id);
