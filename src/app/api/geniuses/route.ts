import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'trending';
  const intelligence = searchParams.get('intelligence');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const supabase = createServerClient();

    let query = supabase
      .from('geniuses')
      .select('*')
      .eq('is_published', true)
      .limit(limit);

    if (intelligence) {
      // Filter geniuses that have lessons with this intelligence type
      const { data: geniusIds } = await supabase
        .from('lessons')
        .select('genius_id')
        .eq('intelligence_type', intelligence);

      if (geniusIds && geniusIds.length > 0) {
        const uniqueIds = [...new Set(geniusIds.map((b: { genius_id: string }) => b.genius_id))];
        query = query.in('id', uniqueIds);
      }
    }

    if (sort === 'trending') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'rating') {
      query = query.order('average_rating', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: geniuses, error } = await query;

    if (error) {
      console.error('Geniuses query error:', error);
      return NextResponse.json({ error: 'Error al cargar genios' }, { status: 500 });
    }

    // Calcular stats dinámicamente desde la tabla lessons
    const geniusIds = (geniuses || []).map((b: any) => b.id);
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('genius_id, genius_count, inspired_count, save_count')
      .in('genius_id', geniusIds);

    const geniusStatsMap = new Map<string, { count: number; genius: number; inspired: number; saves: number }>();
    (lessonsData || []).forEach((lesson: any) => {
      const stats = geniusStatsMap.get(lesson.genius_id) || { count: 0, genius: 0, inspired: 0, saves: 0 };
      stats.count++;
      stats.genius += lesson.genius_count || 0;
      stats.inspired += lesson.inspired_count || 0;
      stats.saves += lesson.save_count || 0;
      geniusStatsMap.set(lesson.genius_id, stats);
    });

    const mappedGeniuses = (geniuses || []).map((b: Record<string, unknown>) => {
      const stats = geniusStatsMap.get(b.id as string) || { count: 0, genius: 0, inspired: 0, saves: 0 };
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        field: b.field,
        fieldVerified: b.field_verified,
        description: b.description,
        portraitUrl: b.portrait_url,
        averageRating: Number(b.average_rating),
        totalLessons: stats.count,
        totalGenius: stats.genius,
        totalInspired: stats.inspired,
        totalSaves: stats.saves,
        tags: b.tags || [],
        isPublished: b.is_published,
      };
    });

    // Ordenar por suma de inspired + genius (trending dinámico)
    if (sort === 'trending') {
      mappedGeniuses.sort((a: { totalInspired: number; totalGenius: number }, b: { totalInspired: number; totalGenius: number }) =>
        (b.totalInspired + b.totalGenius) - (a.totalInspired + a.totalGenius)
      );
    }

    return NextResponse.json({ geniuses: mappedGeniuses });
  } catch (error) {
    console.error('Geniuses error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
