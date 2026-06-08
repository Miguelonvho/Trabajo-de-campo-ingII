-- Procedimiento de Consulta: obtener_comunidades_activas
-- Retorna el listado de comunidades activas ordenadas por fecha de creación descendente

CREATE OR REPLACE FUNCTION obtener_comunidades_activas()
RETURNS TABLE (
    id_comunidad UUID,
    nombre TEXT,
    slug TEXT,
    portada_url TEXT,
    activa BOOLEAN,
    fecha_creacion TIMESTAMPTZ,
    descripcion TEXT,
    id_categoria_comunidad UUID,
    categoria_descripcion TEXT,
    categoria_activa BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id_comunidad, 
        c.nombre, 
        c.slug, 
        c.portada_url, 
        c.activa, 
        c.fecha_creacion, 
        c.descripcion, 
        c.id_categoria_comunidad,
        cat.descripcion AS categoria_descripcion,
        cat.activa AS categoria_activa
    FROM comunidad c
    JOIN categoria_comunidad cat ON c.id_categoria_comunidad = cat.id_categoria_comunidad
    WHERE c.activa = true
    ORDER BY c.fecha_creacion DESC;
END;
$$ LANGUAGE plpgsql;
