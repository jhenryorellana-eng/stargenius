import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { watchTimeSeconds, completed, lastPositionSeconds } = await request.json();
    const supabase = createServerClient();

    // Upsert lesson view
    const { error } = await (supabase
      .from('lesson_views') as ReturnType<typeof supabase.from>)
      .upsert(
        {
          student_id: auth.sub,
          lesson_id: params.id,
          watch_time_seconds: watchTimeSeconds || 0,
          completed: completed || false,
          last_position_seconds: lastPositionSeconds || 0,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,lesson_id' }
      );

    if (error) {
      console.error('View tracking error:', error);
      return NextResponse.json({ error: 'Error al registrar vista' }, { status: 500 });
    }

    // Update view count on lesson
    if (completed) {
      const { data: lesson } = await (supabase
        .from('lessons') as ReturnType<typeof supabase.from>)
        .select('view_count')
        .eq('id', params.id)
        .single();

      if (lesson) {
        await (supabase
          .from('lessons') as ReturnType<typeof supabase.from>)
          .update({ view_count: (lesson.view_count || 0) + 1 })
          .eq('id', params.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('View error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
