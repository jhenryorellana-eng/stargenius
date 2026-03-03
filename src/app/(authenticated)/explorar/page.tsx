'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { SearchBar } from '@/components/explore/SearchBar';
import { TrendingCarousel } from '@/components/explore/TrendingCarousel';
import { IntelligenceChips } from '@/components/explore/IntelligenceChips';
import { GeniusCard } from '@/components/explore/GeniusCard';
import { SavedLessonCard } from '@/components/explore/SavedLessonCard';
import type { Genius, Lesson } from '@/types';

export default function ExplorarPage() {
  const { token } = useAuthStore();
  const [trendingGeniuses, setTrendingGeniuses] = useState<Genius[]>([]);
  const [mostSavedLessons, setMostSavedLessons] = useState<(Lesson & { geniusName: string; geniusField: string })[]>([]);
  const [searchResults, setSearchResults] = useState<Genius[] | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [trendingRes, savedRes, historyRes] = await Promise.all([
        fetch('/api/geniuses?sort=trending&limit=10', { headers }),
        fetch('/api/lessons/trending?limit=10', { headers }),
        fetch('/api/search/history', { headers }),
      ]);

      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrendingGeniuses(data.geniuses || []);
      }
      if (savedRes.ok) {
        const data = await savedRes.json();
        setMostSavedLessons(data.lessons || []);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setRecentSearches(data.searches || []);
      }
    } catch (err) {
      console.error('Error fetching explore data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query || !token) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.geniuses || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [token]);

  const handleSubmitSearch = useCallback(async (query: string) => {
    if (!query || !token) return;
    try {
      await fetch('/api/search/history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== query);
        return [query, ...filtered].slice(0, 5);
      });
    } catch (err) {
      console.error('Save search history error:', err);
    }
  }, [token]);

  const handleClearHistory = async () => {
    if (!token) return;
    await fetch('/api/search/history', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    setRecentSearches([]);
  };

  const handleRemoveSearch = async (query: string) => {
    setRecentSearches((prev) => prev.filter((s) => s !== query));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Sticky Search Header — Glassmorphism */}
      <header className="sticky top-0 z-40 pt-12 pb-4 px-5" style={{
        background: 'rgba(15, 25, 33, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(6, 182, 212, 0.1)',
      }}>
        <SearchBar
          onSearch={handleSearch}
          onSubmitSearch={handleSubmitSearch}
          recentSearches={recentSearches}
          onClearHistory={handleClearHistory}
          onRemoveSearch={handleRemoveSearch}
        />
      </header>

      <div className="px-5 py-6 space-y-8 pb-24">
        {/* Search Results */}
        {searchResults !== null ? (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Resultados</h2>
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((genius) => (
                  <GeniusCard key={genius.id} genius={genius} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No se encontraron resultados
              </p>
            )}
          </section>
        ) : (
          <>
            {/* Trending */}
            <TrendingCarousel geniuses={trendingGeniuses} />

            {/* Intelligence Categories — 2x3 Grid */}
            <IntelligenceChips />

            {/* Most Saved Lessons — Horizontal cards with video thumbnail */}
            {mostSavedLessons.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-lg font-bold text-white">Lecciones mas guardadas</h2>
                </div>
                <div className="space-y-4">
                  {mostSavedLessons.map((lesson) => (
                    <SavedLessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
