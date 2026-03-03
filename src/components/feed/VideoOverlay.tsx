'use client';

import Link from 'next/link';
import type { FeedItem } from '@/types';

interface VideoOverlayProps {
  item: FeedItem;
}

export function VideoOverlay({ item }: VideoOverlayProps) {
  return (
    <div className="w-[80%] pointer-events-auto">
      {/* Badge */}
      <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 mb-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
        <span className="text-xs font-bold text-primary tracking-wide uppercase">
          Leccion {item.lessonNumber} de {item.geniusTotalLessons}
        </span>
      </div>

      {/* Title */}
      <Link href={`/explorar/genio/${item.geniusId}`}>
        <h1 className="text-lg font-bold text-white mb-0.5 text-shadow leading-tight hover:text-primary transition-colors">
          {item.geniusName}
        </h1>
      </Link>

      {/* Field */}
      <h2 className="text-sm text-gray-300 font-medium mb-1 flex items-center gap-1 text-shadow">
        <span className="opacity-70">Disciplina</span> {item.geniusField}
        {item.geniusFieldVerified && (
          <span className="material-icons-round text-sm text-blue-400 ml-1">verified</span>
        )}
      </h2>

      {/* Description / Key Phrase — horizontal scroll */}
      <div className="text-sm text-white/90 leading-relaxed mb-1 text-shadow overflow-x-auto whitespace-nowrap no-scrollbar">
        <p>{item.keyPhrase}</p>
      </div>

      {/* Audio Ticker */}
      {item.audioTrackName && (
        <div className="flex items-center gap-2 mt-1 opacity-80">
          <span className="material-icons-round text-sm text-white">music_note</span>
          <div className="text-xs text-white overflow-hidden w-40 whitespace-nowrap">
            <span className="inline-block">{item.audioTrackName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
