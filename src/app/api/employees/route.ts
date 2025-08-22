
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import type { Collection, WithId, Document } from 'mongodb';

// Define the structure for an Employee as it is stored in MongoDB
// and how we want to send it to the client.
interface EmployeeDocument extends Document {
  name: string;
  joinDate: string; // YYYY-MM-DD string
  position: "Super" | "Leader" | "Account Department" | "Operation" | "Security" | "Fire Safety" | "Cleaner";
  dob: string; // YYYY-MM-DD string
  gender: "Male" | "Female";
  phone: string;
  nrc?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the structure for an Employee as it will be sent to the client
// _id is converted to a string. Dates might be strings if not handled.
export interface ClientEmployee {
  _id: string;
  name: string;
  joinDate: string; 
  position: "Super" | "Leader" | "Account Department" | "Operation" | "Security" | "Fire Safety" | "Cleaner";
  dob: string; 
  gender: "Male" | "Female";
  phone: string;
  nrc?: string;
  address?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db(); // Assumes DB name is in MONGODB_URI or uses default
    const employeesCollection: Collection<EmployeeDocument> = db.collection<EmployeeDocument>('employees');

    const employeesArray: WithId<EmployeeDocument>[] = await employeesCollection.find({}).sort({ createdAt: -1 }).toArray();

    // Convert _id to string and ensure dates are strings for client
    const clientEmployees: ClientEmployee[] = employeesArray.map(emp => ({
      ...emp,
      _id: emp._id.toString(),
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
      // joinDate and dob are already strings (YYYY-MM-DD) from the add action
    }));

    return NextResponse.json({ employees: clientEmployees });
  } catch (error) {
    console.error('Error fetching employees from MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return NextResponse.json({ message: `Failed to fetch employees: ${errorMessage}` }, { status: 500 });
  }
}
