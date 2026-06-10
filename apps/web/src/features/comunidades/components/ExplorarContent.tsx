'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { CommunityCard } from './CommunityCard';
import { CategoryFilter } from './CategoryFilter';
import { IComunidad, ICategoriaComunidad } from '@repo/types';

interface ExplorarContentProps {
  comunidadesIniciales: IComunidad[];
  categorias: ICategoriaComunidad[];
  errorMsg?: string | null;
}

export function ExplorarContent({ comunidadesIniciales, categorias, errorMsg }: ExplorarContentProps) {
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Nombres de categorías para el filtro
  const categoryNames = ['Todas', ...categorias.map(c => c.descripcion)];

  // Lógica de filtrado reactiva
  const filteredCommunities = comunidadesIniciales.filter((c) => {
    // Si no es 'Todas', buscamos si el nombre de la categoría de la comunidad coincide con la seleccionada
    const categoriaDeComunidad = categorias.find(cat => cat.id_categoria_comunidad === c.id_categoria_comunidad);
    const matchesCategory = selectedCategory === 'Todas' || categoriaDeComunidad?.descripcion === selectedCategory;

    const matchesSearch = c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Barra de búsqueda y Filtros */}
      <div className="flex flex-col gap-8 mb-16">
        <div className="relative max-w-xl group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center group-focus-within:text-sky-500 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base outline-none transition-all focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400 font-medium"
          />
        </div>

        <CategoryFilter
          categories={categoryNames}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Grilla de comunidades */}
      {filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCommunities.map((community) => (
            <CommunityCard key={community.id_comunidad} community={community} href={`/comunidades/${community.slug}`} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-500 text-lg font-medium">
            {errorMsg || "No encontramos comunidades que coincidan con tu búsqueda."}
          </p>
          {!errorMsg && (
            <button
              onClick={() => { setSelectedCategory('Todas'); setSearchQuery(''); }}
              className="mt-6 text-sky-600 font-black hover:text-sky-700 transition-colors uppercase text-xs tracking-widest"
            >
              Ver todas las comunidades
            </button>
          )}
        </div>
      )}
    </>
  );
}
