-- Add quality metadata columns to satellite_data table
ALTER TABLE public.satellite_data
ADD COLUMN IF NOT EXISTS is_interpolated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_age_days integer,
ADD COLUMN IF NOT EXISTS lst_celsius numeric,
ADD COLUMN IF NOT EXISTS quality_flags jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining the new columns
COMMENT ON COLUMN public.satellite_data.is_interpolated IS 'Whether this value was interpolated from nearby observations';
COMMENT ON COLUMN public.satellite_data.data_age_days IS 'Number of days since the actual satellite observation';
COMMENT ON COLUMN public.satellite_data.lst_celsius IS 'Land surface temperature in Celsius (derived from lst_kelvin)';
COMMENT ON COLUMN public.satellite_data.quality_flags IS 'JSON object containing quality metadata like cloud cover, fill flags, etc.';

-- Add index for faster queries by game_session_id and date
CREATE INDEX IF NOT EXISTS idx_satellite_data_session_date ON public.satellite_data(game_session_id, date);