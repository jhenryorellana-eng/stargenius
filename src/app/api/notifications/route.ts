import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    // Obtener notificaciones no leídas por este student
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, data, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Obtener IDs de notificaciones ya leídas
    const notificationIds = (notifications || []).map((n) => n.id);
    if (notificationIds.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('student_id', auth.sub)
      .in('notification_id', notificationIds);

    const readIds = new Set((reads || []).map((r) => r.notification_id));
    const unread = (notifications || []).filter((n) => !readIds.has(n.id));

    return NextResponse.json({ notifications: unread });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ notifications: [] });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();
    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    const rows = notificationIds.map((notificationId: string) => ({
      student_id: auth.sub,
      notification_id: notificationId,
    }));

    await supabase.from('notification_reads').upsert(rows, {
      onConflict: 'student_id,notification_id',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
