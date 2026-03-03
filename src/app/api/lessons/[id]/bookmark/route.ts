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
    const supabase = createServerClient();

    // Check if bookmark exists (toggle)
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('lesson_id')
      .eq('student_id', auth.sub)
      .eq('lesson_id', params.id)
      .single();

    if (existing) {
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('student_id', auth.sub)
        .eq('lesson_id', params.id);

      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError);
        return NextResponse.json({ error: 'Error al eliminar bookmark' }, { status: 500 });
      }

      return NextResponse.json({ active: false });
    } else {
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          student_id: auth.sub,
          lesson_id: params.id,
        });

      if (insertError) {
        console.error('Error inserting bookmark:', insertError);
        return NextResponse.json({ error: 'Error al crear bookmark' }, { status: 500 });
      }

      return NextResponse.json({ active: true });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
