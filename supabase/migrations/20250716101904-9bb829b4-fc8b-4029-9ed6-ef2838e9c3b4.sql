-- Actualizar coordenadas existentes para el nuevo escalado
-- Multiplicar las coordenadas actuales por 5000 para que coincidan con el rango de regiones (0-2400)

UPDATE galactic_systems 
SET coordinate_x = coordinate_x * 5000,
    coordinate_y = coordinate_y * 5000,
    coordinate_z = coordinate_z * 5000
WHERE coordinate_x IS NOT NULL 
  AND coordinate_y IS NOT NULL 
  AND coordinate_z IS NOT NULL;

-- Comentario: Esta migración corrige el escalado de coordenadas para que los sistemas
-- de la base de datos sean visibles en el mapa 3D usando la misma escala que las regiones galácticas