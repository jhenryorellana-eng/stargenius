import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    // Get genius
    const { data: genius, error } = await supabase
      .from('geniuses')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !genius) {
      return NextResponse.json({ error: 'Genio no encontrado' }, { status: 404 });
    }

    // Calcular stats dinámicamente desde la tabla lessons
    const { data: geniusLessons } = await supabase
      .from('lessons')
      .select('genius_count, inspired_count, save_count, duration_seconds')
      .eq('genius_id', params.id);

    const lessonCount = (geniusLessons || []).length;
    const totalGenius = (geniusLessons || []).reduce((sum: number, i: any) => sum + (i.genius_count || 0), 0);
    const totalInspired = (geniusLessons || []).reduce((sum: number, i: any) => sum + (i.inspired_count || 0), 0);
    const totalSaves = (geniusLessons || []).reduce((sum: number, i: any) => sum + (i.save_count || 0), 0);
    const totalDuration = (geniusLessons || []).reduce((sum: number, i: any) => sum + (i.duration_seconds || 0), 0);

    // Get user progress for this genius
    const { data: progress } = await supabase
      .from('genius_progress')
      .select('*')
      .eq('student_id', auth.sub)
      .eq('genius_id', params.id)
      .single();

    // Get viewed lesson IDs (solo completados al 50%+)
    const { data: views } = await supabase
      .from('lesson_views')
      .select('lesson_id')
      .eq('student_id', auth.sub)
      .eq('completed', true);

    const viewedLessonIds = (views || []).map((v: { lesson_id: string }) => v.lesson_id);

    // Get similar geniuses (same tags or random published)
    const { data: similarGeniuses } = await supabase
      .from('geniuses')
      .select('*')
      .eq('is_published', true)
      .neq('id', params.id)
      .limit(5);

    return NextResponse.json({
      genius: {
        id: genius.id,
        name: genius.name,
        slug: genius.slug,
        field: genius.field,
        fieldVerified: genius.field_verified,
        description: genius.description,
        portraitUrl: genius.portrait_url,
        averageRating: Number(genius.average_rating),
        totalLessons: lessonCount,
        totalGenius,
        totalInspired,
        totalSaves,
        totalDuration,
        tags: genius.tags || [],
        isPublished: genius.is_published,
      },
      progress: progress
        ? {
            id: progress.id,
            geniusId: progress.genius_id,
            lessonsCompleted: progress.lessons_completed,
            progressPercent: progress.progress_percent,
            status: progress.status,
            lastViewedAt: progress.last_viewed_at,
          }
        : null,
      viewedLessonIds,
      similarGeniuses: await (async () => {
        const simIds = (similarGeniuses || []).map((b: any) => b.id);
        const { data: simLessons } = simIds.length > 0
          ? await supabase.from('lessons').select('genius_id').in('genius_id', simIds)
          : { data: [] };
        const simCountMap = new Map<string, number>();
        (simLessons || []).forEach((r: { genius_id: string }) => {
          simCountMap.set(r.genius_id, (simCountMap.get(r.genius_id) || 0) + 1);
        });
        return (similarGeniuses || []).map((b: Record<string, unknown>) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          field: b.field,
          portraitUrl: b.portrait_url,
          totalLessons: simCountMap.get(b.id as string) || 0,
          averageRating: Number(b.average_rating),
        }));
      })(),
    });
  } catch (error) {
    console.error('Genius detail error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
