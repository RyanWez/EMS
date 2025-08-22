
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UsersRound, PlusCircle, Loader2, ShieldCheck, ShieldAlert, Edit3, Trash2, BadgeInfo } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import type { ClientRole } from '@/actions/roleActions';
import { deleteRoleAction } from '@/actions/roleActions';
import { AddRoleDialog } from '@/components/dialogs/AddRoleDialog';
import { EditRoleDialog } from '@/components/dialogs/EditRoleDialog';
import { ManagePermissionsDialog } from '@/components/dialogs/ManagePermissionsDialog';
import { useAuth } from '@/hooks/useAuth';

export default function UserRolesPage() {
  const { user: sessionUser, isLoading: authLoading, hasPermission } = useAuth();
  const [roles, setRoles] = useState<ClientRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleToDelete, setRoleToDelete] = useState<ClientRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [roleToEdit, setRoleToEdit] = useState<ClientRole | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [roleForPermissions, setRoleForPermissions] = useState<ClientRole | null>(null);
  const [isManagePermissionsDialogOpen, setIsManagePermissionsDialogOpen] = useState(false);

  const { toast } = useToast();

  const canViewPage = hasPermission('user_roles:view_roles_page');
  const canAddNewRole = hasPermission('user_roles:add_new_role');
  const canEditRoleDetailsAction = hasPermission('user_roles:edit_role_action'); // For role name editing
  const canManagePermissionsAction = hasPermission('user_roles:edit_role_action'); // For opening permissions dialog
  const canDeleteRoleAction = hasPermission('user_roles:delete_role_action');


  const fetchRoles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch roles: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to fetch roles: ${response.statusText}`);
      }
      const data: { roles: ClientRole[] } = await response.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && canViewPage) {
      fetchRoles();
    } else if (!authLoading && !canViewPage) {
        setError("You do not have permission to view this page.");
        setIsLoading(false);
    }
  }, [authLoading, canViewPage]);

  const handleRoleAdded = (newRole: ClientRole) => {
    setRoles(prevRoles => [...prevRoles, newRole].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleRoleUpdated = (updatedRole: ClientRole) => {
    setRoles(prevRoles =>
      prevRoles.map(r => (r._id === updatedRole._id ? updatedRole : r)).sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsEditDialogOpen(false);
    setIsManagePermissionsDialogOpen(false);
  };

  const openDeleteDialog = (role: ClientRole) => {
    if (role.name === 'Admin') {
        toast({ title: 'Action Not Allowed', description: 'The "Admin" role cannot be deleted.', variant: 'warning' });
        return;
    }
    setRoleToDelete(role);
  };

  const openEditDialog = (role: ClientRole) => {
     if (role.name === 'Admin') { // Admin role name cannot be edited via this dialog
        toast({ title: 'Action Not Allowed', description: 'The "Admin" role name cannot be edited. Permissions are managed separately and are fixed.', variant: 'warning' });
        return;
    }
    setRoleToEdit(role);
    setIsEditDialogOpen(true);
  };

  const openManagePermissionsDialog = (role: ClientRole) => {
    setRoleForPermissions(role);
    setIsManagePermissionsDialogOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete || roleToDelete.name === 'Admin') return;
    setIsDeleting(true);
    const originalRoles = [...roles];
    const roleNameBeingDeleted = roleToDelete.name;

    setRoles(prevRoles => prevRoles.filter(r => r._id !== roleToDelete._id));
    setRoleToDelete(null);

    try {
      const result = await deleteRoleAction(roleToDelete._id);
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete role.');
      }
      toast({
        title: 'Role Deleted',
        description: `Role "${roleNameBeingDeleted}" has been successfully deleted.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error Deleting Role',
        description: err instanceof Error ? err.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
      setRoles(originalRoles);
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a,b) => {
        if (a.name === 'Admin') return -1;
        if (b.name === 'Admin') return 1;
        if (a.name.toLowerCase() === b.name.toLowerCase()) {
            return (a.author || '').localeCompare(b.author || '');
        }
        return a.name.localeCompare(b.name);
    });
  }, [roles]);


  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading roles...</p>
      </div>
    );
  }

  if (!canViewPage) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">{error || "You do not have permission to view this page."}</p>
      </div>
    );
  }


  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="pb-4 border-b border-border space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center">
            <UsersRound className="h-7 w-7 mr-3 text-primary" /> User Roles & Permissions
          </h2>
          {canAddNewRole && (
            <AddRoleDialog onRoleAdded={handleRoleAdded}>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Role
                </Button>
            </AddRoleDialog>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Manage user roles and their assigned permissions within the application.
        </p>
      </div>

      <AlertDialog open={(!!roleToDelete)} onOpenChange={(open) => {
          if (!open) {
            setRoleToDelete(null);
          }
      }}>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="min-w-[200px]">Role [Name]</TableHead>
                  <TableHead className="min-w-[150px]">Author</TableHead>
                  <TableHead className="w-[180px] text-center sticky right-0 bg-muted z-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border bg-card">
                {isLoading && roles.length === 0 ? ( // Added roles.length === 0 check
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-lg text-muted-foreground">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary my-4" />
                      Loading roles...
                    </TableCell>
                  </TableRow>
                ) : error && roles.length === 0 ? ( // Added roles.length === 0 check
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-lg text-destructive">
                      Error loading roles: {error}
                    </TableCell>
                  </TableRow>
                ) : sortedRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-lg text-muted-foreground">
                      No roles defined yet.
                      {canAddNewRole && <><br />Click "Add New Role" to get started.</>}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRoles.map((role, index) => {
                    const isAdminRole = role.name === 'Admin';
                    let displayAuthor = role.author;
                    if (isAdminRole && (role.author === 'System' || role.author === 'N/A' || !role.author)) {
                        displayAuthor = 'EMS';
                    }

                    const canEditCurrentRoleName = canEditRoleDetailsAction && !isAdminRole;
                    const canDeleteCurrentRole = canDeleteRoleAction && !isAdminRole;
                    // All users with 'user_roles:edit_role_action' can open the permissions dialog.
                    // The dialog itself will handle what permissions can be seen/assigned.
                    const canOpenManagePermissionsDialog = canManagePermissionsAction; 

                    return (
                    <TableRow key={role._id} className={cn("group hover:bg-muted", isDeleting && roleToDelete?._id === role._id && "opacity-50")}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{role.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{displayAuthor || "N/A"}</TableCell>
                      <TableCell className="text-center sticky right-0 bg-card group-hover:bg-muted z-[5] w-[180px]">
                        <div className="flex flex-col items-stretch justify-center space-y-1.5 py-1 px-2">
                         {canOpenManagePermissionsDialog ? (
                            <Button
 variant={isAdminRole ? "outline" : "outline"}
                              size="sm"
                              className={cn(
                                "w-full h-auto py-1.5 px-2 text-xs justify-start",
                                isAdminRole ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-blue-500/50 hover:border-blue-500 text-blue-500 hover:bg-blue-500/5"
                              )}
                              onClick={() => openManagePermissionsDialog(role)}
                              disabled={isDeleting}
                              title={isAdminRole ? "View Admin Permissions (All)" :`Manage permissions for ${role.name}`}
                            >
                              {isAdminRole ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> : <BadgeInfo className="mr-1.5 h-3.5 w-3.5" />}
                              Permissions
                            </Button>
                          ) : (
                             <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-auto py-1.5 px-2 text-xs justify-start cursor-not-allowed opacity-50"
                                disabled={true}
                                title="You do not have permission to manage permissions."
                             >
                               <BadgeInfo className="mr-1.5 h-3.5 w-3.5" />
                               Permissions
                             </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-full h-auto py-1.5 px-2 text-xs justify-start",
                                isAdminRole || !canEditCurrentRoleName // Disable for Admin or if user lacks general edit perm
                                ? "border-muted text-muted-foreground/70 cursor-not-allowed opacity-50"
                                : "border-primary/50 hover:border-primary text-primary hover:bg-primary/5"
                            )}
                            onClick={() => openEditDialog(role)}
                            disabled={isDeleting || isAdminRole || !canEditCurrentRoleName}
                            title={isAdminRole ? "Admin role name cannot be edited." : !canEditCurrentRoleName ? "You do not have permission to edit role names." : `Edit ${role.name}`}
                          >
                            <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                          </Button>

                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "w-full h-auto py-1.5 px-2 text-xs justify-start",
                                isAdminRole || !canDeleteCurrentRole
                                ? "border-muted text-muted-foreground/70 cursor-not-allowed opacity-50"
                                : "border-destructive/50 hover:border-destructive text-destructive hover:bg-destructive/5"
                              )}
                              onClick={() => !isAdminRole && canDeleteCurrentRole && openDeleteDialog(role)}
                              disabled={isDeleting || isAdminRole || !canDeleteCurrentRole}
                              title={isAdminRole ? "Admin role cannot be deleted." : !canDeleteCurrentRole ? "You do not have permission to delete roles." : `Delete ${role.name}`}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {roleToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the role <strong className="text-foreground">{roleToDelete.name}</strong>.
                 Users currently assigned this role will lose these permissions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} onClick={() => setRoleToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteRole}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <EditRoleDialog
        isOpen={isEditDialogOpen}
        onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setRoleToEdit(null);
        }}
        role={roleToEdit}
        onRoleUpdated={handleRoleUpdated}
      />

      <ManagePermissionsDialog
        isOpen={isManagePermissionsDialogOpen}
        onOpenChange={(open) => {
            setIsManagePermissionsDialogOpen(open);
            if (!open) setRoleForPermissions(null);
        }}
        role={roleForPermissions}
        onRoleUpdated={handleRoleUpdated}
      />
    </div>
  );
}

    