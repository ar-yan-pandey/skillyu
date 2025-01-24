import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { workshopId } = await request.json();

    // Get the user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user is already registered
    const { data: existingRegistration } = await supabase
      .from('workshop_registrations')
      .select()
      .eq('user_id', userId)
      .eq('workshop_id', workshopId)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this workshop' },
        { status: 400 }
      );
    }

    // Register the user for the workshop
    const { error } = await supabase.from('workshop_registrations').insert([
      {
        user_id: userId,
        workshop_id: workshopId,
        registered_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    return NextResponse.json(
      { message: 'Successfully registered for workshop' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register for workshop' },
      { status: 500 }
    );
  }
}
