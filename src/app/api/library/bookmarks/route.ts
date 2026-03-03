import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('bookmarks')
      .select(`*, lessons (*, geniuses (name, field))`)
      .eq('student_id', auth.sub)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al cargar' }, { status: 500 });
    }

    const items = (data || []).map((b: any) => ({
      lessonId: b.lesson_id,
      createdAt: b.created_at,
      lesson: b.lessons ? {
        id: b.lessons.id,
        title: b.lessons.title,
        keyPhrase: b.lessons.key_phrase,
        videoThumbnailUrl: b.lessons.video_thumbnail_url,
        durationSeconds: b.lessons.duration_seconds,
      } : null,
      geniusName: b.lessons?.geniuses?.name,
      geniusField: b.lessons?.geniuses?.field,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Bookmarks error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
