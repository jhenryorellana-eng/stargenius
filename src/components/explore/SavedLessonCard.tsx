'use client';

import Link from 'next/link';
import type { Lesson } from '@/types';

interface SavedLessonCardProps {
  lesson: Lesson & { geniusName: string; geniusField: string };
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function SavedLessonCard({ lesson }: SavedLessonCardProps) {
  return (
    <Link
      href={`/?lessonId=${lesson.id}`}
      className="group flex gap-4 p-3 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="w-28 h-20 rounded-xl overflow-hidden relative flex-shrink-0">
        {lesson.videoThumbnailUrl ? (
          <img
            alt={lesson.title}
            src={lesson.videoThumbnailUrl}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-dark flex items-center justify-center">
            <span className="material-icons-round text-3xl text-gray-600">school</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
          <span className="material-icons-round text-white text-2xl">play_circle</span>
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1.5 py-0.5">
          <span className="text-white text-[9px] font-medium">
            {Math.floor((lesson.durationSeconds || 45) / 60)}:{String((lesson.durationSeconds || 45) % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-sm font-bold text-white line-clamp-2 leading-snug">
            {lesson.keyPhrase || lesson.title}
          </p>
          <p className="text-xs text-gray-400 mt-1 truncate">
            {lesson.geniusName} &bull; {lesson.geniusField}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <span className="material-icons-round text-xs text-gray-500">bookmark</span>
            <span className="text-[10px] font-medium text-gray-500">{formatCount(lesson.saveCount || 0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons-round text-xs text-gray-500">visibility</span>
            <span className="text-[10px] font-medium text-gray-500">{formatCount(lesson.viewCount || 0)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
