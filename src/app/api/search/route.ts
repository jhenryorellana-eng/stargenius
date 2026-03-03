import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ geniuses: [] });
    }

    const supabase = createServerClient();
    const searchTerm = `%${query.trim()}%`;

    // Search geniuses by name or field
    const { data: geniuses, error } = await supabase
      .from('geniuses')
      .select('*')
      .eq('is_published', true)
      .or(`name.ilike.${searchTerm},field.ilike.${searchTerm}`)
      .limit(20);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Error en búsqueda' }, { status: 500 });
    }

    const mappedGeniuses = (geniuses || []).map((b: Record<string, unknown>) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      field: b.field,
      fieldVerified: b.field_verified,
      description: b.description,
      portraitUrl: b.portrait_url,
      averageRating: Number(b.average_rating),
      totalLessons: b.total_lessons,
      totalGenius: b.total_genius,
      totalInspired: b.total_inspired,
      totalSaves: b.total_saves,
      tags: b.tags || [],
      isPublished: b.is_published,
    }));

    return NextResponse.json({ geniuses: mappedGeniuses });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
