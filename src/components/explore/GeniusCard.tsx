'use client';

import Link from 'next/link';
import type { Genius } from '@/types';

interface GeniusCardProps {
  genius: Genius;
  rank?: number;
}

export function GeniusCard({ genius, rank }: GeniusCardProps) {
  return (
    <Link
      href={`/explorar/genio/${genius.id}`}
      className="flex items-center gap-4 p-3 rounded-xl bg-surface-dark/40 border border-white/5 hover:border-white/10 transition-all active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="w-16 h-20 rounded-lg overflow-hidden bg-surface-dark flex-shrink-0 relative">
        {genius.portraitUrl ? (
          <img alt={genius.title} className="w-full h-full object-cover" src={genius.portraitUrl} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-icons-round text-2xl text-gray-600">school</span>
          </div>
        )}
        {rank !== undefined && (
          <div className="absolute top-1 left-1 bg-primary/90 text-white text-[8px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {rank}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{genius.title}</p>
        <p className="text-xs text-gray-400 truncate">{genius.field}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <span className="material-icons-round text-xs text-cyan-400">rocket_launch</span>
            <span className="text-[10px] text-gray-400">{genius.totalInspired}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons-round text-xs text-primary">school</span>
            <span className="text-[10px] text-gray-400">{genius.totalLessons} lecciones</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons-round text-xs text-yellow-300">star</span>
            <span className="text-[10px] text-gray-400">{genius.totalGenius}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
