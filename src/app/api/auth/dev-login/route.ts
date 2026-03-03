import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const DEV_STUDENT = {
  external_id: 'dev-student-stargenius-001',
  first_name: 'Estudiante',
  last_name: 'Demo',
  email: 'demo@stargenius.dev',
  code: 'E-DEV00001',
  family_id: 'dev-family-001',
};

async function generateDevToken(student: { id: string; external_id: string; first_name: string; family_id: string }) {
  return new SignJWT({
    sub: student.id,
    external_id: student.external_id,
    first_name: student.first_name,
    family_id: student.family_id,
    dev: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function POST(request: Request) {
  const host = request.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  if (!isLocalhost) {
    return NextResponse.json(
      { error: 'Dev login solo disponible en localhost' },
      { status: 403 }
    );
  }

  try {
    // Fallback sin Supabase: si no hay URL configurada, devolver datos mock
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      const mockStudent = {
        id: 'dev-mock-stargenius-001',
        ...DEV_STUDENT,
        avatar_url: null,
        current_streak: 3,
        max_streak: 7,
      };

      const token = await generateDevToken(mockStudent);

      return NextResponse.json({
        token,
        student: {
          id: mockStudent.id,
          firstName: mockStudent.first_name,
          lastName: mockStudent.last_name,
          code: mockStudent.code,
          avatarUrl: mockStudent.avatar_url,
          currentStreak: mockStudent.current_streak,
          maxStreak: mockStudent.max_streak,
        },
      });
    }

    // Con Supabase configurado: upsert en BD
    const { createServerClient } = await import('@/lib/supabase/server');
    const supabase = createServerClient();

    const { data: existingStudent } = await (supabase
      .from('students') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('external_id', DEV_STUDENT.external_id)
      .single();

    let student = existingStudent;

    if (!existingStudent) {
      const { data: newStudent, error: createError } = await (supabase
        .from('students') as ReturnType<typeof supabase.from>)
        .insert({
          external_id: DEV_STUDENT.external_id,
          first_name: DEV_STUDENT.first_name,
          last_name: DEV_STUDENT.last_name,
          email: DEV_STUDENT.email,
          code: DEV_STUDENT.code,
          family_id: DEV_STUDENT.family_id,
          current_streak: 0,
          max_streak: 0,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (createError) {
        console.error('Database error:', createError);
        return NextResponse.json(
          { error: 'Error al crear sesión de desarrollo' },
          { status: 500 }
        );
      }
      student = newStudent;
    } else {
      await (supabase
        .from('students') as ReturnType<typeof supabase.from>)
        .update({
          last_activity_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStudent.id);
    }

    if (!student) {
      return NextResponse.json(
        { error: 'Error al obtener estudiante' },
        { status: 500 }
      );
    }

    const token = await generateDevToken(student);

    return NextResponse.json({
      token,
      student: {
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        code: student.code,
        avatarUrl: student.avatar_url,
        currentStreak: student.current_streak,
        maxStreak: student.max_streak,
      },
    });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
