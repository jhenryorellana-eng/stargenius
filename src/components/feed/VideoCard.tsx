'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useAuthStore } from '@/stores/auth-store';
import { ActionBar } from './ActionBar';
import { VideoOverlay } from './VideoOverlay';
import { ProgressBar } from './ProgressBar';
import type { FeedItem } from '@/types';

interface VideoCardProps {
  item: FeedItem;
  isActive: boolean;
  shouldPreload: boolean;
  shouldEagerPreload?: boolean;
  hasBottomNav?: boolean;
}

export function VideoCard({ item, isActive, shouldPreload, shouldEagerPreload, hasBottomNav }: VideoCardProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isVisible } = useIntersectionObserver({ threshold: 0.5 });
  const { token } = useAuthStore();
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.durationSeconds || 45);
  const [feedItem, setFeedItem] = useState(item);
  const lastTapRef = useRef(0);
  const completedRef = useRef(false);
  const [showGeniusAnim, setShowGeniusAnim] = useState(false);

  // Auto play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible && isActive) {
      video.play().catch(() => {});
      setIsPaused(false);
    } else {
      video.pause();
    }
  }, [isVisible, isActive]);

  // Reset completedRef when item changes
  useEffect(() => {
    completedRef.current = false;
  }, [item.id]);

  // Track progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Marcar como completado al pasar el 50%
      if (!completedRef.current && video.duration > 0 && video.currentTime / video.duration >= 0.5) {
        completedRef.current = true;
        trackView(true);
      }
    };
    const onLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  const trackView = async (completed: boolean) => {
    if (!token) return;
    try {
      await fetch(`/api/lessons/${item.id}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchTimeSeconds: Math.floor(currentTime),
          completed,
          lastPositionSeconds: Math.floor(currentTime),
        }),
      });
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    // Double tap detection (< 300ms)
    if (timeSinceLastTap < 300) {
      // Double tap → "Genio"
      handleReact('genius');
      setShowGeniusAnim(true);
      setTimeout(() => setShowGeniusAnim(false), 800);
      return;
    }

    // Single tap → pause/play
    setTimeout(() => {
      if (Date.now() - lastTapRef.current >= 300) {
        const video = videoRef.current;
        if (video) {
          if (video.paused) {
            video.play().catch(() => {});
            setIsPaused(false);
          } else {
            video.pause();
            setIsPaused(true);
          }
        }
      }
    }, 300);
  }, []);

  const handleReact = async (type: 'genius' | 'inspired') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/lessons/${item.id}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedItem((prev) => ({
          ...prev,
          hasGenius: type === 'genius' ? data.active : prev.hasGenius,
          hasInspired: type === 'inspired' ? data.active : prev.hasInspired,
          geniusCount: type === 'genius'
            ? prev.geniusCount + (data.active ? 1 : -1)
            : prev.geniusCount,
          inspiredCount: type === 'inspired'
            ? prev.inspiredCount + (data.active ? 1 : -1)
            : prev.inspiredCount,
        }));
      }
    } catch (err) {
      console.error('Error reacting:', err);
    }
  };

  const handleBookmark = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/lessons/${item.id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedItem((prev) => ({
          ...prev,
          hasBookmarked: data.active,
          saveCount: prev.saveCount + (data.active ? 1 : -1),
        }));
      }
    } catch (err) {
      console.error('Error bookmarking:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${feedItem.geniusName} - Leccion ${feedItem.lessonNumber}`,
          text: feedItem.keyPhrase,
          url: window.location.origin + `/explorar/genio/${feedItem.geniusId}`,
        });
      } catch {
        // User cancelled share
      }
    }
  };

  const handleViewGenius = () => {
    router.push(`/explorar/genio/${feedItem.geniusId}?fromLesson=${feedItem.id}`);
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-full snap-start relative bg-app-black overflow-hidden flex-shrink-0"
      onClick={handleTap}
    >
      {/* Video / Thumbnail */}
      <div className="absolute inset-0 w-full h-full z-0">
        {item.videoUrl && shouldPreload ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={item.videoUrl}
            loop
            muted={false}
            playsInline
            preload={isActive ? 'auto' : shouldEagerPreload ? 'auto' : shouldPreload ? 'metadata' : 'none'}
            poster={item.videoThumbnailUrl || undefined}
          />
        ) : (
          item.videoThumbnailUrl && (
            <img
              alt={item.title}
              className="w-full h-full object-cover opacity-90"
              src={item.videoThumbnailUrl}
            />
          )
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-60% to-black/90 z-10 pointer-events-none" />
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm animate-fade-in">
            <span className="material-icons-round text-white text-5xl">play_arrow</span>
          </div>
        </div>
      )}

      {/* Double tap genius animation */}
      {showGeniusAnim && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
          <span className="material-icons-round text-yellow-300 text-8xl animate-scale-bounce drop-shadow-[0_0_20px_rgba(253,224,71,0.6)]">
            star
          </span>
        </div>
      )}

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-[120px] z-20 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <ActionBar
          item={feedItem}
          onReact={handleReact}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onViewGenius={handleViewGenius}
        />
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-[120px] left-0 w-full px-4 z-20 flex flex-col justify-end pointer-events-none">
        <VideoOverlay item={feedItem} />
      </div>

      {/* Progress Bar */}
      <ProgressBar currentTime={currentTime} duration={duration} bottomPx={hasBottomNav ? 88 : 0} />
    </div>
  );
}
