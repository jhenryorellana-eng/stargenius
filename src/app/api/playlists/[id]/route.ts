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

    const { data: playlist, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', params.id)
      .eq('student_id', auth.sub)
      .single();

    if (error || !playlist) {
      return NextResponse.json({ error: 'Playlist no encontrada' }, { status: 404 });
    }

    const { data: items } = await supabase
      .from('playlist_items')
      .select(`*, lessons (*, geniuses (name, field))`)
      .eq('playlist_id', params.id)
      .order('order_index', { ascending: true });

    const formattedItems = (items || []).map((item: any) => ({
      id: item.id,
      lessonId: item.lesson_id,
      orderIndex: item.order_index,
      lesson: item.lessons ? {
        id: item.lessons.id,
        title: item.lessons.title,
        keyPhrase: item.lessons.key_phrase,
        videoThumbnailUrl: item.lessons.video_thumbnail_url,
        durationSeconds: item.lessons.duration_seconds,
        lessonNumber: item.lessons.lesson_number,
      } : null,
      geniusName: item.lessons?.geniuses?.name,
      geniusField: item.lessons?.geniuses?.field,
    }));

    return NextResponse.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverColor: playlist.cover_color,
        createdAt: playlist.created_at,
        updatedAt: playlist.updated_at,
      },
      items: formattedItems,
    });
  } catch (error) {
    console.error('Playlist detail error:', error);
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
    const { name, description, coverColor } = await request.json();
    const supabase = createServerClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', params.id)
      .eq('student_id', auth.sub)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Playlist no encontrada' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (coverColor !== undefined) updates.cover_color = coverColor;

    const { data, error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }

    return NextResponse.json({ playlist: data });
  } catch (error) {
    console.error('Update playlist error:', error);
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
    const supabase = createServerClient();

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', params.id)
      .eq('student_id', auth.sub);

    if (error) {
      return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
