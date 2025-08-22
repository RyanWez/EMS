
'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getMongoClient } from '@/lib/mongodb';
import { ObjectId, type WithId, type Document } from 'mongodb';
import type { ClientRole } from './roleActions';
import { getSession } from '@/actions/auth'; // Import getSession

// --- Interfaces and Schemas ---

interface UserDocument extends Document {
  username: string;
  hashedPassword?: string;
  roleId: ObjectId;
  authorUsername?: string; // Added to track who created the user
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientUser {
  _id: string;
  username:string;
  role: Pick<ClientRole, '_id' | 'name'>;
  authorUsername?: string; // Optionally include if needed on client, matches DB
  createdAt: string;
  updatedAt: string;
}

const addUserFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).max(50, { message: 'Username must be 50 characters or less.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
  roleId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid role ID." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

export type AddUserFormData = z.infer<typeof addUserFormSchema>;

export interface AddUserActionState {
  success: boolean;
  message: string;
  errors?: {
    username?: string[];
    password?: string[];
    confirmPassword?: string[];
    roleId?: string[];
    general?: string[];
  };
  newUser?: ClientUser;
}

const editUserFormSchema = z.object({
  _id: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid user ID." }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).max(50, { message: 'Username must be 50 characters or less.' }),
  roleId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid role ID." }),
});

export type EditUserFormData = z.infer<typeof editUserFormSchema>;

export interface EditUserActionState {
  success: boolean;
  message: string;
  errors?: {
    _id?: string[];
    username?: string[];
    roleId?: string[];
    general?: string[];
  };
  updatedUser?: ClientUser;
}


// --- Server Actions ---

export async function addUserAction(
  data: AddUserFormData
): Promise<AddUserActionState> {
  const validatedFields = addUserFormSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password, roleId } = validatedFields.data;

  if (username.toLowerCase() === 'admin') {
    return {
      success: false,
      message: 'The username "Admin" is reserved and cannot be manually created.',
      errors: { username: ['The username "Admin" is reserved.'] },
    };
  }

  try {
    const session = await getSession();
    if (!session) {
        return { success: false, message: "Authentication required to add users." };
    }

    const client = await getMongoClient();
    const db = client.db();
    const usersCollection = db.collection<Omit<UserDocument, '_id'>>('users');
    const rolesCollection = db.collection('roles');

    const existingUser = await usersCollection.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    if (existingUser) {
      return {
        success: false,
        message: 'Username already exists. Please choose a different username.',
        errors: { username: ['Username already exists.'] },
      };
    }

    const roleObjectId = new ObjectId(roleId);
    const roleDoc = await rolesCollection.findOne({ _id: roleObjectId });
    if (!roleDoc) {
        return {
            success: false,
            message: 'Selected role does not exist.',
            errors: { roleId: ['Invalid role selected.'] },
        };
    }
    
    if (roleDoc.name === 'Admin') {
        if (username.toLowerCase() !== 'admin') { 
             return {
                success: false,
                message: 'The "Admin" role can only be assigned to the "Admin" user.',
                errors: { roleId: ['Cannot assign "Admin" role to this user.'] },
            };
        }
    }

    if (session.username !== 'Admin') {
        if (roleDoc.author !== session.username) {
            return {
                success: false,
                message: 'You can only assign roles that you have created.',
                errors: { roleId: ['Permission denied to assign this role.'] },
            };
        }
    }


    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userToInsert = {
      username,
      hashedPassword,
      roleId: roleObjectId,
      authorUsername: session.username, // Store the creator's username
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(userToInsert);

    if (result.insertedId) {
      const createdUserForClient: ClientUser = {
        _id: result.insertedId.toString(),
        username: userToInsert.username,
        authorUsername: userToInsert.authorUsername,
        role: {
            _id: roleDoc._id.toString(),
            name: roleDoc.name as string,
        },
        createdAt: userToInsert.createdAt.toISOString(),
        updatedAt: userToInsert.updatedAt.toISOString(),
      };
      return {
        success: true,
        message: 'User added successfully.',
        newUser: createdUserForClient,
      };
    } else {
      return {
        success: false,
        message: 'Failed to add user to the database.',
      };
    }
  } catch (error) {
    console.error('Error adding user to MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return {
      success: false,
      message: `Failed to add user: ${errorMessage}`,
      errors: { general: [`Database operation failed: ${errorMessage}`] },
    };
  }
}

export async function editUserAction(
  data: EditUserFormData
): Promise<EditUserActionState> {
  const validatedFields = editUserFormSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input data for update.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let { _id, username, roleId } = validatedFields.data;

  try {
    const session = await getSession();
    if (!session) {
        return { success: false, message: "Authentication required to edit users." };
    }

    const client = await getMongoClient();
    const db = client.db();
    const usersCollection = db.collection('users');
    const rolesCollection = db.collection('roles');

    const userObjectId = new ObjectId(_id);
    const userBeingEdited = await usersCollection.findOne({ _id: userObjectId });

    if (!userBeingEdited) {
        return { success: false, message: 'User not found.' };
    }

    const isTheAdminUserBeingEdited = userBeingEdited.username === 'Admin';

    if (isTheAdminUserBeingEdited) {
        username = 'Admin'; // Enforce Admin username
        const adminRoleDocFromDb = await rolesCollection.findOne({ name: 'Admin' });
        if (!adminRoleDocFromDb) {
            console.error("[EditUserAction] CRITICAL: 'Admin' role not found in DB while editing Admin user.");
            return { success: false, message: "Critical error: Admin role missing. Contact support." };
        }
        roleId = adminRoleDocFromDb._id.toString(); // Enforce Admin role for Admin user
    } else {
        // For non-Admin users being edited:
        if (username.toLowerCase() === 'admin') { 
            return {
                success: false,
                message: 'The username "Admin" is reserved.',
                errors: { username: ['The username "Admin" is reserved.'] },
            };
        }
    }

    if (!isTheAdminUserBeingEdited && username.toLowerCase() !== userBeingEdited.username.toLowerCase()) {
        const existingUserWithNewName = await usersCollection.findOne({
            username: { $regex: `^${username}$`, $options: 'i' },
            _id: { $ne: userObjectId }, 
        });
        if (existingUserWithNewName) {
            return {
                success: false,
                message: 'This username is already taken by another user.',
                errors: { username: ['Username already exists.'] },
            };
        }
    }

    const targetRoleObjectId = new ObjectId(roleId);
    const finalRoleDoc = await rolesCollection.findOne({ _id: targetRoleObjectId });
    if (!finalRoleDoc) {
      return {
        success: false,
        message: 'Selected role does not exist.',
        errors: { roleId: ['Invalid role selected.'] },
      };
    }

    if (finalRoleDoc.name === 'Admin' && username.toLowerCase() !== 'admin') {
      return {
        success: false,
        message: 'The "Admin" role can only be assigned to the "Admin" user.',
        errors: { roleId: ['Cannot assign "Admin" role to this user.'] },
      };
    }
    
    if (session.username !== 'Admin' && !isTheAdminUserBeingEdited) {
        if (finalRoleDoc.author !== session.username) {
            return {
                success: false,
                message: 'You can only assign roles that you have created.',
                errors: { roleId: ['Permission denied to assign this role.'] },
            };
        }
    }


    const updateResult = await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          username,
          roleId: targetRoleObjectId,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return { success: false, message: 'User not found.' };
    }

    const updatedDoc = await usersCollection.findOne({ _id: userObjectId });

    if (updateResult.modifiedCount === 0 && updatedDoc) {
        const clientUser: ClientUser = {
            _id: updatedDoc._id.toString(),
            username: updatedDoc.username,
            authorUsername: updatedDoc.authorUsername,
            role: { _id: finalRoleDoc._id.toString(), name: finalRoleDoc.name as string },
            createdAt: (updatedDoc.createdAt as Date).toISOString(),
            updatedAt: (updatedDoc.updatedAt as Date).toISOString(),
        };
        return { success: true, message: isTheAdminUserBeingEdited ? 'Admin user data is already up to date.' : 'User data is already up to date.', updatedUser: clientUser };
    }

    if (updatedDoc) {
      const clientUser: ClientUser = {
        _id: updatedDoc._id.toString(),
        username: updatedDoc.username,
        authorUsername: updatedDoc.authorUsername,
        role: { _id: finalRoleDoc._id.toString(), name: finalRoleDoc.name as string },
        createdAt: (updatedDoc.createdAt as Date).toISOString(),
        updatedAt: (updatedDoc.updatedAt as Date).toISOString(),
      };
      return { success: true, message: 'User updated successfully.', updatedUser: clientUser };
    } else {
      return { success: false, message: 'Failed to retrieve updated user data.' };
    }

  } catch (error) {
    console.error('Error updating user in MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return {
      success: false,
      message: `Failed to update user: ${errorMessage}`,
      errors: { general: [`Database operation failed: ${errorMessage}`] },
    };
  }
}

export interface DeleteUserActionState {
    success: boolean;
    message: string;
    errors?: { general?: string[] };
}

export async function deleteUserAction(userId: string): Promise<DeleteUserActionState> {
    if (!userId || !ObjectId.isValid(userId)) {
        return { success: false, message: 'Invalid user ID provided.' };
    }

    try {
        const client = await getMongoClient();
        const db = client.db();
        const usersCollection = db.collection('users');

        const userToDelete = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (userToDelete && userToDelete.username === 'Admin') {
            return { success: false, message: 'The "Admin" user account cannot be deleted.' };
        }

        const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

        if (result.deletedCount === 0) {
            return { success: false, message: 'User not found or already deleted.' };
        }

        return { success: true, message: 'User deleted successfully.' };
    } catch (error) {
        console.error('Error deleting user from MongoDB:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
        return {
            success: false,
            message: `Failed to delete user: ${errorMessage}`,
            errors: { general: [`Database operation failed: ${errorMessage}`] },
        };
    }
}

