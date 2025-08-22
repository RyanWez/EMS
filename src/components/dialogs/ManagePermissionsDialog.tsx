
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { editRoleAction, type ClientRole, type EditRoleData } from '@/actions/roleActions';
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES, type PermissionDef, PERMISSION_CATEGORIES_ORDER } from '@/config/permissions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const permissionsSchema = z.object({
  selectedPermissions: z.array(z.string()).optional().default([]),
});

type PermissionsFormData = z.infer<typeof permissionsSchema>;

interface ManagePermissionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  role: ClientRole | null;
  onRoleUpdated: (updatedRole: ClientRole) => void;
}

interface DisplayView {
  key: string; // Unique key for React list, e.g., "category_dashboard" or "subgroup_employee_list"
  categoryLabel: string; // Main category label, e.g., "Employee Management"
  subGroupLabel?: string; // Sub-group label if applicable, e.g., "Employee List"
  displayLabel: string; // The label to show in the left navigation, e.g., "Dashboard" or "Employee List"
  permissions: PermissionDef[]; // Permissions belonging to this specific view
}


// This function now filters ALL_PERMISSIONS based on what the current user has, IF they are not an admin.
const UIGroupedPermissions = (allPossiblePermissions: PermissionDef[], baseCategoriesOrder: typeof PERMISSION_CATEGORIES_ORDER, baseCategories: typeof PERMISSION_CATEGORIES): Record<string, { label: string; permissions: PermissionDef[]; subGroups?: Record<string, { label: string; permissions: PermissionDef[] }> }> => {
  const categories: Record<string, { label: string; permissions: PermissionDef[]; subGroups?: Record<string, { label: string; permissions: PermissionDef[] }> }> = {};

  baseCategoriesOrder.forEach(catKey => {
    const categoryLabel = baseCategories[catKey as keyof typeof baseCategories];
    categories[categoryLabel] = { label: categoryLabel, permissions: [] };
    // Define subGroups structure explicitly
    if (categoryLabel === baseCategories.EMPLOYEE_MANAGEMENT) {
      categories[categoryLabel].subGroups = {
        "Employee List": { label: "Employee List", permissions: [] },
        "Employee Birthdays": { label: "Employee Birthdays", permissions: [] },
        "6+ Months Service": { label: "6+ Months Service", permissions: [] }, // Added new subgroup
      };
    }
    if (categoryLabel === baseCategories.USER_ROLE_MANAGEMENT) {
      categories[categoryLabel].subGroups = {
        "User Roles": { label: "User Roles", permissions: [] },
        "User Accounts": { label: "User Accounts", permissions: [] },
      };
    }
  });

  allPossiblePermissions.forEach(p => {
    const mainCategory = categories[p.category];
    if (!mainCategory) return;

    if (p.category === baseCategories.EMPLOYEE_MANAGEMENT && mainCategory.subGroups) {
      if (p.id.includes('birthdays')) {
        mainCategory.subGroups["Employee Birthdays"].permissions.push(p);
      } else if (p.id.includes('six_month_service')) { // Check for new permission
        mainCategory.subGroups["6+ Months Service"].permissions.push(p);
      }
       else { // General employee list permissions
        mainCategory.subGroups["Employee List"].permissions.push(p);
      }
    } else if (p.category === baseCategories.USER_ROLE_MANAGEMENT && mainCategory.subGroups) {
      if (p.id.startsWith('user_roles:')) {
        mainCategory.subGroups["User Roles"].permissions.push(p);
      } else if (p.id.startsWith('user_management:')) {
         mainCategory.subGroups["User Accounts"].permissions.push(p);
      } else {
        // This case should ideally not be hit if all user_role_management perms are correctly prefixed
        mainCategory.permissions.push(p);
      }
    } else {
      mainCategory.permissions.push(p);
    }
  });

  // Sort permissions within categories and subGroups
  Object.values(categories).forEach(cat => {
    cat.permissions.sort((a, b) => a.label.localeCompare(b.label));
    if (cat.subGroups) {
      Object.values(cat.subGroups).forEach(subCat => {
        subCat.permissions.sort((a, b) => a.label.localeCompare(b.label));
      });
    }
  });
  return categories;
};


