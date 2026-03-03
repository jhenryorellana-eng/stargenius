import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const supabase = createServerClient();

    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(`
        *,
        geniuses!inner (name, field)
      `)
      .gt('save_count', 0)
      .order('save_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Trending lessons error:', error);
      return NextResponse.json({ error: 'Error al cargar trending' }, { status: 500 });
    }

    const mappedLessons = (lessons || []).map((i: any) => ({
      id: i.id,
      geniusId: i.genius_id,
      title: i.title,
      lessonNumber: i.lesson_number,
      keyPhrase: i.key_phrase,
      videoUrl: i.video_url,
      videoThumbnailUrl: i.video_thumbnail_url,
      durationSeconds: i.duration_seconds,
      saveCount: i.save_count,
      geniusCount: i.genius_count,
      geniusName: i.geniuses.name,
      geniusField: i.geniuses.field,
    }));

    return NextResponse.json({ lessons: mappedLessons });
  } catch (error) {
    console.error('Trending error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
