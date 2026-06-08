-- Procedimiento de Actualización: actualizar_comunidad
-- Modifica los datos de una comunidad existente y retorna el registro actualizado con su categoría asociada

CREATE OR REPLACE FUNCTION actualizar_comunidad(
    p_id_comunidad UUID,
    p_nombre TEXT,
    p_slug TEXT,
    p_activa BOOLEAN,
    p_descripcion TEXT,
    p_portada_url TEXT,
    p_id_categoria_comunidad UUID
) RETURNS TABLE (
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
    UPDATE comunidad
    SET nombre = p_nombre,
        slug = p_slug,
        activa = p_activa,
        descripcion = p_descripcion,
        portada_url = p_portada_url,
        id_categoria_comunidad = p_id_categoria_comunidad
    WHERE comunidad.id_comunidad = p_id_comunidad;

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
    WHERE c.id_comunidad = p_id_comunidad;
END;
$$ LANGUAGE plpgsql;
