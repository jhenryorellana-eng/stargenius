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
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId requerido' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify playlist ownership
    const { data: playlist } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', params.id)
      .eq('student_id', auth.sub)
      .single();

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist no encontrada' }, { status: 404 });
    }

    // Get next order index
    const { data: lastItem } = await supabase
      .from('playlist_items')
      .select('order_index')
      .eq('playlist_id', params.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastItem?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from('playlist_items')
      .insert({
        playlist_id: params.id,
        lesson_id: lessonId,
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Lección ya está en la playlist' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al agregar' }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Add playlist item error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId requerido' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify playlist ownership
    const { data: playlist } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', params.id)
      .eq('student_id', auth.sub)
      .single();

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist no encontrada' }, { status: 404 });
    }

    const { error } = await supabase
      .from('playlist_items')
      .delete()
      .eq('playlist_id', params.id)
      .eq('lesson_id', lessonId);

    if (error) {
      return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove playlist item error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items debe ser un array' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify playlist ownership
    const { data: playlist } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', params.id)
      .eq('student_id', auth.sub)
      .single();

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist no encontrada' }, { status: 404 });
    }

    // Update order for each item
    const updates = items.map((item: { lessonId: string; orderIndex: number }) =>
      supabase
        .from('playlist_items')
        .update({ order_index: item.orderIndex })
        .eq('playlist_id', params.id)
        .eq('lesson_id', item.lessonId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder playlist items error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
