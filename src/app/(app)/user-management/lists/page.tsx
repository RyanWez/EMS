
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListChecks, PlusCircle, UserCog, Loader2, Pencil, Trash2, ShieldAlert } from "lucide-react";
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
import { format, parseISO } from 'date-fns';
import type { ClientUser } from '@/actions/userActions';
import { AddUserDialog } from '@/components/dialogs/AddUserDialog';
import { EditUserDialog } from '@/components/dialogs/EditUserDialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function UserListPage() {
  const { user: sessionUser, isLoading: authLoading, hasPermission } = useAuth(); // Renamed to avoid conflict with map variable
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userToDelete, setUserToDelete] = useState<ClientUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [userToEdit, setUserToEdit] = useState<ClientUser | null>(null);
  const [isUserEditDialogOpen, setIsUserEditDialogOpen] = useState(false);

  const { toast } = useToast();

  const canViewPage = hasPermission('user_management:view_users_page');
  const canAddUser = hasPermission('user_management:add_new_user');
  const canEditUser = hasPermission('user_management:edit_user_action');
  const canDeleteUser = hasPermission('user_management:delete_user_action');


  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch users: ${response.statusText}` }));
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data: { users: ClientUser[] } = await response.json();

      const sortedUsers = (data.users || []).sort((a, b) => {
        if (a.username === 'Admin') return -1;
        if (b.username === 'Admin') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setUsers(sortedUsers);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && canViewPage) {
      fetchUsers();
    } else if (!authLoading && !canViewPage) {
      setError("You do not have permission to view this page.");
      setIsLoading(false);
    }
  }, [authLoading, canViewPage]);

  const handleUserAdded = (newUser: ClientUser) => {
    setUsers(prevUsers =>
        [newUser, ...prevUsers.filter(u => u._id !== newUser._id)]
        .sort((a, b) => {
            if (a.username === 'Admin') return -1;
            if (b.username === 'Admin') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
    );
  };

  const handleUserUpdated = (updatedUser: ClientUser) => {
    setUsers(prevUsers =>
      prevUsers.map(user => user._id === updatedUser._id ? updatedUser : user)
      .sort((a, b) => {
        if (a.username === 'Admin') return -1;
        if (b.username === 'Admin') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    );
    setIsUserEditDialogOpen(false);
  };

  const openDeleteUserDialog = (user: ClientUser) => {
    if (user.username === 'Admin') {
        toast({ title: 'Action Not Allowed', description: 'The "Admin" user account cannot be deleted.', variant: 'warning' });
        return;
    }
    setUserToDelete(user);
  };

  const openEditUserDialog = (user: ClientUser) => {
    // Admin user can be "edited" via dialog to sync, UI will handle disabling fields
    setUserToEdit(user);
    setIsUserEditDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || userToDelete.username === 'Admin') return;
    setIsDeleting(true);

    const originalUsers = [...users];
    const userToActuallyDelete = userToDelete;

    setUsers(prevUsers => prevUsers.filter(u => u._id !== userToActuallyDelete._id)
      .sort((a, b) => {
        if (a.username === 'Admin') return -1;
        if (b.username === 'Admin') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    );
    setUserToDelete(null);

    try {
      const response = await fetch(`/api/users/${userToActuallyDelete._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete user.'}));
        throw new Error(errorData.message || 'Failed to delete user.');
      }
      toast({
        title: 'User Deleted',
        description: `User "${userToActuallyDelete.username}" has been successfully deleted.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error Deleting User',
        description: err instanceof Error ? err.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
      setUsers(originalUsers);
    } finally {
      setIsDeleting(false);
    }
  };


  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading user data...</p>
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
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center">
            <ListChecks className="h-7 w-7 mr-3 text-primary" /> User List
          </h2>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Manage application users, their roles, and credentials.
          </p>
        </div>
        {canAddUser && (
            <AddUserDialog onUserAdded={handleUserAdded}>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New User
                </Button>
            </AddUserDialog>
        )}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>
            A list of all registered users in the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={!!userToDelete || isUserEditDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setUserToDelete(null);
              setIsUserEditDialogOpen(false);
              setUserToEdit(null);
            }
          }}>
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto relative">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="min-w-[200px]">Username</TableHead>
                      <TableHead className="min-w-[150px]">Password</TableHead>
                      <TableHead className="min-w-[150px]">Role</TableHead>
                      <TableHead className="min-w-[170px]">Created At</TableHead>
                      <TableHead className="w-[120px] text-center sticky right-0 bg-muted z-10">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-lg text-muted-foreground">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary my-4" />
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : error && !users.length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-lg text-destructive">
                          Error loading users: {error}
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-lg text-muted-foreground">
                          <UserCog className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          No users found.
                          {canAddUser && <><br />Click "Add New User" to get started.</>}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((currentUser) => {
                        const isAdminUser = currentUser.username === 'Admin';
                        const showEditButton = canEditUser; // Admin can be "edited" via dialog
                        const showDeleteButton = canDeleteUser && !isAdminUser;

                        return (
                        <TableRow key={currentUser._id} className={cn("group hover:bg-muted", isDeleting && userToDelete?._id === currentUser._id && "opacity-50")}>
                          <TableCell className="font-medium text-foreground">{currentUser.username}</TableCell>
                          <TableCell>********</TableCell>
                          <TableCell>{currentUser.role?.name || 'N/A'}</TableCell>
                          <TableCell>{format(parseISO(currentUser.createdAt), 'MMM d, yyyy p')}</TableCell>
                          <TableCell className="text-center sticky right-0 bg-card group-hover:bg-muted z-[5]">
                            <div className="flex items-center justify-center space-x-1.5">
                              {showEditButton && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 border-primary/50 hover:border-primary text-primary hover:bg-primary/5"
                                  onClick={() => openEditUserDialog(currentUser)}
                                  disabled={isDeleting}
                                  title={isAdminUser ? "View/Sync Admin User Details" : `Edit ${currentUser.username}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {showDeleteButton && (
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-destructive/50 hover:border-destructive text-destructive hover:bg-destructive/5"
                                    onClick={() => openDeleteUserDialog(currentUser)}
                                    disabled={isDeleting}
                                    title={`Delete ${currentUser.username}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              )}
                               {!showDeleteButton && isAdminUser && canDeleteUser && (
                                 <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-destructive/30 text-destructive/50 cursor-not-allowed"
                                    disabled={true}
                                    title={'The "Admin" user account cannot be deleted.'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                              )}
                              {!showEditButton && !showDeleteButton && !canEditUser && !canDeleteUser && (
                                <span className="text-xs text-muted-foreground">No actions</span>
                              )}
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

            {userToDelete && (
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user account for <strong className="text-foreground">{userToDelete.username}</strong>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting} onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={confirmDeleteUser}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            )}
          </AlertDialog>
        </CardContent>
      </Card>

      <EditUserDialog
        isOpen={isUserEditDialogOpen}
        onOpenChange={(open) => {
            setIsUserEditDialogOpen(open);
            if (!open) setUserToEdit(null);
        }}
        user={userToEdit}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}


    