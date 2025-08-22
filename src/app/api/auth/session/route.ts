
import { NextResponse } from 'next/server';
import { getSession } from '@/actions/auth'; // Using the server-side getSession

export async function GET() {
  try {
    const sessionUser = await getSession();
    if (sessionUser) {
      return NextResponse.json({ user: sessionUser });
    }
    return NextResponse.json({ user: null }, { status: 200 }); // No session, but not an error
  } catch (error) {
    console.error('[API /auth/session] Error fetching session:', error);
    return NextResponse.json({ message: 'Internal server error while fetching session' }, { status: 500 });
  }
}
