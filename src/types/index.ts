// Student types
export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  avatarUrl?: string;
  currentStreak: number;
  maxStreak: number;
  lastActivityDate?: string;
}

// Genius types
export interface Genius {
  id: string;
  name: string;
  slug: string;
  field: string;
  fieldVerified: boolean;
  description?: string;
  portraitUrl?: string;
  era?: string;
  averageRating: number;
  totalLessons: number;
  totalGenius: number;
  totalInspired: number;
  totalSaves: number;
  totalDuration?: number;
  tags: string[];
  isPublished: boolean;
}

// Lesson (video) types
export interface Lesson {
  id: string;
  geniusId: string;
  title: string;
  lessonNumber: number;
  keyPhrase: string;
  videoUrl: string;
  videoThumbnailUrl?: string;
  durationSeconds: number;
  audioTrackName?: string;
  intelligenceType: IntelligenceType;
  geniusCount: number;
  inspiredCount: number;
  saveCount: number;
  shareCount: number;
  viewCount: number;
  orderIndex: number;
}

// Feed item combines lesson with genius info
export interface FeedItem extends Lesson {
  geniusName: string;
  geniusField: string;
  geniusFieldVerified: boolean;
  geniusPortraitUrl?: string;
  geniusTotalLessons: number;
  // User-specific state
  hasGenius?: boolean;
  hasInspired?: boolean;
  hasBookmarked?: boolean;
  isViewed?: boolean;
}

// Intelligence types
export type IntelligenceType =
  | 'mental'
  | 'emocional'
  | 'social'
  | 'financiera'
  | 'creativa'
  | 'fisica'
  | 'espiritual';

export interface Intelligence {
  code: IntelligenceType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Reactions
export type ReactionType = 'genius' | 'inspired';

// Genius progress
export interface GeniusProgress {
  id: string;
  geniusId: string;
  lessonsViewed: number;
  lessonsCompleted: number;
  progressPercent: number;
  status: 'learning' | 'completed';
  startedAt: string;
  completedAt?: string;
  lastViewedAt: string;
  // Joined data
  genius?: Genius;
}

// Bookmark
export interface BookmarkItem {
  lessonId: string;
  createdAt: string;
  lesson?: Lesson;
  geniusName?: string;
  geniusField?: string;
}

// Playlist
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverColor: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  lessonId: string;
  orderIndex: number;
  lesson?: Lesson;
}

// Collection (curated)
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  gradientFrom: string;
  gradientTo: string;
  isFeatured: boolean;
  geniusCount?: number;
}

// Reflection
export interface Reflection {
  id: string;
  lessonId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  lessonTitle?: string;
  geniusName?: string;
}

// Student intelligence profile
export interface StudentIntelligence {
  intelligenceCode: IntelligenceType;
  score: number;
  lessonsConsumed: number;
}

// Profile stats
export interface ProfileStats {
  totalGeniusesExplored: number;
  totalLessonsDiscovered: number;
  currentStreak: number;
  maxStreak: number;
  intelligences: StudentIntelligence[];
}

// Search
export interface SearchResult {
  geniuses: Genius[];
  lessons: Lesson[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// WebView Bridge types
export interface SuperAppMessage {
  type: 'NOTIFICATION' | 'LOGOUT' | 'NAVIGATE' | 'CLOSE' | 'REFRESH';
  payload?: Record<string, unknown>;
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
