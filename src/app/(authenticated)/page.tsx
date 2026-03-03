'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { VideoCard } from '@/components/feed/VideoCard';
import { BottomNav } from '@/components/layout/BottomNav';
import type { FeedItem } from '@/types';

export default function FeedPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const [videos, setVideos] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);
  const scrolledToLesson = useRef(false);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const geniusCompleteRef = useRef(false);
  const hasResetRef = useRef(false);

  const lessonId = searchParams.get('lessonId');
  const urlMode = searchParams.get('mode');
  const startId = searchParams.get('startId');

  const loadFeed = useCallback(async (mode: string, extra?: Record<string, string>) => {
    if (!token || loadingRef.current) return;
    loadingRef.current = true;

    try {
      const params = new URLSearchParams({ limit: '10', mode });

      if (extra) {
        Object.entries(extra).forEach(([k, v]) => params.set(k, v));
      }

      // Send exclude IDs (skip for genius mode)
      if (mode !== 'genius' && shownIdsRef.current.size > 0) {
        params.set('exclude', Array.from(shownIdsRef.current).join(','));
      }

      const res = await fetch(`/api/feed?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        // If reset signal, clear shown IDs and re-fetch (once only)
        if (data.reset && data.items.length === 0) {
          if (hasResetRef.current) {
            // Already reset once — no content exists, stop polling
            return;
          }
          hasResetRef.current = true;
          shownIdsRef.current = new Set();
          loadingRef.current = false;
          loadFeed(mode, extra);
          return;
        }

        // Track shown IDs
        (data.items || []).forEach((item: FeedItem) => shownIdsRef.current.add(item.id));

        if (data.geniusComplete) {
          geniusCompleteRef.current = true;
        }

        setVideos((prev) => {
          // For initial load or genius mode, replace
          if (prev.length === 0 || mode === 'genius') return data.items;
          // For subsequent loads, append
          return [...prev, ...data.items];
        });
      }
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (lessonId) {
      // Genius mode: load genius lessons starting from this lesson
      loadFeed('genius', { startFromLesson: lessonId });
    } else if (urlMode === 'bookmarks') {
      // Bookmarks mode from biblioteca
      loadFeed('bookmarks');
    } else {
      loadFeed('normal');
    }
  }, [loadFeed, lessonId, urlMode]);

  // Scroll to specific lesson when loaded (genius mode or bookmarks startId)
  useEffect(() => {
    const targetId = lessonId || startId;
    if (!targetId || scrolledToLesson.current || videos.length === 0) return;

    const targetIndex = videos.findIndex((v) => v.id === targetId);
    if (targetIndex >= 0 && containerRef.current) {
      scrolledToLesson.current = true;
      const height = window.innerHeight;
      containerRef.current.scrollTo({ top: targetIndex * height, behavior: 'instant' });
      setCurrentIndex(targetIndex);
      router.replace('/', { scroll: false });
    }
  }, [videos, lessonId, startId, router]);

  // Load more on scroll
  const loadMore = useCallback(() => {
    if (loadingRef.current) return;

    if (urlMode === 'bookmarks') {
      loadFeed('bookmarks');
    } else if (geniusCompleteRef.current || !lessonId) {
      // Normal mode (or genius finished -> switch to normal)
      loadFeed('normal');
    }
  }, [loadFeed, lessonId, urlMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = window.innerHeight;
      const newIndex = Math.round(scrollTop / height);

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);

        // Preload more when near the end
        if (newIndex >= videos.length - 3 && !loadingRef.current) {
          loadMore();
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, videos.length, loadMore]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-app-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-400 text-sm">Cargando tu feed...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-app-black flex items-center justify-center p-8">
        <div className="text-center">
          <span className="material-icons-round text-6xl text-gray-600 mb-4 block">school</span>
          <h2 className="text-xl font-bold text-white mb-2">No hay lecciones aun</h2>
          <p className="text-gray-400 text-sm">Pronto habra contenido increible para ti.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-app-black">
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
            hasBottomNav
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
