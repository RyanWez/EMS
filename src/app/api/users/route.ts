
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { ObjectId, type WithId, type Document } from 'mongodb';
import type { ClientUser } from '@/actions/userActions';
import { getSession, type SessionUser } from '@/actions/auth'; // Import SessionUser

interface UserDocumentForApi extends Document {
  username: string;
  roleId: ObjectId;
  authorUsername?: string; // Added for filtering
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const session: SessionUser | null = await getSession();
    if (!session) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db();
    const usersCollection = db.collection<UserDocumentForApi>('users');

    let matchQuery: any = {};

    if (session.username !== 'Admin') {
      // Non-Admin users see their own account and accounts they created.
      // They should NOT see the 'Admin' account at all.
      matchQuery = {
        $and: [
          { username: { $ne: 'Admin' } }, // Exclude Admin account from non-admin views
          {
            $or: [
              { _id: new ObjectId(session.id) }, // Their own account
              { authorUsername: session.username } // Accounts they created
            ]
          }
        ]
      };
    } else {
      // Admin sees all users.
      matchQuery = {};
    }
    
    const usersWithRoles = await usersCollection.aggregate([
      {
        $match: matchQuery // Apply the filter query
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'roleId',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      {
        $unwind: {
          path: '$roleInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          username: 1,
          authorUsername: 1, // Pass through authorUsername
          createdAt: 1,
          updatedAt: 1,
          role: {
            _id: '$roleInfo._id',
            name: '$roleInfo.name'
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();
    
    const clientUsers: ClientUser[] = usersWithRoles.map((userDoc: any) => ({
      _id: userDoc._id.toString(),
      username: userDoc.username,
      authorUsername: userDoc.authorUsername,
      role: userDoc.role ? {
        _id: userDoc.role._id?.toString() || '',
        name: userDoc.role.name || 'Unknown Role'
      } : { _id: '', name: 'Unknown Role' },
      createdAt: userDoc.createdAt.toISOString(),
      updatedAt: userDoc.updatedAt.toISOString(),
    }));

    return NextResponse.json({ users: clientUsers });
  } catch (error) {
    console.error('Error fetching users from MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return NextResponse.json({ message: `Failed to fetch users: ${errorMessage}` }, { status: 500 });
  }
}
