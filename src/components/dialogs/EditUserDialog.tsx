
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { editUserAction, type ClientUser, type EditUserFormData } from '@/actions/userActions';
import type { ClientRole } from '@/actions/roleActions';

const editUserFormSchema = z.object({
  _id: z.string(), 
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).max(50, { message: 'Username must be 50 characters or less.' }),
  roleId: z.string().min(1, {message: "Role is required."}),
});

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: ClientUser | null;
  onUserUpdated: (updatedUser: ClientUser) => void;
}

export function EditUserDialog({ 
    isOpen, 
    onOpenChange, 
    user, 
    onUserUpdated, 
}: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<ClientRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const { toast } = useToast();

  const isAdminUser = user?.username === 'Admin';

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      _id: '',
      username: '',
      roleId: '',
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        _id: user._id,
        username: user.username,
        roleId: user.role._id,
      });
    }
  }, [user, isOpen, form]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const response = await fetch('/api/roles');
        if (!response.ok) throw new Error('Failed to fetch roles');
        const data: { roles: ClientRole[] } = await response.json();
        // For non-admin users, filter out the Admin role
        const selectableRoles = isAdminUser ? data.roles : (data.roles || []).filter(r => r.name !== 'Admin');
        setRoles(selectableRoles || []);
      } catch (error) {
        toast({
          title: 'Error Fetching Roles',
          description: error instanceof Error ? error.message : 'Could not load roles.',
          variant: 'destructive',
        });
        setRoles([]);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchRoles();
  }, [isOpen, toast, isAdminUser]);

  async function onSubmit(data: EditUserFormData) {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const result = await editUserAction(data);

      if (result.success && result.updatedUser) {
        toast({
          title: 'User Updated',
          description: `User "${data.username}" has been successfully updated.`,
          variant: 'success',
        });
        onUserUpdated(result.updatedUser);
        onOpenChange(false);
      } else {
        toast({
          title: 'Error Updating User',
          description: result.message || 'Failed to update user.',
          variant: 'destructive',
        });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            const fieldName = field as keyof EditUserFormData;
            if (messages && messages.length > 0 && form.getFieldState(fieldName) !== undefined) {
              form.setError(fieldName, { type: 'server', message: messages.join(', ') });
            }
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while updating the user.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleDialogClose = (openState: boolean) => {
    onOpenChange(openState);
    if (!openState) {
      form.reset({ _id: '', username: '', roleId: '' });
    }
  };

  if (!user && isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User: <span className="text-primary">{user?.username}</span></DialogTitle>
          <DialogDescription>Modify the username and role for this user.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Enter username" 
                        {...field} 
                        disabled={isSubmitting || isAdminUser} 
                    />
                  </FormControl>
                  {isAdminUser && <p className="text-xs text-muted-foreground pt-1">Admin username cannot be changed.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value} 
                    disabled={isSubmitting || isLoadingRoles || isAdminUser} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select a role"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!isLoadingRoles && roles.length === 0 && (
                        <SelectItem value="no-roles" disabled>No roles available</SelectItem>
                      )}
                      {roles.map((role) => (
                        <SelectItem key={role._id} value={role._id} disabled={isAdminUser && role.name !== 'Admin'}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isAdminUser && <p className="text-xs text-muted-foreground pt-1">Admin role cannot be changed.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || isLoadingRoles}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
