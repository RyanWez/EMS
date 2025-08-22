
'use server';

import { z } from 'zod';
import { getMongoClient } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@/actions/auth'; 
import { ALL_PERMISSIONS } from '@/config/permissions'; 

export interface ClientRole {
  _id: string;
  name: string;
  author?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

const addRoleSchema = z.object({
  name: z.string().min(1, { message: 'Role name is required.' }).max(50, { message: 'Role name must be 50 characters or less.' }),
});

export type AddRoleData = Omit<z.infer<typeof addRoleSchema>, 'permissions'> & { permissions?: string[] };


export interface AddRoleActionState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    permissions?: string[];
    general?: string[];
  };
  newRole?: ClientRole;
}

export async function addRoleAction(data: AddRoleData): Promise<AddRoleActionState> {
  const validatedFields = addRoleSchema.safeParse({ name: data.name });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name } = validatedFields.data;
  const permissions = data.permissions || []; 

  if (name.toLowerCase() === 'admin') {
      return {
          success: false,
          message: 'The role name "Admin" is reserved and cannot be manually created.',
          errors: { name: ['The role name "Admin" is reserved.'] },
      };
  }

  try {
    const client = await getMongoClient();
    const db = client.db();
    const rolesCollection = db.collection('roles');

    const existingRole = await rolesCollection.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingRole) {
      return {
        success: false,
        message: 'Role name already exists. Please use a different name.',
        errors: { name: ['Role name already exists.'] },
      };
    }

    const session = await getSession();
    const authorName = session?.username || 'System';

    const roleToInsert = {
      name,
      author: authorName,
      permissions: permissions, 
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await rolesCollection.insertOne(roleToInsert);

    if (result.insertedId) {
      const createdRole: ClientRole = {
        _id: result.insertedId.toString(),
        name: roleToInsert.name,
        author: roleToInsert.author,
        permissions: roleToInsert.permissions,
        createdAt: roleToInsert.createdAt.toISOString(),
        updatedAt: roleToInsert.updatedAt.toISOString(),
      };
      return {
        success: true,
        message: 'Role added successfully.',
        newRole: createdRole,
      };
    } else {
      return {
        success: false,
        message: 'Failed to add role to the database.',
      };
    }
  } catch (error) {
    console.error('Error adding role to MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return {
      success: false,
      message: `Failed to add role: ${errorMessage}`,
      errors: { general: [`Database operation failed: ${errorMessage}`] },
    };
  }
}

const editRoleSchema = z.object({
  _id: z.string().refine((val) => ObjectId.isValid(val), { message: 'Invalid role ID.' }),
  name: z.string().min(1, { message: 'Role name is required.' }).max(50, { message: 'Role name must be 50 characters or less.' }),
  permissions: z.array(z.string()).optional().default([]),
});
export type EditRoleData = z.infer<typeof editRoleSchema>;

export interface EditRoleActionState {
  success: boolean;
  message: string;
  errors?: {
    _id?: string[];
    name?: string[];
    permissions?: string[];
    general?: string[];
  };
  updatedRole?: ClientRole;
}

