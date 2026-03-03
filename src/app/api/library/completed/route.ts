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
      .from('genius_progress')
      .select(`*, geniuses (*)`)
      .eq('student_id', auth.sub)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al cargar' }, { status: 500 });
    }

    const items = (data || []).map((p: any) => ({
      id: p.id,
      geniusId: p.genius_id,
      lessonsCompleted: p.lessons_completed,
      progressPercent: p.progress_percent,
      status: p.status,
      completedAt: p.completed_at,
      genius: p.geniuses ? {
        id: p.geniuses.id,
        name: p.geniuses.name,
        field: p.geniuses.field,
        portraitUrl: p.geniuses.portrait_url,
        totalLessons: p.geniuses.total_lessons,
      } : null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Completed error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
