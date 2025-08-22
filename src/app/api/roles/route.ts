
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { ObjectId } from 'mongodb'; // Changed from type import to value import for ObjectId
import type { Collection, WithId, Document } from 'mongodb';
import { getSession } from '@/actions/auth';

// Define the structure for a Role as it is stored in MongoDB
interface RoleDocument extends Document {
  _id: ObjectId;
  name: string;
  author?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the structure for a Role as it will be sent to the client
export interface ClientRole {
  _id: string;
  name: string;
  author?: string;
  permissions: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export async function GET() {
  try {
    const sessionUser = await getSession();
    if (!sessionUser) {
      // Not authenticated, return empty or error
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db();
    const rolesCollection = db.collection<RoleDocument>('roles');
    const usersCollection = db.collection('users');

    let rolesArray: WithId<RoleDocument>[] = [];

    if (sessionUser.username === 'Admin') {
      // Admin sees all roles
      rolesArray = await rolesCollection.find({}).sort({ name: 1 }).toArray();
    } else {
      // Non-Admin user:
      // 1. Roles they authored
      const authoredRolesQuery = { author: sessionUser.username };
      const authoredRoles = await rolesCollection.find(authoredRolesQuery).toArray();
      
      // 2. Their own assigned role (if any)
      const currentUserDoc = await usersCollection.findOne({ _id: new ObjectId(sessionUser.id) });
      let assignedRoleDoc: WithId<RoleDocument> | null = null;
      if (currentUserDoc && currentUserDoc.roleId) {
        // Ensure currentUserDoc.roleId is an ObjectId. If it's already ObjectId from DB, direct use is fine.
        // If roleId could be a string, it would need new ObjectId(currentUserDoc.roleId as string)
        // Assuming roleId in users collection is already stored as ObjectId.
        assignedRoleDoc = await rolesCollection.findOne({ _id: currentUserDoc.roleId as ObjectId });
      }

      const rolesMap = new Map<string, WithId<RoleDocument>>();
      authoredRoles.forEach(role => {
        // Non-admins should not see the 'Admin' role in lists they manage, even if they somehow authored it (which shouldn't happen)
        if (role.name !== 'Admin') {
            rolesMap.set(role._id.toString(), role);
        }
      });

      if (assignedRoleDoc && assignedRoleDoc.name !== 'Admin') {
        rolesMap.set(assignedRoleDoc._id.toString(), assignedRoleDoc);
      }
      
      rolesArray = Array.from(rolesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    const clientRoles: ClientRole[] = rolesArray.map(role => ({
      _id: role._id.toString(),
      name: role.name,
      author: role.author,
      permissions: role.permissions || [],
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));

    return NextResponse.json({ roles: clientRoles });
  } catch (error) {
    console.error('Error fetching roles from MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    // Ensure the error message is not too revealing in production
    const responseMessage = process.env.NODE_ENV === 'development' ? errorMessage : 'Failed to fetch roles.';
    return NextResponse.json({ message: responseMessage }, { status: 500 });
  }
}
