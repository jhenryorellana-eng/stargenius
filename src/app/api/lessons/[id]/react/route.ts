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
    const { type } = await request.json();

    if (!['genius', 'inspired'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de reacción inválido' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check if reaction already exists (toggle behavior)
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('student_id', auth.sub)
      .eq('lesson_id', params.id)
      .eq('type', type)
      .single();

    if (existing) {
      // Remove reaction
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Error deleting reaction:', deleteError);
        return NextResponse.json({ error: 'Error al eliminar reacción' }, { status: 500 });
      }

      return NextResponse.json({ active: false });
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from('reactions')
        .insert({
          student_id: auth.sub,
          lesson_id: params.id,
          type,
        });

      if (insertError) {
        console.error('Error inserting reaction:', insertError);
        return NextResponse.json({ error: 'Error al crear reacción' }, { status: 500 });
      }

      return NextResponse.json({ active: true });
    }
  } catch (error) {
    console.error('React error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
