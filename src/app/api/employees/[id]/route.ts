
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const employeeId = params.id;

  if (!employeeId || !ObjectId.isValid(employeeId)) {
    return NextResponse.json({ message: 'Invalid employee ID provided.' }, { status: 400 });
  }

  try {
    const client = await getMongoClient();
    const db = client.db();
    const employeesCollection = db.collection('employees');

    const result = await employeesCollection.deleteOne({ _id: new ObjectId(employeeId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Employee not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Employee deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting employee from MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return NextResponse.json({ message: `Failed to delete employee: ${errorMessage}` }, { status: 500 });
  }
}
