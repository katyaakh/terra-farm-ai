-- Create table for satellite data
CREATE TABLE public.satellite_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  ndvi NUMERIC,
  lst_kelvin NUMERIC,
  soil_moisture NUMERIC,
  data_source TEXT DEFAULT 'MODIS',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.satellite_data ENABLE ROW LEVEL SECURITY;

-- Create policies for satellite_data
CREATE POLICY "Users can view satellite data for their game sessions"
ON public.satellite_data
FOR SELECT
USING (
  game_session_id IN (
    SELECT id FROM public.game_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert satellite data for their game sessions"
ON public.satellite_data
FOR INSERT
WITH CHECK (
  game_session_id IN (
    SELECT id FROM public.game_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update satellite data for their game sessions"
ON public.satellite_data
FOR UPDATE
USING (
  game_session_id IN (
    SELECT id FROM public.game_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete satellite data for their game sessions"
ON public.satellite_data
FOR DELETE
USING (
  game_session_id IN (
    SELECT id FROM public.game_sessions WHERE user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_satellite_data_game_session ON public.satellite_data(game_session_id);
CREATE INDEX idx_satellite_data_date ON public.satellite_data(date);