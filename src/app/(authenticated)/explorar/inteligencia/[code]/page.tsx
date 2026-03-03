'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getIntelligenceByCode } from '@/constants/intelligences';
import { VideoCard } from '@/components/feed/VideoCard';
import type { FeedItem } from '@/types';

export default function IntelligenceFeedPage() {
  const { code } = useParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  const [videos, setVideos] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const hasResetRef = useRef(false);

  const intelligence = getIntelligenceByCode(code as string);

  const loadFeed = useCallback(async () => {
    if (!token || !code || loadingRef.current) return;
    loadingRef.current = true;

    try {
      const params = new URLSearchParams({
        limit: '10',
        mode: 'intelligence',
        intelligence: code as string,
      });

      if (shownIdsRef.current.size > 0) {
        params.set('exclude', Array.from(shownIdsRef.current).join(','));
      }

      const res = await fetch(`/api/feed?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        if (data.reset && data.items.length === 0) {
          if (hasResetRef.current) {
            return;
          }
          hasResetRef.current = true;
          shownIdsRef.current = new Set();
          loadingRef.current = false;
          loadFeed();
          return;
        }

        (data.items || []).forEach((item: FeedItem) => shownIdsRef.current.add(item.id));
        setVideos((prev) => prev.length === 0 ? data.items : [...prev, ...data.items]);
      }
    } catch (err) {
      console.error('Error loading intelligence feed:', err);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [token, code]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = window.innerHeight;
      const newIndex = Math.round(scrollTop / height);

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);

        if (newIndex >= videos.length - 3 && !loadingRef.current) {
          loadFeed();
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, videos.length, loadFeed]);

  if (!intelligence) {
    return (
      <div className="fixed inset-0 bg-app-black flex items-center justify-center">
        <p className="text-gray-400">Inteligencia no encontrada</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-app-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-400 text-sm">Cargando {intelligence.name}...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-app-black flex items-center justify-center p-8">
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-5 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <span className="material-icons-round text-white">arrow_back</span>
        </button>

        <div className="text-center">
          <span
            className="material-icons-round text-6xl mb-4 block"
            style={{ color: intelligence.color, opacity: 0.4 }}
          >
            {intelligence.icon}
          </span>
          <h2 className="text-xl font-bold text-white mb-2">No hay lecciones aun</h2>
          <p className="text-gray-400 text-sm">
            Aun no hay videos de inteligencia {intelligence.name.toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-app-black">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center gap-3 pt-12 pb-3 px-5 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
        >
          <span className="material-icons-round text-white">arrow_back</span>
        </button>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${intelligence.color}30` }}
        >
          <span
            className="material-icons-round text-lg"
            style={{ color: intelligence.color }}
          >
            {intelligence.icon}
          </span>
        </div>
        <span className="text-sm font-bold text-white text-shadow">
          {intelligence.name}
        </span>
      </div>

      {/* TikTok-style feed */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {videos.map((video, index) => (
          <VideoCard
            key={`${video.id}-${index}`}
            item={video}
            isActive={index === currentIndex}
            shouldEagerPreload={index >= currentIndex + 1 && index <= currentIndex + 2}
            shouldPreload={index <= currentIndex + 4}
          />
        ))}
      </div>
    </div>
  );
}
