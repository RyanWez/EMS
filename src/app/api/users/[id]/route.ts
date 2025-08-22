
import { NextResponse } from 'next/server';
import { deleteUserAction } from '@/actions/userActions';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const result = await deleteUserAction(userId);

  if (!result.success) {
    // Determine appropriate status code based on error message if needed
    if (result.message.includes('Invalid user ID') || result.message.includes('User not found')) {
      return NextResponse.json({ message: result.message }, { status: 400 }); // Or 404
    }
    return NextResponse.json({ message: result.message, errors: result.errors }, { status: 500 });
  }

  return NextResponse.json({ message: result.message }, { status: 200 });
}
