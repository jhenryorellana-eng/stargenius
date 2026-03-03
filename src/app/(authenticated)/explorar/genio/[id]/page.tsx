'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import type { Genius, Lesson, GeniusProgress } from '@/types';

export default function GeniusDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const [genius, setGenius] = useState<Genius | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<GeniusProgress | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [similarGeniuses, setSimilarGeniuses] = useState<Genius[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fromLessonId = searchParams.get('fromLesson');

  useEffect(() => {
    if (!token || !id) return;

    const fetchGeniusData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        const [geniusRes, lessonsRes] = await Promise.all([
          fetch(`/api/geniuses/${id}`, { headers }),
          fetch(`/api/geniuses/${id}/lessons`, { headers }),
        ]);

        if (geniusRes.ok) {
          const data = await geniusRes.json();
          setGenius(data.genius);
          setProgress(data.progress || null);
          setViewedIds(new Set(data.viewedLessonIds || []));
          setSimilarGeniuses(data.similarGeniuses || []);
        }

        if (lessonsRes.ok) {
          const data = await lessonsRes.json();
          setLessons(data.lessons || []);
        }
      } catch (err) {
        console.error('Error fetching genius:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeniusData();
  }, [token, id]);

  if (isLoading || !genius) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nextLesson = lessons.find((l) => !viewedIds.has(l.id));

  return (
    <div className="min-h-screen bg-background-dark pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-background-dark to-transparent">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full glass-icon flex items-center justify-center">
          <span className="material-icons-round text-white">arrow_back</span>
        </button>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full glass-icon flex items-center justify-center">
            <span className="material-icons-round text-white">share</span>
          </button>
          <button className="w-10 h-10 rounded-full glass-icon flex items-center justify-center">
            <span className="material-icons-round text-white">favorite_border</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[420px] overflow-hidden">
        {genius.portraitUrl ? (
          <img alt={genius.name} className="w-full h-full object-cover" src={genius.portraitUrl} />
        ) : (
          <div className="w-full h-full bg-surface-dark flex items-center justify-center">
            <span className="material-icons-round text-8xl text-gray-600">school</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/40 via-transparent to-background-dark" />

        {/* Genius info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-extrabold text-white mb-2 text-shadow-lg">{genius.name}</h1>
          <p className="text-base text-gray-300 mb-3 text-shadow">{genius.field}</p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="material-icons-round text-sm text-orange-400">rocket_launch</span>
              <span className="text-sm text-white font-semibold">{genius.totalInspired}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons-round text-sm text-yellow-300">star</span>
              <span className="text-sm text-gray-300">{genius.totalGenius}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons-round text-sm text-gray-400">schedule</span>
              <span className="text-sm text-gray-300">
                {Math.ceil((genius.totalDuration || genius.totalLessons * 45) / 60)} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="sticky top-0 z-30 px-5 py-3 glass-panel">
        <button
          onClick={() => {
            if (nextLesson) router.push(`/?lessonId=${nextLesson.id}`);
            else if (lessons.length > 0) router.push(`/?lessonId=${lessons[0].id}`);
          }}
          className="w-full btn-gradient py-4 rounded-xl flex items-center justify-center gap-3"
        >
          <span className="material-icons-round">play_arrow</span>
          <span className="font-bold">
            {progress && progress.progressPercent > 0
              ? `CONTINUAR`
              : 'EMPEZAR DESDE LECCION 1'}
          </span>
          {progress && (
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {progress.progressPercent}%
            </span>
          )}
        </button>
      </div>

      {/* Description */}
      {genius.description && (
        <div className="px-5 py-4">
          <p className="text-sm text-gray-300 leading-relaxed">{genius.description}</p>
        </div>
      )}

      {/* Lessons Grid */}
      <div className="px-5 py-4">
        <h2 className="text-lg font-bold text-white mb-4">Lecciones</h2>

        <div className="grid grid-cols-4 gap-3">
          {lessons.map((lesson, index) => {
            const isViewed = viewedIds.has(lesson.id);
            const isCurrent = fromLessonId ? lesson.id === fromLessonId : index === 0;

            return (
              <Link
                key={lesson.id}
                href={`/?lessonId=${lesson.id}`}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                  isCurrent
                    ? 'border-2 border-primary shadow-[0_0_15px_-3px_rgba(220,121,168,0.5)] bg-surface-dark'
                    : isViewed
                    ? 'border border-white/5 bg-surface-dark/50'
                    : 'border border-white/5 bg-background-dark/50'
                }`}
              >
                {isViewed ? (
                  <span className="material-icons-round text-green-400 text-xl">check_circle</span>
                ) : (
                  <span className={`font-extrabold text-lg ${isCurrent ? 'text-white' : 'text-gray-500 font-bold'}`}>
                    {String(lesson.lessonNumber).padStart(2, '0')}
                  </span>
                )}
                {isCurrent && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Similar Geniuses */}
      {similarGeniuses.length > 0 && (
        <div className="px-5 py-4">
          <h2 className="text-lg font-bold text-white mb-4">Genios Similares</h2>
          <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-5 px-5 snap-x">
            {similarGeniuses.map((sg) => (
              <Link
                key={sg.id}
                href={`/explorar/genio/${sg.id}`}
                className="flex-none w-[120px] snap-center group"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-dark mb-2 border border-white/5 transition-transform group-hover:-translate-y-1">
                  {sg.portraitUrl ? (
                    <img alt={sg.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" src={sg.portraitUrl} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-icons-round text-3xl text-gray-600">school</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-white line-clamp-2">{sg.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{sg.field}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
