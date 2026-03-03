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
      .from('playlists')
      .select('*, playlist_items(count)')
      .eq('student_id', auth.sub)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al cargar playlists' }, { status: 500 });
    }

    const playlists = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      coverColor: p.cover_color,
      itemCount: p.playlist_items?.[0]?.count || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Playlists error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { name, description, coverColor } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('playlists')
      .insert({
        student_id: auth.sub,
        name: name.trim(),
        description: description || null,
        cover_color: coverColor || '#06b6d4',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Error al crear playlist' }, { status: 500 });
    }

    return NextResponse.json({ playlist: data });
  } catch (error) {
    console.error('Create playlist error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
