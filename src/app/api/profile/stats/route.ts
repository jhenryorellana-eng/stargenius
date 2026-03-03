import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    const [geniusesRes, lessonsRes, allLessonsRes, completedViewsRes] = await Promise.all([
      supabase
        .from('genius_progress')
        .select('id', { count: 'exact' })
        .eq('student_id', auth.sub),
      supabase
        .from('lesson_views')
        .select('id', { count: 'exact' })
        .eq('student_id', auth.sub)
        .eq('completed', true),
      // Total de lecciones por tipo de inteligencia (solo genios publicados)
      supabase
        .from('lessons')
        .select('intelligence_type, geniuses!inner(is_published)')
        .eq('geniuses.is_published', true),
      // Lecciones completadas por el usuario
      supabase
        .from('lesson_views')
        .select('lesson_id, lessons!inner(intelligence_type)')
        .eq('student_id', auth.sub)
        .eq('completed', true),
    ]);

    // Contar total de lecciones por tipo de inteligencia
    const totalByType = new Map<string, number>();
    (allLessonsRes.data || []).forEach((lesson: Record<string, unknown>) => {
      const type = lesson.intelligence_type as string;
      if (type) {
        totalByType.set(type, (totalByType.get(type) || 0) + 1);
      }
    });

    // Contar completadas por tipo de inteligencia
    const completedByType = new Map<string, number>();
    (completedViewsRes.data || []).forEach((view: Record<string, unknown>) => {
      const lessons = view.lessons as Record<string, unknown> | null;
      const type = lessons?.intelligence_type as string;
      if (type) {
        completedByType.set(type, (completedByType.get(type) || 0) + 1);
      }
    });

    // Construir intelligences con porcentaje dinámico
    const intelligenceTypes = new Set([...totalByType.keys(), ...completedByType.keys()]);
    const intelligences = Array.from(intelligenceTypes).map((code) => {
      const total = totalByType.get(code) || 0;
      const completed = completedByType.get(code) || 0;
      const score = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        intelligenceCode: code,
        score,
        lessonsConsumed: completed,
      };
    });

    return NextResponse.json({
      totalGeniusesExplored: geniusesRes.count || 0,
      totalLessonsDiscovered: lessonsRes.count || 0,
      intelligences,
    });
  } catch (error) {
    console.error('Profile stats error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
