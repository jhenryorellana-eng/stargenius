import { create } from 'zustand';

interface VideoState {
  currentVideoId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  playbackRate: number;

  setCurrentVideo: (id: string | null) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  currentVideoId: null,
  isPlaying: false,
  isMuted: false,
  playbackRate: 1,

  setCurrentVideo: (id) => set({ currentVideoId: id }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
}));
