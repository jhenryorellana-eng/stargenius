import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'normal';
  const limit = parseInt(searchParams.get('limit') || '10');
  const intelligence = searchParams.get('intelligence');
  const startFromLesson = searchParams.get('startFromLesson');
  const excludeParam = searchParams.get('exclude');
  const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

  try {
    const supabase = createServerClient();

    // === MODO GENIO ===
    if (mode === 'genius' && startFromLesson) {
      const { data: targetLesson } = await supabase
        .from('lessons')
        .select('genius_id, order_index')
        .eq('id', startFromLesson)
        .single();

      if (!targetLesson) {
        return NextResponse.json({ items: [], nextCursor: null });
      }

      const { data: lessons, error } = await supabase
        .from('lessons')
        .select(`*, geniuses!inner (id, name, field, field_verified, portrait_url, total_lessons)`)
        .eq('genius_id', targetLesson.genius_id)
        .gte('order_index', targetLesson.order_index)
        .order('order_index', { ascending: true });

      if (error || !lessons) {
        return NextResponse.json({ items: [], nextCursor: null });
      }

      const enriched = await enrichItems(supabase, lessons, auth.sub);
      return NextResponse.json({ items: enriched, nextCursor: null, geniusComplete: true });
    }

    // === MODO BOOKMARKS ===
    if (mode === 'bookmarks') {
      const { data: bookmarkRows } = await supabase
        .from('bookmarks')
        .select('lesson_id')
        .eq('student_id', auth.sub);

      const bookmarkedIds = (bookmarkRows || []).map((b: { lesson_id: string }) => b.lesson_id);
      if (bookmarkedIds.length === 0) {
        return NextResponse.json({ items: [], reset: false });
      }

      const availableIds = bookmarkedIds.filter((id: string) => !excludeIds.includes(id));

      if (availableIds.length === 0) {
        return NextResponse.json({ items: [], reset: true });
      }

      const selectedIds = shuffle(availableIds).slice(0, limit);

      const { data: lessons } = await supabase
        .from('lessons')
        .select(`*, geniuses!inner (id, name, field, field_verified, portrait_url, total_lessons)`)
        .in('id', selectedIds);

      const shuffled = shuffle(lessons || []);
      const enriched = await enrichItems(supabase, shuffled, auth.sub);
      return NextResponse.json({ items: enriched, hasMore: true });
    }

    // === MODO NORMAL / INTELLIGENCE ===
    // 1. Obtener IDs completados por el usuario
    const { data: completedRows } = await supabase
      .from('lesson_views')
      .select('lesson_id')
      .eq('student_id', auth.sub)
      .eq('completed', true);

    const completedIds = new Set((completedRows || []).map((v: { lesson_id: string }) => v.lesson_id));

    // 2. Obtener TODAS las lecciones candidatas (publicadas)
    let candidateQuery = supabase
      .from('lessons')
      .select('id, geniuses!inner(is_published)')
      .eq('geniuses.is_published', true);

    if (intelligence) {
      candidateQuery = candidateQuery.eq('intelligence_type', intelligence);
    }

    const { data: allLessons } = await candidateQuery;

    const allCandidateIds = (allLessons || []).map((i: { id: string }) => i.id);

    // 3. Separar en no-completados y completados, excluyendo los ya mostrados
    const notCompletedAvailable = allCandidateIds.filter(
      (id: string) => !completedIds.has(id) && !excludeIds.includes(id)
    );
    const completedAvailable = allCandidateIds.filter(
      (id: string) => completedIds.has(id) && !excludeIds.includes(id)
    );

    // 4. Priorizar no-completados, luego completados
    let selectedIds: string[] = [];
    const shuffledNotCompleted = shuffle(notCompletedAvailable);
    selectedIds.push(...shuffledNotCompleted.slice(0, limit));

    if (selectedIds.length < limit) {
      const remaining = limit - selectedIds.length;
      const shuffledCompleted = shuffle(completedAvailable);
      selectedIds.push(...shuffledCompleted.slice(0, remaining));
    }

    // 5. Si no hay nada disponible → reset
    if (selectedIds.length === 0) {
      return NextResponse.json({ items: [], reset: true, hasMore: true });
    }

    // 6. Fetch lecciones completas
    const { data: lessons } = await supabase
      .from('lessons')
      .select(`*, geniuses!inner (id, name, field, field_verified, portrait_url, total_lessons)`)
      .in('id', selectedIds);

    // 7. Mantener el orden shuffled (el .in() no garantiza orden)
    const idOrder = new Map(selectedIds.map((id, idx) => [id, idx]));
    const sortedLessons = (lessons || []).sort(
      (a: any, b: any) => (idOrder.get(a.id) || 0) - (idOrder.get(b.id) || 0)
    );

    const enriched = await enrichItems(supabase, sortedLessons, auth.sub);
    return NextResponse.json({ items: enriched, hasMore: true });

  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

async function enrichItems(supabase: any, lessons: any[], studentId: string) {
  if (!lessons || lessons.length === 0) return [];

  // Contar lecciones reales por genio
  const geniusIds = [...new Set(lessons.map((i: any) => i.geniuses.id))];
  const { data: lessonCounts } = await supabase
    .from('lessons')
    .select('genius_id')
    .in('genius_id', geniusIds);

  const geniusLessonCountMap = new Map<string, number>();
  (lessonCounts || []).forEach((row: { genius_id: string }) => {
    geniusLessonCountMap.set(row.genius_id, (geniusLessonCountMap.get(row.genius_id) || 0) + 1);
  });

  // User state
  const lessonIds = lessons.map((i: { id: string }) => i.id);

  const [reactionsResult, bookmarksResult, viewsResult] = await Promise.all([
    supabase
      .from('reactions')
      .select('lesson_id, type')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds),
    supabase
      .from('bookmarks')
      .select('lesson_id')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds),
    supabase
      .from('lesson_views')
      .select('lesson_id')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds),
  ]);

  const userReactions = new Map<string, Set<string>>();
  (reactionsResult.data || []).forEach((r: { lesson_id: string; type: string }) => {
    if (!userReactions.has(r.lesson_id)) userReactions.set(r.lesson_id, new Set());
    userReactions.get(r.lesson_id)!.add(r.type);
  });

  const userBookmarks = new Set(
    (bookmarksResult.data || []).map((b: { lesson_id: string }) => b.lesson_id)
  );
  const userViews = new Set(
    (viewsResult.data || []).map((v: { lesson_id: string }) => v.lesson_id)
  );

  return lessons.map((lesson: any) => ({
    id: lesson.id,
    geniusId: lesson.geniuses.id,
    title: lesson.title,
    lessonNumber: lesson.lesson_number,
    keyPhrase: lesson.key_phrase,
    videoUrl: lesson.video_url,
    videoThumbnailUrl: lesson.video_thumbnail_url,
    durationSeconds: lesson.duration_seconds,
    audioTrackName: lesson.audio_track_name,
    intelligenceType: lesson.intelligence_type,
    geniusCount: lesson.genius_count,
    inspiredCount: lesson.inspired_count,
    saveCount: lesson.save_count,
    shareCount: lesson.share_count,
    viewCount: lesson.view_count,
    orderIndex: lesson.order_index,
    geniusName: lesson.geniuses.name,
    geniusField: lesson.geniuses.field,
    geniusFieldVerified: lesson.geniuses.field_verified,
    geniusPortraitUrl: lesson.geniuses.portrait_url,
    geniusTotalLessons: geniusLessonCountMap.get(lesson.geniuses.id) || 0,
    hasGenius: userReactions.get(lesson.id)?.has('genius') || false,
    hasInspired: userReactions.get(lesson.id)?.has('inspired') || false,
    hasBookmarked: userBookmarks.has(lesson.id),
    isViewed: userViews.has(lesson.id),
  }));
}