export async function editRoleAction(data: EditRoleData): Promise<EditRoleActionState> {
  const validatedFields = editRoleSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input data for update.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { _id, name: submittedName, permissions: submittedPermissions } = validatedFields.data;
  let finalName = submittedName;
  let finalPermissions = submittedPermissions || [];

  try {
    const client = await getMongoClient();
    const db = client.db();
    const rolesCollection = db.collection('roles');
    const session = await getSession();

    if (!session) {
        return { success: false, message: 'Authentication required to edit roles.' };
    }

    const roleBeingEdited = await rolesCollection.findOne({ _id: new ObjectId(_id) });
    if (!roleBeingEdited) {
        return { success: false, message: 'Role not found.' };
    }

    const isTheAdminRoleBeingEdited = roleBeingEdited.name === 'Admin';
    const isCurrentUserAdmin = session.username === 'Admin';

    if (isTheAdminRoleBeingEdited) {
      finalName = 'Admin'; 
      finalPermissions = ALL_PERMISSIONS.map(p => p.id); 
      console.log("[RoleAction:edit] Editing the 'Admin' role. Name and all permissions enforced.");
    } else {
      if (finalName.toLowerCase() === 'admin') {
        return {
          success: false,
          message: 'The role name "Admin" is reserved. Please use a different name.',
          errors: { name: ['The role name "Admin" is reserved.'] },
        };
      }
      if (finalName.toLowerCase() !== roleBeingEdited.name.toLowerCase()) {
          const existingRoleWithName = await rolesCollection.findOne({
            name: { $regex: `^${finalName}$`, $options: 'i' },
            _id: { $ne: new ObjectId(_id) },
          });
          if (existingRoleWithName) {
            return {
              success: false,
              message: 'Another role with this name already exists. Please use a different name.',
              errors: { name: ['Role name already exists.'] },
            };
          }
      }

      if (!isCurrentUserAdmin) {
        const currentUserActualPermissions = session.permissions || [];
        const invalidPermissionsToAssign = finalPermissions.filter(p => !currentUserActualPermissions.includes(p));
        if (invalidPermissionsToAssign.length > 0) {
          return {
            success: false,
            message: `You do not have permission to assign the following permissions: ${invalidPermissionsToAssign.join(', ')}.`,
            errors: { permissions: [`Cannot assign permissions you do not possess: ${invalidPermissionsToAssign.join(', ')}`] },
          };
        }
      }
    }

    const updateData = {
        name: finalName,
        permissions: finalPermissions,
        updatedAt: new Date(),
    };

    const updateResult = await rolesCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    const updatedDoc = await rolesCollection.findOne({ _id: new ObjectId(_id) });

    // Check if modifiedCount is 0 but matchedCount is 1 (meaning, no actual data change but doc exists)
    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1 && updatedDoc) {
        const plainRoleToReturn: ClientRole = {
            _id: updatedDoc._id.toString(),
            name: updatedDoc.name,
            author: updatedDoc.author,
            permissions: updatedDoc.permissions || [],
            createdAt: (updatedDoc.createdAt as Date).toISOString(),
            updatedAt: (updatedDoc.updatedAt as Date).toISOString(),
        };
        return {
            success: true,
            message: isTheAdminRoleBeingEdited ? 'Admin role is already up to date.' : 'Role data is already up to date.',
            updatedRole: plainRoleToReturn,
        };
    }


    if (updatedDoc) {
      const plainUpdatedRole: ClientRole = {
        _id: updatedDoc._id.toString(),
        name: updatedDoc.name,
        author: updatedDoc.author,
        permissions: updatedDoc.permissions || [],
        createdAt: (updatedDoc.createdAt as Date).toISOString(),
        updatedAt: (updatedDoc.updatedAt as Date).toISOString(),
      };
      return {
        success: true,
        message: 'Role updated successfully.',
        updatedRole: plainUpdatedRole,
      };
    } else {
      return { success: false, message: 'Failed to retrieve updated role data after update.' };
    }

  } catch (error) {
    console.error('Error updating role in MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return {
      success: false,
      message: `Failed to update role: ${errorMessage}`,
      errors: { general: [`Database operation failed: ${errorMessage}`] },
    };
  }
}


export interface DeleteRoleActionState {
    success: boolean;
    message: string;
    errors?: { general?: string[] };
}

export async function deleteRoleAction(roleId: string): Promise<DeleteRoleActionState> {
    if (!roleId || !ObjectId.isValid(roleId)) {
        return { success: false, message: 'Invalid role ID provided.' };
    }

    try {
        const client = await getMongoClient();
        const db = client.db();
        const rolesCollection = db.collection('roles');

        const roleToDelete = await rolesCollection.findOne({ _id: new ObjectId(roleId) });
        if (roleToDelete && roleToDelete.name === 'Admin') {
            return { success: false, message: 'The "Admin" role cannot be deleted.' };
        }

        const result = await rolesCollection.deleteOne({ _id: new ObjectId(roleId) });

        if (result.deletedCount === 0) {
            return { success: false, message: 'Role not found or already deleted.' };
        }

        // TODO: Consider implications of deleting a role that is currently assigned to users.
        // For now, we just delete the role. Users assigned this role will effectively have no permissions
        // from this role anymore. Their roleId in the users collection will point to a non-existent role.

        return { success: true, message: 'Role deleted successfully.' };
    } catch (error) {
        console.error('Error deleting role from MongoDB:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
        return {
            success: false,
            message: `Failed to delete role: ${errorMessage}`,
            errors: { general: [`Database operation failed: ${errorMessage}`] },
        };
    }
}

    