export function ManagePermissionsDialog({
    isOpen,
    onOpenChange,
    role,
    onRoleUpdated,
}: ManagePermissionsDialogProps) {
  const { user: currentUserSession } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isEditingAdminRole = role?.name === 'Admin';
  const isCurrentUserAdmin = currentUserSession?.username === 'Admin';
  const currentUserOwnPermissions = useMemo(() => currentUserSession?.permissions || [], [currentUserSession]);

  const grantablePermissions = useMemo(() => {
    if (isCurrentUserAdmin) {
      return ALL_PERMISSIONS;
    }
    return ALL_PERMISSIONS.filter(p => currentUserOwnPermissions.includes(p.id));
  }, [isCurrentUserAdmin, currentUserOwnPermissions]);
  
  const allPossiblePermissionIdsForAdminRole = useMemo(() => ALL_PERMISSIONS.map(p => p.id), []);

  const memoizedDisplayViews = useMemo(() => {
    const views: DisplayView[] = [];
    // Pass PERMISSION_CATEGORIES_ORDER and PERMISSION_CATEGORIES to UIGroupedPermissions
    const groupedUIPermissions = UIGroupedPermissions(grantablePermissions, PERMISSION_CATEGORIES_ORDER, PERMISSION_CATEGORIES);

    PERMISSION_CATEGORIES_ORDER.forEach(catKeyEnum => {
        const categoryLabel = PERMISSION_CATEGORIES[catKeyEnum]; // e.g., "Dashboard"
        const categoryData = groupedUIPermissions[categoryLabel];

        if (!categoryData) return; // Skip if category has no grantable permissions

        // Main category items (if any, and not exclusively sub-grouped or is a specific main category)
        if (categoryData.permissions.length > 0 && (
            !categoryData.subGroups || 
            [PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_CATEGORIES.PROFILE].includes(categoryLabel)
        )) {
            views.push({
                key: `category_${catKeyEnum.toLowerCase()}`,
                categoryLabel: categoryData.label,
                displayLabel: categoryData.label,
                permissions: categoryData.permissions,
            });
        }

        // Sub-group items
        if (categoryData.subGroups) {
            // Define an order for sub-groups if necessary, or sort by name
            const subGroupOrder = categoryLabel === PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT 
                ? ["Employee List", "Employee Birthdays", "6+ Months Service"] 
                : categoryLabel === PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT
                ? ["User Roles", "User Accounts"]
                : Object.keys(categoryData.subGroups);


            subGroupOrder.forEach(subGroupName => {
                const subGroupData = categoryData.subGroups![subGroupName];
                 if (subGroupData && subGroupData.permissions.length > 0) { // Check if subGroupData exists
                     const uniqueSubKeyPart = subGroupName.toLowerCase().replace(/\s+/g, '_');
                     views.push({
                        key: `subgroup_${catKeyEnum.toLowerCase()}_${uniqueSubKeyPart}`,
                        categoryLabel: categoryData.label,
                        subGroupLabel: subGroupData.label,
                        displayLabel: subGroupData.label,
                        permissions: subGroupData.permissions,
                    });
                }
            });
        }
    });
    return views;
  }, [grantablePermissions]);


  const [selectedViewKey, setSelectedViewKey] = useState<string | null>(null);

  // Effect to set the initial selected view
  useEffect(() => {
    if (isOpen && memoizedDisplayViews.length > 0 && !selectedViewKey) {
      setSelectedViewKey(memoizedDisplayViews[0].key);
    }
    // Reset selectedViewKey when dialog closes, so it re-initializes on next open
    if (!isOpen) {
      setSelectedViewKey(null);
    }
  }, [isOpen, memoizedDisplayViews, selectedViewKey]);


  const form = useForm<PermissionsFormData>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: {
      selectedPermissions: [],
    },
  });

  useEffect(() => {
    if (role && isOpen) {
      form.reset({
        selectedPermissions: isEditingAdminRole ? allPossiblePermissionIdsForAdminRole : (role.permissions || []),
      });
      // If dialog opens and selectedViewKey is not set (or no longer valid), set to first available view
      if (!selectedViewKey && memoizedDisplayViews.length > 0) {
        setSelectedViewKey(memoizedDisplayViews[0].key);
      } else if (selectedViewKey && !memoizedDisplayViews.find(v => v.key === selectedViewKey) && memoizedDisplayViews.length > 0) {
        // If current selectedViewKey is no longer valid (e.g. due to permission changes), reset
        setSelectedViewKey(memoizedDisplayViews[0].key);
      }

    } else if (!isOpen) { // Reset form when dialog is closed
        form.reset({ selectedPermissions: [] });
    }
  }, [role, isOpen, form, isEditingAdminRole, allPossiblePermissionIdsForAdminRole, memoizedDisplayViews, selectedViewKey]);


  async function onSubmit(data: PermissionsFormData) {
    if (!role) return;
    setIsSubmitting(true);
    try {
      const permissionsToSubmit = isEditingAdminRole ? allPossiblePermissionIdsForAdminRole : (data.selectedPermissions || []);
      
      const submissionData: EditRoleData = {
        _id: role._id,
        name: role.name, 
        permissions: permissionsToSubmit,
      };
      const result = await editRoleAction(submissionData);
      if (result.success && result.updatedRole) {
        toast({
          title: 'Permissions Updated',
          description: `Permissions for role "${role.name}" have been successfully updated.`,
          variant: 'success',
        });
        onRoleUpdated(result.updatedRole);
        onOpenChange(false);
      } else {
        toast({
          title: 'Error Updating Permissions',
          description: result.message || 'Failed to update permissions.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while updating permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDialogClose = (openState: boolean) => {
    onOpenChange(openState);
    if (!openState) { // If dialog is closing
        form.reset({ selectedPermissions: [] }); // Reset form
    }
  };

  const currentDisplayPermissions = useMemo(() => {
    if (!selectedViewKey) return [];
    return memoizedDisplayViews.find(v => v.key === selectedViewKey)?.permissions || [];
  }, [selectedViewKey, memoizedDisplayViews]);


  const handleSelectAllDisplayed = () => {
    if (isEditingAdminRole || !currentDisplayPermissions.length) return;
    const displayedPermissionIds = currentDisplayPermissions.map(p => p.id);
    const currentSelected = form.getValues('selectedPermissions') || [];
    form.setValue('selectedPermissions', Array.from(new Set([...currentSelected, ...displayedPermissionIds])), { shouldDirty: true });
  };

  const handleDeselectAllDisplayed = () => {
    if (isEditingAdminRole || !currentDisplayPermissions.length) return;
    const displayedPermissionIds = currentDisplayPermissions.map(p => p.id);
    const currentSelected = form.getValues('selectedPermissions') || [];
    form.setValue('selectedPermissions', currentSelected.filter(id => !displayedPermissionIds.includes(id)), { shouldDirty: true });
  };

  if (!role && isOpen) return null; // Don't render if role is null but dialog is open

  const PermissionCheckbox = ({permission, field}: {permission: PermissionDef, field: any }) => ( // `field` is from RHF Controller
     <FormItem
        key={permission.id}
        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors break-inside-avoid bg-card shadow-sm"
      >
        <FormControl>
          <Checkbox
            checked={field.value?.includes(permission.id)}
            onCheckedChange={(checked) => {
              return checked
                ? field.onChange([...(field.value || []), permission.id]) // Add permission
                : field.onChange( // Remove permission
                    (field.value || []).filter(
                      (value: string) => value !== permission.id
                    )
                  );
            }}
            id={`perm-${permission.id}`}
            disabled={isSubmitting || isEditingAdminRole} // Disable if Admin role
          />
        </FormControl>
        <div className="space-y-0.5 leading-none">
          <FormLabel
            htmlFor={`perm-${permission.id}`}
            className="text-sm font-normal cursor-pointer"
          >
            {permission.label}
          </FormLabel>
          {permission.description && (
            <p className="text-xs text-muted-foreground">{permission.description}</p>
          )}
        </div>
      </FormItem>
  );

  // For Left Navigation Pane
  const navGroups = useMemo(() => {
    const groups: Record<string, DisplayView[]> = {};
    memoizedDisplayViews.forEach(view => {
      if (!groups[view.categoryLabel]) {
        groups[view.categoryLabel] = [];
      }
      groups[view.categoryLabel].push(view);
    });
    
    const orderedGroups: { categoryLabel: string, views: DisplayView[] }[] = [];
    PERMISSION_CATEGORIES_ORDER.forEach(catKey => {
        const categoryLabel = PERMISSION_CATEGORIES[catKey as keyof typeof PERMISSION_CATEGORIES];
        if (groups[categoryLabel] && groups[categoryLabel].length > 0) {
            orderedGroups.push({ categoryLabel, views: groups[categoryLabel]});
        }
    });
    return orderedGroups;
  }, [memoizedDisplayViews]);


  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-lg">
            Permissions for role: <span className="text-primary">{role?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          {/* Ensure form covers both panes and footer for submission */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-grow min-h-0 overflow-hidden">
            {/* Left Navigation Pane */}
            <div className="w-1/4 min-w-[240px] max-w-[320px] border-r bg-muted/30">
              <ScrollArea className="h-full p-3">
                <nav className="space-y-1.5">
                  {navGroups.map(group => (
                    <div key={group.categoryLabel} className="mb-2">
                       <h4 className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider select-none">
                            {group.categoryLabel}
                        </h4>
                      {group.views.map((view) => (
                        <Button
                          key={view.key}
                          type="button"
                          variant={selectedViewKey === view.key ? 'default' : 'outline'}
                          className={cn(
                            "w-full justify-start h-auto py-2.5 px-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring text-left",
                            selectedViewKey === view.key ?
                              "bg-primary text-primary-foreground hover:bg-primary/90" :
                              "bg-background hover:bg-muted text-foreground border-border",
                             "mb-1" // Add margin bottom for spacing between buttons
                          )}
                          onClick={() => setSelectedViewKey(view.key)}
                        >
                          {view.displayLabel}
                        </Button>
                      ))}
                    </div>
                  ))}
                </nav>
              </ScrollArea>
            </div>

            {/* Right Content Pane */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {/* Action Buttons for current view */}
              <div className="px-6 pt-4 pb-3 flex gap-2 border-b bg-background z-10 items-center flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={handleSelectAllDisplayed} disabled={isSubmitting || isEditingAdminRole || currentDisplayPermissions.length === 0}>
                    Select All (Current View)
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleDeselectAllDisplayed} disabled={isSubmitting || isEditingAdminRole || currentDisplayPermissions.length === 0}>
                    Deselect All (Current View)
                  </Button>
                {isEditingAdminRole && (
                    <p className="text-sm text-muted-foreground flex-1 self-center ml-auto text-right">
                        Admin role has all permissions by default. These cannot be changed.
                    </p>
                )}
              </div>

              {/* Permissions Checkboxes */}
              <ScrollArea className="flex-grow p-6">
                {currentDisplayPermissions.length > 0 ? (
                    <FormField
                    control={form.control}
                    name="selectedPermissions" // This should control all checkboxes
                    render={({ field }) => (
                        // Grid for checkboxes
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentDisplayPermissions.map((permission) => (
                            <PermissionCheckbox key={permission.id} permission={permission} field={field} />
                        ))}
                        </div>
                    )}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-center">
                        <p className="text-muted-foreground">
                            {selectedViewKey ? "No permissions available in this section or you do not have access to assign them." : "Select a category from the left to view permissions."}
                        </p>
                    </div>
                )}
              </ScrollArea>

              {/* Dialog Footer - Moved inside the form but outside the ScrollArea for content */}
              <DialogFooter className="p-6 pt-4 border-t bg-background z-10 mt-auto">
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>
                     Cancel
                    </Button>
                </DialogClose>
                {!isEditingAdminRole && ( // Only show save button if not editing Admin role
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Permissions
                    </Button>
                )}
                 {isEditingAdminRole && ( // For Admin role, "Save" button is effectively disabled
                    <Button type="button" disabled={true} className="cursor-not-allowed">
                        Save Permissions
                    </Button>
                )}
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
