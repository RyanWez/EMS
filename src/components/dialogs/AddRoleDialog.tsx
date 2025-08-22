
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react'; // ShieldCheck removed as permissions are removed

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
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
// Checkbox, ScrollArea, Separator are removed as permissions are removed
import { useToast } from '@/hooks/use-toast';
import { addRoleAction, type ClientRole, type AddRoleData } from '@/actions/roleActions';
// getGroupedPermissions, PermissionDef are removed

// Permissions array is removed from the schema for adding a role
const roleSchema = z.object({
  name: z.string().min(1, { message: 'Role name is required.' }).max(50, { message: 'Role name must be 50 characters or less.' }),
});

// Type for form data now only includes name
export type AddRoleDialogFormData = z.infer<typeof roleSchema>;


interface AddRoleDialogProps {
  children: ReactNode;
  onRoleAdded: (newRole: ClientRole) => void;
}

// groupedPermissionsData removed

export function AddRoleDialog({ children, onRoleAdded }: AddRoleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddRoleDialogFormData>({ // Updated to use new form data type
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      // permissions default removed
    },
  });

  async function onSubmit(data: AddRoleDialogFormData) { // Updated to use new form data type
    setIsSubmitting(true);
    try {
      // Construct AddRoleData with an empty permissions array
      const submissionData: AddRoleData = {
        name: data.name,
        permissions: [], // Always submit empty permissions
      };
      const result = await addRoleAction(submissionData);

      if (result.success && result.newRole) {
        toast({
          title: 'Role Added',
          description: `Role "${data.name}" has been successfully added.`,
          variant: 'success',
        });
        setIsOpen(false);
        form.reset();
        onRoleAdded(result.newRole);
      } else {
        toast({
          title: 'Error Adding Role',
          description: result.message || 'Failed to add role.',
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

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md"> {/* Simplified max-w */}
        <DialogHeader>
          <DialogTitle>Add New Role</DialogTitle>
          <DialogDescription>Enter the name for the new role.</DialogDescription> {/* Simplified description */}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4"> {/* Increased space-y */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    {/* Placeholder updated */}
                    <Input placeholder="Administrator, Editor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Permissions selection section entirely removed */}

            <DialogFooter className="pt-4"> {/* Added pt-4 for spacing */}
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Role
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
