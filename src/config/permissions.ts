
// Defines the permission structure for the application.

export const PERMISSION_CATEGORIES = {
  DASHBOARD: 'Dashboard',
  EMPLOYEE_MANAGEMENT: 'Employee Management',
  USER_ROLE_MANAGEMENT: 'User & Role Management', // Combined for clarity
  PROFILE: 'Profile',
} as const;

// Defines the order in which categories should appear in UIs
export const PERMISSION_CATEGORIES_ORDER: (keyof typeof PERMISSION_CATEGORIES)[] = [
  'DASHBOARD',
  'EMPLOYEE_MANAGEMENT',
  'USER_ROLE_MANAGEMENT',
  'PROFILE',
];

export type PermissionCategory = typeof PERMISSION_CATEGORIES[keyof typeof PERMISSION_CATEGORIES];

export interface PermissionDef {
  id: string;
  label: string;
  category: PermissionCategory;
  description?: string; // Optional description for clarity in UI
}

export const ALL_PERMISSIONS: PermissionDef[] = [
  // Dashboard
  {
    id: 'dashboard:view',
    label: 'View Dashboard',
    category: PERMISSION_CATEGORIES.DASHBOARD,
    description: 'Allows user to see the main dashboard overview.'
  },

  // Employee Management - General Actions
  {
    id: 'employee:view_list_page',
    label: 'View Employee List Page',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows accessing the main employee listing page.'
  },
  {
    id: 'employee:view_birthdays_page',
    label: 'View Employee Birthdays Page',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows accessing the employee birthdays page.'
  },
  {
    id: 'employee:view_six_month_service_page', // New permission
    label: 'View 6+ Months Service Page',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows accessing the page for employees with 6+ months of service.'
  },
  {
    id: 'employee:export',
    label: 'Export Employee Data',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows exporting the employee list to a CSV file.'
  },
  {
    id: 'employee:add_new',
    label: 'Add New Employees',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows creating new employee records.'
  },
  {
    id: 'employee:edit_action',
    label: 'Perform Edit Action (on Employee)',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows user to open the edit dialog for an employee.'
  },
  {
    id: 'employee:delete_action',
    label: 'Perform Delete Action (on Employee)',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows user to initiate deleting an employee record.'
  },
  {
    id: 'employee:view_details_modal',
    label: 'View Employee Details Modal',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows opening the modal to see details of a specific employee.'
  },

  // Employee Management - Field/Column Visibility (Used by both Table and View Modal)
  {
    id: 'employee:view_position',
    label: 'View Employee Position',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows viewing the "Position" field/column for employees.'
  },
  {
    id: 'employee:view_gender',
    label: 'View Employee Gender',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows viewing the "Gender" field/column for employees.'
  },
  {
    id: 'employee:view_dob',
    label: 'View Employee Date of Birth',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows viewing the "DOB" field/column for employees.'
  },
  {
    id: 'employee:view_phone',
    label: 'View Employee Phone Number',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows viewing the "Phone No." field/column for employees.'
  },
  {
    id: 'employee:view_nrc',
    label: 'View Employee NRC',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows viewing the "NRC" field/column for employees.'
  },
  {
    id: 'employee:view_address',
    label: 'View Employee Address',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows viewing the "Address" field/column for employees.'
  },
  {
    id: 'employee:view_service_years',
    label: 'View Employee Service Years',
    category: PERMISSION_CATEGORIES.EMPLOYEE_MANAGEMENT,
    description: 'Allows viewing the calculated "Service Years" for employees.'
  },
 
  // User & Role Management
  {
    id: 'user_roles:view_roles_page', 
    label: 'View User Roles Page',
    category: PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT,
    description: 'Allows accessing the user roles listing page.'
  },
  {
    id: 'user_roles:add_new_role',
    label: 'Add New Role',
    category: PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT,
    description: 'Allows creating new user roles and assigning permissions to them.'
  },
  {
    id: 'user_roles:edit_role_action', // Renamed from edit_role_details_action & manage_role_permissions_action
    label: 'Edit Role (Name & Permissions)',
    category: PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT,
    description: 'Allows modifying a role\'s name and its assigned permissions.'
  },
  {
    id: 'user_roles:delete_role_action',
    label: 'Delete Role',
    category: PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT,
    description: 'Allows deleting a user role.'
  },
  {
    id: 'user_management:view_users_page',
    label: 'View User List Page',
    category: PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT,
    description: 'Allows accessing the user account listing page.'
  },
  {
    id: 'user_management:add_new_user',
    label: 'Add New User Account',
    category: PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT,
    description: 'Allows creating new user accounts and assigning roles.'
  },
  {
    id: 'user_management:edit_user_action',
    label: 'Edit User Account (Username/Role)',
    category: PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT,
    description: 'Allows modifying a user\'s username and role.'
  },
  {
    id: 'user_management:delete_user_action',
    label: 'Delete User Account',
    category: PERMISSION_CATEGORIES.USER_ROLE_MANAGEMENT,
    description: 'Allows deleting a user account (except protected accounts like "Admin").'
  },

  // Profile
  {
    id: 'profile:change_image',
    label: 'Change Global Profile Image', // Changed label for clarity
    category: PERMISSION_CATEGORIES.PROFILE,
    description: 'Allows the user to change the global profile picture for the application.'
  },
];

// Helper to group permissions by category for UI rendering
export const getGroupedPermissions = (): Record<PermissionCategory, PermissionDef[]> => {
  const groups = Object.values(PERMISSION_CATEGORIES).reduce((acc, category) => {
    acc[category] = [];
    return acc;
  }, {} as Record<PermissionCategory, PermissionDef[]>);

  ALL_PERMISSIONS.forEach(permission => {
    if (groups[permission.category]) {
      groups[permission.category].push(permission);
    }
  });
  // Sort permissions within each category alphabetically by label
  for (const category in groups) {
    groups[category as PermissionCategory].sort((a, b) => a.label.localeCompare(b.label));
  }
  return groups;
};
