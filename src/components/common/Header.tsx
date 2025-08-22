
'use client';

import { LogOut, LayoutDashboard, Users, UserCog, Menu, User as UserIcon, ImageUp, ChevronDown, ClipboardList, Cake, ListChecks, UsersRound, ShieldAlert, UserCheck } from 'lucide-react'; // Added UserCheck
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';
import { ChangeImageDialog } from '@/components/dialogs/ChangeImageDialog';
import { getUserProfileImage, type UserProfileImageOutput } from '@/ai/flows/userProfileFlows';
import { ThemeToggleButton } from './ThemeToggleButton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_USER_ID_FOR_PROFILE_IMAGE = 'default_user'; 

export default function Header() {
  const { user, logout, isLoading: authLoading, hasPermission } = useAuth();
  const { toast } = useToast();

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'EMS';
  const logoPath = process.env.NEXT_PUBLIC_LOGO_PATH || '/logo.svg';
  const [isChangeImageDialogOpen, setIsChangeImageDialogOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const globalProfileImageId = DEFAULT_USER_ID_FOR_PROFILE_IMAGE;

  const fetchProfileImage = async () => {
    try {
      console.log('[Header] Fetching global profile image with ID:', globalProfileImageId);
      const result: UserProfileImageOutput = await getUserProfileImage({ userId: globalProfileImageId });
      if (result.success && result.imageDataUri) {
        setProfileImageUrl(result.imageDataUri);
        console.log('[Header] Global profile image loaded.');
      } else {
        console.log('[Header] No global profile image found or fetch failed:', result.message);
        setProfileImageUrl(null); 
      }
    } catch (error) {
      console.error("[Header] Error fetching global profile image:", error);
      setProfileImageUrl(null);
    }
  };

  useEffect(() => {
    if (!authLoading) { 
      fetchProfileImage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, globalProfileImageId, user]);

  const handleImageChanged = (newImageUrl: string) => {
    setProfileImageUrl(newImageUrl);
    toast({
        title: "Profile Image Updated",
        description: "The global profile image has been updated.",
        variant: "success",
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  const canViewDashboard = hasPermission('dashboard:view');
  const canViewEmployeeListPage = hasPermission('employee:view_list_page');
  const canViewEmployeeBirthdaysPage = hasPermission('employee:view_birthdays_page');
  const canViewSixMonthServicePage = hasPermission('employee:view_six_month_service_page');
  const canViewEmployeeManagementDropdown = canViewEmployeeListPage || canViewEmployeeBirthdaysPage || canViewSixMonthServicePage;

  const canViewUserListPage = hasPermission('user_management:view_users_page');
  const canViewUserRolesPage = hasPermission('user_roles:view_roles_page');
  const canViewUserManagementDropdown = canViewUserListPage || canViewUserRolesPage;

  const canChangeGlobalProfileImage = hasPermission('profile:change_image');


  if (authLoading) {
    return (
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src={logoPath} alt={`${appName} logo`} width={28} height={28} className="h-7 w-7 sm:h-8 sm:w-8" />
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{appName}</h1>
            </div>
            <div className="h-8 w-20 bg-primary/80 animate-pulse rounded-md"></div>
            <div className="flex items-center gap-2">
                 <div className="h-9 w-9 bg-primary/80 animate-pulse rounded-full"></div>
                 <div className="h-9 w-9 bg-primary/80 animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }


  return (
    <>
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={canViewDashboard ? "/dashboard" : "/login"} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Image src={logoPath} alt={`${appName} logo`} width={28} height={28} className="h-7 w-7 sm:h-8 sm:w-8" />
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{appName}</h1>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              {canViewDashboard && (
                <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary-foreground/80 transition-colors px-3 py-2 rounded-md">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}

              {canViewEmployeeManagementDropdown && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary-foreground/80 hover:bg-primary/80 transition-colors px-3 py-2 rounded-md h-auto focus-visible:ring-offset-primary w-[var(--radix-dropdown-menu-trigger-width)]">
                      <Users className="h-4 w-4" />
                      Employee Management
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card text-card-foreground w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                    {canViewEmployeeListPage && (
                        <Link href="/employee-management/lists" passHref>
                        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                            <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
                            Employee List
                        </DropdownMenuItem>
                        </Link>
                    )}
                    {canViewEmployeeBirthdaysPage && (
                        <Link href="/employee-management/birthdays" passHref>
                        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                            <Cake className="mr-2 h-4 w-4 text-muted-foreground" />
                            Employee Birthday
                        </DropdownMenuItem>
                        </Link>
                    )}
                    {canViewSixMonthServicePage && (
                        <Link href="/employee-management/six-month-service" passHref>
                        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                            <UserCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                            6+ Months Service
                        </DropdownMenuItem>
                        </Link>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {canViewUserManagementDropdown && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary-foreground/80 hover:bg-primary/80 transition-colors px-3 py-2 rounded-md h-auto focus-visible:ring-offset-primary w-[var(--radix-dropdown-menu-trigger-width)]">
                      <UserCog className="h-4 w-4" />
                      User Management
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card text-card-foreground w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                    {canViewUserListPage && (
                        <Link href="/user-management/lists" passHref>
                        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                            <ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />
                            User List
                        </DropdownMenuItem>
                        </Link>
                    )}
                    {canViewUserRolesPage && (
                        <Link href="/user-management/roles" passHref>
                        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                            <UsersRound className="mr-2 h-4 w-4 text-muted-foreground" />
                            User Roles
                        </DropdownMenuItem>
                        </Link>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
               {!canViewDashboard && !canViewEmployeeManagementDropdown && !canViewUserManagementDropdown && (
                <div className="flex items-center justify-center flex-grow">
                    <p className="text-sm text-primary-foreground/80">No accessible modules.</p>
                </div>
              )}
            </nav>
            
            <div className="hidden md:flex items-center gap-1">
              <ThemeToggleButton buttonClassName="text-primary-foreground hover:bg-primary/80 focus-visible:ring-offset-primary" /> 
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 hover:bg-primary/80 focus-visible:ring-offset-primary">
                      <Avatar className="h-9 w-9">
                        {profileImageUrl ? (
                          <Image src={profileImageUrl} alt={user.username || "User"} layout="fill" objectFit="cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary/70">
                          <UserIcon className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-fit bg-card text-card-foreground" align="end" forceMount>
                    {canChangeGlobalProfileImage && (
                        <DropdownMenuItem onClick={() => setIsChangeImageDialogOpen(true)} className="hover:bg-muted cursor-pointer">
                            <ImageUp className="mr-2 h-4 w-4" />
                            <span>Change Image</span>
                        </DropdownMenuItem>
                    )}
                    {canChangeGlobalProfileImage && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={handleLogout} className="hover:bg-muted cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <ThemeToggleButton buttonClassName="text-primary-foreground hover:bg-primary/80 focus-visible:ring-offset-primary" />
              {user && (
                <div className="ml-1">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 hover:bg-primary/80 focus-visible:ring-offset-primary">
                           <Avatar className="h-9 w-9">
                            {profileImageUrl ? (
                              <Image src={profileImageUrl} alt={user.username || "User"} layout="fill" objectFit="cover" />
                            ) : null}
                            <AvatarFallback className="bg-primary/70">
                              <UserIcon className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-fit bg-card text-card-foreground" align="end" forceMount>
                        {canChangeGlobalProfileImage && (
                            <DropdownMenuItem onClick={() => setIsChangeImageDialogOpen(true)} className="hover:bg-muted cursor-pointer">
                                <ImageUp className="mr-2 h-4 w-4" />
                                <span>Change Image</span>
                            </DropdownMenuItem>
                        )}
                         {canChangeGlobalProfileImage && <DropdownMenuSeparator />}
                         <DropdownMenuItem onClick={handleLogout} className="hover:bg-muted cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-accent focus-visible:ring-offset-primary text-primary-foreground ml-1">
                    <Menu className="h-7 w-7" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-card text-card-foreground p-0 flex flex-col">
                  <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
                  
                  <div className="p-4 border-b flex items-center gap-3">
                    <SheetClose asChild>
                      <Link href={canViewDashboard ? "/dashboard" : "/login"} className="flex items-center gap-3">
                        <Image src={logoPath} alt={`${appName} logo`} width={28} height={28} className="h-7 w-7" />
                        <h1 className="text-xl font-semibold text-foreground">{appName}</h1>
                      </Link>
                    </SheetClose>
                  </div>
                  
                  <nav className="flex-grow p-4 space-y-1">
                      {canViewDashboard && (
                        <SheetClose asChild>
                            <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-foreground">
                                <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                                Dashboard
                            </Link>
                        </SheetClose>
                      )}
                      {canViewEmployeeManagementDropdown && (
                        <>
                            <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground/70">Employee Management</p>
                            {canViewEmployeeListPage && (
                                <SheetClose asChild>
                                    <Link href="/employee-management/lists" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-foreground">
                                        <ClipboardList className="h-5 w-5 text-muted-foreground" />
                                        Employee List
                                    </Link>
                                </SheetClose>
                            )}
                            {canViewEmployeeBirthdaysPage && (
                                <SheetClose asChild>
                                <Link href="/employee-management/birthdays" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-foreground">
                                    <Cake className="h-5 w-5 text-muted-foreground" />
                                    Employee Birthday
                                </Link>
                            </SheetClose>
                            )}
                            {canViewSixMonthServicePage && (
                                <SheetClose asChild>
                                <Link href="/employee-management/six-month-service" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-foreground">
                                    <UserCheck className="h-5 w-5 text-muted-foreground" />
                                    6+ Months Service
                                </Link>
                            </SheetClose>
                            )}
                        </>
                      )}
                      {canViewUserManagementDropdown && (
                        <>
                            <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground/70">User Management</p>
                            {canViewUserListPage && (
                                <SheetClose asChild>
                                    <Link href="/user-management/lists" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-foreground">
                                        <ListChecks className="h-5 w-5 text-muted-foreground" />
                                        User List
                                    </Link>
                                </SheetClose>
                            )}
                            {canViewUserRolesPage && (
                                <SheetClose asChild>
                                    <Link href="/user-management/roles" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-foreground">
                                        <UsersRound className="h-5 w-5 text-muted-foreground" />
                                        User Roles
                                    </Link>
                                </SheetClose>
                            )}
                        </>
                      )}
                       {!canViewDashboard && !canViewEmployeeManagementDropdown && !canViewUserManagementDropdown && (
                         <SheetClose asChild>
                            <div className="flex items-center gap-3 p-3 rounded-md text-muted-foreground">
                                <ShieldAlert className="h-5 w-5" />
                                No accessible modules.
                            </div>
                         </SheetClose>
                      )}
                  </nav>

                  {user && (
                    <div className="p-4 mt-auto border-t">
                        <SheetClose asChild>
                            <Button variant="ghost" className="w-full justify-start gap-3 p-3 hover:bg-muted text-foreground" onClick={handleLogout}>
                                <LogOut className="h-5 w-5 text-muted-foreground" />
                                Logout
                            </Button>
                        </SheetClose>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      {user && canChangeGlobalProfileImage && (
          <ChangeImageDialog
            isOpen={isChangeImageDialogOpen}
            onOpenChange={setIsChangeImageDialogOpen}
            userId={globalProfileImageId} 
            onImageChanged={handleImageChanged}
          />
      )}
    </>
  );
}
