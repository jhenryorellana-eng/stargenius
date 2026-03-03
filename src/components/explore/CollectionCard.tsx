'use client';

import type { Collection } from '@/types';

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-2xl border border-white/5 relative overflow-hidden transition-all active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, ${collection.gradientFrom}30, ${collection.gradientTo}15)`,
      }}
    >
      <h3 className="text-base font-bold text-white mb-1">{collection.name}</h3>
      {collection.description && (
        <p className="text-xs text-gray-300 mb-2 line-clamp-2">{collection.description}</p>
      )}
      <div className="flex items-center gap-1">
        <span className="material-icons-round text-xs" style={{ color: collection.gradientFrom }}>
          school
        </span>
        <span className="text-[10px] text-gray-400">
          {collection.geniusCount || 0} genios
        </span>
      </div>
    </button>
  );
}
