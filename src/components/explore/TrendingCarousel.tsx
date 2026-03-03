'use client';

import Link from 'next/link';
import type { Genius } from '@/types';

interface TrendingCarouselProps {
  geniuses: Genius[];
}

export function TrendingCarousel({ geniuses }: TrendingCarouselProps) {
  if (geniuses.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4 px-1">
        Trending Ahora
      </h2>
      <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-5 px-5 snap-x">
        {geniuses.map((genius, index) => (
          <Link
            key={genius.id}
            href={`/explorar/genio/${genius.id}`}
            className="flex-none w-[140px] snap-center group cursor-pointer"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden relative mb-3 bg-surface-dark shadow-lg shadow-primary/5 border border-white/5 transition-transform duration-300 group-hover:-translate-y-1">
              {genius.portraitUrl ? (
                <img
                  alt={genius.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  src={genius.portraitUrl}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-icons-round text-4xl text-gray-600">school</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark to-transparent opacity-90" />

              {/* Ranking badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  #1 Top
                </div>
              )}

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                  {genius.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 truncate">{genius.field}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="material-icons-round text-[10px] text-primary">school</span>
                  <span className="text-[10px] text-gray-400">{genius.totalLessons} lecciones</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
