
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldCheck } from 'lucide-react';

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
// Checkbox, ScrollArea, Separator might still be needed if Admin role shows permissions, but not for editing them.
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '../ui/separator';

import { useToast } from '@/hooks/use-toast';
import { editRoleAction, type ClientRole, type EditRoleData } from '@/actions/roleActions';
import { getGroupedPermissions, type PermissionDef, ALL_PERMISSIONS } from '@/config/permissions';


const roleSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, { message: 'Role name is required.' }).max(50, { message: 'Role name must be 50 characters or less.' }),
  permissions: z.array(z.string()).optional().default([]), // Keep for Admin role data structure, but UI will be conditional
});

interface EditRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  role: ClientRole | null;
  onRoleUpdated: (updatedRole: ClientRole) => void;
}

const groupedPermissionsData = getGroupedPermissions();
const allPermissionIds = ALL_PERMISSIONS.map(p => p.id);

export function EditRoleDialog({ 
    isOpen, 
    onOpenChange, 
    role, 
    onRoleUpdated, 
}: EditRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isEditingAdminRole = role?.name === 'Admin';


  const form = useForm<EditRoleData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      _id: '',
      name: '',
      permissions: [],
    },
  });

  useEffect(() => {
    if (role && isOpen) {
      form.reset({
        _id: role._id,
        name: role.name,
        permissions: isEditingAdminRole ? allPermissionIds : (role.permissions || []),
      });
    } else if (!isOpen) {
        form.reset({ _id: '', name: '', permissions: [] });
    }
  }, [role, isOpen, form, isEditingAdminRole]);

  async function onSubmit(data: EditRoleData) {
    if (!role) return;

    // This dialog is now only for role name changes for non-admin roles.
    // Permission changes are handled by ManagePermissionsDialog.
    // Admin role is not editable here at all.
    if (isEditingAdminRole) {
        toast({
            title: 'Action Not Allowed',
            description: 'Admin role cannot be edited here.',
            variant: 'warning',
        });
        onOpenChange(false); // Close dialog
        return;
    }

    setIsSubmitting(true);
    try {
      // Only submit name and _id. Permissions are submitted from ManagePermissionsDialog.
      const submissionData: EditRoleData = {
        _id: data._id,
        name: data.name,
        permissions: role.permissions || [], // Keep original permissions when only editing name
      };

      const result = await editRoleAction(submissionData);

      if (result.success && result.updatedRole) {
        toast({
          title: 'Role Updated',
          description: `Role "${result.updatedRole.name}" has been successfully updated.`,
          variant: 'success',
        });
        onRoleUpdated(result.updatedRole);
        onOpenChange(false);
      } else {
        toast({
          title: 'Error Updating Role',
          description: result.message || 'Failed to update role.',
          variant: 'destructive',
        });
         if (result.errors?.name) {
          form.setError('name', { type: 'server', message: result.errors.name.join(', ') });
        }
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDialogClose = (openState: boolean) => {
    onOpenChange(openState);
    if (!openState) {
        form.reset({ _id: '', name: '', permissions: [] });
    }
  };

  if (!role && isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Role: <span className="text-primary">{role?.name}</span></DialogTitle>
          <DialogDescription>
            {isEditingAdminRole 
              ? "Admin role name and permissions cannot be changed." 
              : "Update the role name."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-grow flex flex-col min-h-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="e.g., Administrator, Editor" 
                        {...field} 
                        disabled={isEditingAdminRole || isSubmitting} 
                    />
                  </FormControl>
                  {isEditingAdminRole && <p className="text-xs text-muted-foreground pt-1">Admin role name cannot be changed.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Permissions section is removed for non-Admin roles */}
            {/* For Admin, it's not shown either as this dialog is only for name editing for others */}
            {!isEditingAdminRole ? null : (
                 <div className="space-y-3 flex-grow min-h-0 pt-2">
                    <FormLabel className="text-base font-medium flex items-center">
                        <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Permissions
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                        Admin role has all permissions by default. They cannot be changed.
                    </p>
                 </div>
            )}


            <DialogFooter className="pt-2 mt-auto py-3">
               <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting || isEditingAdminRole } // Admin cannot be "saved" from here
              >
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
