import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    const { data: collections, error } = await supabase
      .from('collections')
      .select('*, collection_geniuses(count)')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Collections error:', error);
      return NextResponse.json({ error: 'Error al cargar colecciones' }, { status: 500 });
    }

    const mapped = (collections || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      coverUrl: c.cover_url,
      gradientFrom: c.gradient_from,
      gradientTo: c.gradient_to,
      isFeatured: c.is_featured,
      geniusCount: c.collection_geniuses?.[0]?.count || 0,
    }));

    return NextResponse.json({ collections: mapped });
  } catch (error) {
    console.error('Collections error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
