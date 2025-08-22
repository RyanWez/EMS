
'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getMongoClient } from '@/lib/mongodb';
import type { ObjectId, WithId, Document } from 'mongodb';
import { ALL_PERMISSIONS } from '@/config/permissions'; // Import all defined permissions

const LoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

interface UserDocumentForAuth extends Document {
  username: string;
  hashedPassword?: string;
  roleId: ObjectId;
  authorUsername?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleDocumentForAuth extends Document {
  _id: ObjectId;
  name: string;
  author?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  username: string;
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
}

export interface LoginState {
  success: boolean;
  message: string;
  redirectTo?: string;
  user?: SessionUser;
  errors?: {
    username?: string[];
    password?: string[];
    general?: string[];
  };
}

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'ems_session';

// Safely get admin credentials from environment variables with defaults
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'Admin';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'ems137245';

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env.local. Authentication will not work.");
}
if (!process.env.DEFAULT_ADMIN_USERNAME || !process.env.DEFAULT_ADMIN_PASSWORD) {
    console.warn("WARNING: DEFAULT_ADMIN_USERNAME or DEFAULT_ADMIN_PASSWORD are not set in .env. Default values will be used.");
}


export async function loginUser(
  prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  if (!JWT_SECRET) {
    return {
      success: false,
      message: 'Authentication system configuration error. Please contact support.',
      errors: { general: ['JWT secret is missing.'] },
    };
  }

  const validatedFields = LoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password: plainPassword } = validatedFields.data;

  console.log(`[AuthAction] Attempting login for user: ${username}`);

  try {
    const client = await getMongoClient();
    const db = client.db();
    const usersCollection = db.collection<UserDocumentForAuth>('users');
    const rolesCollection = db.collection<RoleDocumentForAuth>('roles');
    let adminRoleId: ObjectId;
    let userToAuth: WithId<UserDocumentForAuth> | null = null;

    // --- Admin User and Role Bootstrapping Logic ---
    if (username === DEFAULT_ADMIN_USERNAME) {
      console.log('[AuthAction] Admin login attempt detected. Checking for Admin role and user existence...');
      let adminRole = await rolesCollection.findOne({ name: 'Admin' });

      if (!adminRole) {
        console.log('[AuthAction] "Admin" role not found. Creating "Admin" role with all permissions...');
        const allPermissionIds = ALL_PERMISSIONS.map(p => p.id);
        const newAdminRoleData = {
          name: 'Admin',
          author: 'System', 
          permissions: allPermissionIds,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const insertRoleResult = await rolesCollection.insertOne(newAdminRoleData as any); 
        if (!insertRoleResult.insertedId) {
          console.error('[AuthAction] CRITICAL: Failed to create "Admin" role.');
          return { success: false, message: 'System error: Could not initialize Admin role.' };
        }
        adminRoleId = insertRoleResult.insertedId;
        console.log(`[AuthAction] "Admin" role created with ID: ${adminRoleId.toString()} and ${allPermissionIds.length} permissions.`);
      } else {
        adminRoleId = adminRole._id;
        // Ensure existing Admin role has all permissions
        const allPermissionIdsFromConfig = ALL_PERMISSIONS.map(p => p.id);
        const needsDbUpdate = allPermissionIdsFromConfig.length !== (adminRole.permissions || []).length ||
                             !allPermissionIdsFromConfig.every(pId => (adminRole.permissions || []).includes(pId));
        if (needsDbUpdate) {
            await rolesCollection.updateOne(
                { _id: adminRole._id },
                { $set: { permissions: allPermissionIdsFromConfig, updatedAt: new Date(), author: adminRole.author || 'System' } }
            );
            console.log(`[AuthAction] Updated "Admin" role in DB to ensure all ${allPermissionIdsFromConfig.length} permissions.`);
        }
      }

      userToAuth = await usersCollection.findOne({ username: DEFAULT_ADMIN_USERNAME });
      if (!userToAuth) {
        console.log('[AuthAction] "Admin" user not found. Creating "Admin" user...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, saltRounds);
        const newAdminUserData = {
          username: DEFAULT_ADMIN_USERNAME,
          hashedPassword: hashedPassword,
          roleId: adminRoleId,
          authorUsername: 'System',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const insertUserResult = await usersCollection.insertOne(newAdminUserData as any);
        if (!insertUserResult.insertedId) {
          console.error('[AuthAction] CRITICAL: Failed to create "Admin" user.');
          return { success: false, message: 'System error: Could not initialize Admin user.' };
        }
        console.log(`[AuthAction] "Admin" user created with default password and linked to role ID: ${adminRoleId.toString()}.`);
        // Re-fetch the user to proceed with login
        userToAuth = await usersCollection.findOne({ _id: insertUserResult.insertedId });
        if (!userToAuth) { // Should not happen
             console.error('[AuthAction] CRITICAL: Failed to fetch newly created "Admin" user.');
             return { success: false, message: 'System error: Could not retrieve Admin user after creation.' };
        }
      }
    } else {
      userToAuth = await usersCollection.findOne({ username: username });
    }
    // --- End of Admin Bootstrapping Logic ---

    if (!userToAuth || !userToAuth.hashedPassword) {
      console.log(`[AuthAction] User '${username}' not found or has no password set.`);
      return { success: false, message: 'Invalid username or password.' };
    }
    console.log(`[AuthAction] User '${username}' found in DB.`);

    const passwordMatches = await bcrypt.compare(plainPassword, userToAuth.hashedPassword);

    if (!passwordMatches) {
      console.log(`[AuthAction] Password does not match for user: ${username}`);
      return { success: false, message: 'Invalid username or password.' };
    }
    console.log(`[AuthAction] Password matches for user: ${username}`);

    let roleDoc = await rolesCollection.findOne({ _id: userToAuth.roleId });

    if (!roleDoc) {
      if (userToAuth.username === DEFAULT_ADMIN_USERNAME) {
        console.warn(`[AuthAction] Admin user's role (ID: ${userToAuth.roleId}) not found. Re-fetching/Ensuring Admin role by name.`);
        roleDoc = await rolesCollection.findOne({ name: 'Admin' });
        if (!roleDoc) { 
          console.error(`[AuthAction] CRITICAL: "Admin" role document is missing even after bootstrap attempt for Admin user.`);
          return { success: false, message: 'Critical system error: Admin role misconfiguration.', errors: { general: ['Admin role not found.'] } };
        }
        if (!userToAuth.roleId.equals(roleDoc._id)) {
            await usersCollection.updateOne({ _id: userToAuth._id }, { $set: { roleId: roleDoc._id, updatedAt: new Date() }});
            console.log(`[AuthAction] Corrected Admin user's roleId in DB to ${roleDoc._id.toString()}`);
        }
      } else {
        console.error(`[AuthAction] Role not found for user: ${username} (roleId: ${userToAuth.roleId})`);
        return {
          success: false,
          message: 'User role configuration error. Please contact administrator.',
          errors: { general: ['User role not found.'] },
        };
      }
    }
    console.log(`[AuthAction] Fetched roleDoc for user: ${username}`, JSON.stringify(roleDoc, null, 2));

    let userPermissions: string[];

    if (userToAuth.username === DEFAULT_ADMIN_USERNAME) {
      userPermissions = ALL_PERMISSIONS.map(p => p.id);
      console.log(`[AuthAction] User '${DEFAULT_ADMIN_USERNAME}' detected. Assigning all ${userPermissions.length} permissions for session.`);
    } else {
      userPermissions = roleDoc.permissions || [];
      console.log(`[AuthAction] Permissions for user ${username} from database role '${roleDoc.name}':`, userPermissions);
    }
    console.log(`[AuthAction] Number of permissions for ${username}: ${userPermissions.length}`);


    const sessionUser: SessionUser = {
      id: userToAuth._id.toString(),
      username: userToAuth.username,
      role: {
        id: roleDoc._id.toString(),
        name: roleDoc.name,
      },
      permissions: userPermissions,
    };
    console.log(`[AuthAction] SessionUser object being created for JWT for ${username}:`, JSON.stringify(sessionUser, null, 2));


    const token = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: '7d' });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    });

    return {
      success: true,
      message: 'Login successful! Preparing your dashboard...',
      redirectTo: '/dashboard',
      user: sessionUser,
    };

  } catch (error) {
    console.error('[AuthAction] Error during database operation or login:', error);
    return {
      success: false,
      message: 'An internal server error occurred. Please try again later.',
      errors: { general: ['Database operation failed.'] },
    };
  }
}

export async function logoutUserAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return { success: true, message: 'Logged out successfully.' };
  } catch (error) {
    console.error('[AuthAction] Error during logout:', error);
    return { success: false, message: 'Logout failed.' };
  }
}

export async function getSession(): Promise<SessionUser | null> {
  if (!JWT_SECRET) {
    console.error("[AuthAction:getSession] JWT_SECRET is not defined.");
    return null;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch (error) {
    console.warn('[AuthAction:getSession] Invalid or expired token:', error);
    cookieStore.delete(COOKIE_NAME);
    return null;
  }
}
