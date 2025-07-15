-- Add 3D coordinate fields to galactic_systems table
ALTER TABLE public.galactic_systems
ADD COLUMN coordinate_x NUMERIC,
ADD COLUMN coordinate_y NUMERIC,
ADD COLUMN coordinate_z NUMERIC;

-- Add index for efficient 3D coordinate queries
CREATE INDEX idx_galactic_systems_coordinates ON public.galactic_systems (coordinate_x, coordinate_y, coordinate_z);

-- Add comment for documentation
COMMENT ON COLUMN public.galactic_systems.coordinate_x IS '3D X coordinate in light-years from galactic center';
COMMENT ON COLUMN public.galactic_systems.coordinate_y IS '3D Y coordinate in light-years from galactic center';
COMMENT ON COLUMN public.galactic_systems.coordinate_z IS '3D Z coordinate in light-years from galactic plane';