'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  Users, 
  Info, 
  ArrowLeft, 
  Search, 
  Calendar,
  Layers,
  Heart,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { IComunidad, IPlanComunidad } from '@repo/types';

interface Props {
  comunidad: IComunidad;
  planesComunidad: IPlanComunidad[];
  slug: string;
}

type TabType = 'comunidad' | 'aulas' | 'miembros' | 'about';

export function CommunitySubscriberView({ comunidad, planesComunidad, slug }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('comunidad');

  // Datos mockeados realistas para dar una estética de alta gama
  const mockPosts = [
    {
      id: 1,
      author: {
        name: 'Carlos Mendoza',
        role: 'Creador de Contenido',
        avatar: 'CM',
        color: 'from-purple-500 to-indigo-500'
      },
      time: 'Hace 2 horas',
      title: '🚀 ¡Bienvenidos a la versión inicial de nuestra comunidad!',
      content: 'Estamos muy entusiasmados de tenerlos aquí. En esta sección de Comunidad (Feed) podrán interactuar, compartir sus dudas, debatir sobre los nuevos módulos de aprendizaje y conectar con otros suscriptores. ¡No duden en dejar su saludo en los comentarios!',
      likes: 12,
      commentsCount: 4,
    },
    {
      id: 2,
      author: {
        name: 'Ana Belén Ortiz',
        role: 'Suscriptor VIP',
        avatar: 'AO',
        color: 'from-rose-500 to-pink-500'
      },
      time: 'Hace 6 horas',
      title: '💡 Idea para el siguiente módulo del curso',
      content: 'Me encantaría que viéramos un módulo enfocado en despliegues automatizados (CI/CD) usando GitHub Actions y Docker. Creo que aportaría muchísimo valor al temario actual de las aulas.',
      likes: 8,
      commentsCount: 2,
    }
  ];

  const mockCourses = [
    {
      id: 1,
      title: 'Fundamentos de Desarrollo Moderno',
      desc: 'Aprendé las bases necesarias para construir aplicaciones web fluidas, seguras y escalables.',
      modules: 8,
      duration: '12 horas',
      progress: 35,
    },
    {
      id: 2,
      title: 'Arquitectura de Software Avanzada',
      desc: 'Dominá patrones de diseño, comunicación de microservicios y optimización de bases de datos.',
      modules: 12,
      duration: '24 horas',
      progress: 0,
    }
  ];

  const mockMembers = [
    { name: 'Miguel Angel', role: 'Creador', avatar: 'MA', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { name: 'Sofía Valenzuela', role: 'Suscriptor', avatar: 'SV', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Ana Belén Ortiz', role: 'Suscriptor', avatar: 'AO', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Lucas Pereyra', role: 'Suscriptor', avatar: 'LP', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Portada / Banner de la Comunidad */}
      <div 
        className="h-64 md:h-80 w-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/40 via-slate-900/60 to-slate-950/90" />
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Logo de la Comunidad */}
            <div 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-2xl ring-4 ring-white/10 shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}
            >
              {comunidad.nombre[0]}
            </div>
            
            {/* Info principal */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 backdrop-blur-md">
                Área de Miembros
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {comunidad.nombre}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base font-medium max-w-2xl">
                {comunidad.descripcion || 'Bienvenido a tu espacio exclusivo.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <nav className="flex space-x-1 md:space-x-4 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('comunidad')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'comunidad'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MessageSquare size={16} />
                Comunidad
              </button>
              <button
                onClick={() => setActiveTab('aulas')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'aulas'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BookOpen size={16} />
                Aulas
              </button>
              <button
                onClick={() => setActiveTab('miembros')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'miembros'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users size={16} />
                Miembros
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'about'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Info size={16} />
                Acerca de
              </button>
            </nav>

            <Link 
              href="/comunidades" 
              className="hidden sm:inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-wider"
            >
              <ArrowLeft size={14} />
              Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Tab 1: Feed / Comunidad */}
        {activeTab === 'comunidad' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feed List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Caja para crear post (Simulada) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                  U
                </div>
                <div className="flex-1 space-y-3">
                  <input 
                    type="text" 
                    placeholder="Escribe algo en la comunidad..." 
                    className="w-full bg-slate-50/50 border border-slate-100 focus:border-slate-200 focus:bg-white rounded-2xl px-5 py-3 text-sm font-medium outline-none transition-all"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Comparte tus ideas con los miembros</span>
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/10">
                      Publicar
                    </button>
                  </div>
                </div>
              </div>

              {mockPosts.map((post) => (
                <article key={post.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md hover:shadow-lg transition-all duration-300 space-y-6">
                  {/* Autor y fecha */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${post.author.color} text-white font-black flex items-center justify-center shadow-inner`}>
                        {post.author.avatar}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-950">{post.author.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{post.author.role}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{post.time}</span>
                  </div>

                  {/* Cuerpo del post */}
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="pt-4 border-t border-slate-50 flex items-center gap-6">
                    <button className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors text-xs font-bold">
                      <Heart size={16} />
                      {post.likes} Me gusta
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors text-xs font-bold">
                      <MessageSquare size={16} />
                      {post.commentsCount} Comentarios
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Reglas de Convivencia</h3>
                <ol className="text-slate-600 text-xs font-bold space-y-3 list-decimal pl-4">
                  <li>Respetar a todos los miembros de la comunidad.</li>
                  <li>Compartir contenido constructivo relacionado con el área.</li>
                  <li>Evitar el spam de enlaces o autopromoción sin permiso.</li>
                </ol>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Creada el</p>
                    <p className="text-xs font-black text-slate-950">
                      {new Date(comunidad.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cursos / Aulas */}
        {activeTab === 'aulas' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">Aulas de Aprendizaje</h2>
                <p className="text-slate-500 text-sm font-semibold">Accede a los cursos y recursos exclusivos de tu plan.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar clases..." 
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <BookOpen size={22} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-950 group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                        {course.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                      <span className="flex items-center gap-1.5"><Layers size={14} /> {course.modules} Módulos</span>
                      <span>Progreso: {course.progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-500" 
                        style={{ width: `${course.progress}%` }} 
                      />
                    </div>

                    <button className="w-full mt-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-900 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2">
                      Comenzar a aprender
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Miembros */}
        {activeTab === 'miembros' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Lista de Miembros</h2>
              <p className="text-slate-500 text-sm font-semibold">Conoce a las personas que impulsan esta comunidad.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
              <div className="divide-y divide-slate-100">
                {mockMembers.map((member, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center shadow-inner">
                        {member.avatar}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-950">{member.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">Miembro activo</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${member.badgeColor}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Acerca de */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md space-y-4">
                <h2 className="text-xl font-black text-slate-950 tracking-tight">Acerca de la comunidad</h2>
                <p className="text-slate-600 text-sm sm:text-base font-semibold leading-relaxed">
                  {comunidad.descripcion || 'Esta comunidad todavía no cuenta con una descripción detallada en su sección informativa.'}
                </p>
              </div>

              {planesComunidad.length > 0 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md space-y-6">
                  <h3 className="text-lg font-black text-slate-950 tracking-tight">Tus planes activos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {planesComunidad.filter(p => p.activa).map((plan) => (
                      <div key={plan.id_plan_comunidad} className="border border-slate-150 p-6 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="text-base font-black text-slate-950">{plan.titulo}</h4>
                          <p className="text-slate-500 text-xs font-medium mt-1">{plan.descripcion || 'Sin descripción'}</p>
                        </div>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-xl font-black text-slate-950">${Number(plan.precio).toFixed(0)}</span>
                          <span className="text-slate-400 text-xs font-bold">
                            / {plan.ciclo_pago?.tipo_frecuencia === 'months' ? 'mes' : 'día'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Detalles rápidos</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Estado</span>
                    <span className="font-black text-slate-950">Miembro Suscripto</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Categoría</span>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">General</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Planes Totales</span>
                    <span className="font-black text-slate-950">{planesComunidad.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
