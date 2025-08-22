
import { NextResponse } from 'next/server';
import { logoutUserAction } from '@/actions/auth'; // Assuming you rename it

export async function POST() {
  try {
    const result = await logoutUserAction();
    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    }
    return NextResponse.json({ message: result.message || 'Logout failed' }, { status: 400 });
  } catch (error) {
    console.error('[API /auth/logout] Error during logout:', error);
    return NextResponse.json({ message: 'Internal server error during logout' }, { status: 500 });
  }
}
