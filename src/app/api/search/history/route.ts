import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    const { data } = await supabase
      .from('search_history')
      .select('query')
      .eq('student_id', auth.sub)
      .order('searched_at', { ascending: false })
      .limit(5);

    const searches = [...new Set((data || []).map((d: { query: string }) => d.query))];

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Search history error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { query } = await request.json();
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: false });
    }

    const supabase = createServerClient();

    await supabase
      .from('search_history')
      .insert({
        student_id: auth.sub,
        query: query.trim(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save search history error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    await supabase
      .from('search_history')
      .delete()
      .eq('student_id', auth.sub);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear history error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
