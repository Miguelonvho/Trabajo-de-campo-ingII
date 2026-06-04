import { comunidadService } from '@/features/comunidades/services/comunidadService';
import { planService } from '@/features/planes/services/planService';
import { notFound } from 'next/navigation';
import { IComunidad, IPlanComunidad } from '@repo/types';
import { CommunityVisitorView } from '@/features/comunidades/components/CommunityVisitorView';
import { CommunitySubscriberView } from '@/features/comunidades/components/CommunitySubscriberView';
import { CommunityAdminView } from '@/features/comunidades/components/CommunityAdminView';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ComunidadDetallePage({ params }: Props) {
  const { slug } = await params;
  
  let comunidad: IComunidad;
  let planesComunidad: IPlanComunidad[] = [];
  let rol: 'CREADOR' | 'SUSCRIPTOR' | null = null;

  try {
    comunidad = await comunidadService.getComunidadBySlug(slug);
    planesComunidad = await planService.getPlanesPorComunidad(comunidad.id_comunidad);
    
    // Consultar el rol del usuario autenticado en la comunidad
    const response = await comunidadService.getRolEnComunidad(slug);
    rol = response.rol;
  } catch (error) {
    console.error('Error al cargar detalle de comunidad:', error);
    return notFound();
  }

  // Bifurcación de Vistas en el Servidor (Server-Side Branching)
  if (rol === 'CREADOR') {
    return (
      <CommunityAdminView 
        comunidad={comunidad} 
        planesComunidad={planesComunidad} 
        slug={slug} 
      />
    );
  }

  if (rol === 'SUSCRIPTOR') {
    return (
      <CommunitySubscriberView 
        comunidad={comunidad} 
        planesComunidad={planesComunidad} 
        slug={slug} 
      />
    );
  }

  // Por defecto (Visitante / No Suscripto)
  return (
    <CommunityVisitorView 
      comunidad={comunidad} 
      planesComunidad={planesComunidad} 
      slug={slug} 
    />
  );
}
