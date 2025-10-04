-- Create farms table
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  farm_name TEXT NOT NULL,
  farm_size NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own farms" 
ON public.farms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own farms" 
ON public.farms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farms" 
ON public.farms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farms" 
ON public.farms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_farms_updated_at
BEFORE UPDATE ON public.farms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add farm_id to game_sessions table
ALTER TABLE public.game_sessions 
ADD COLUMN farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL;