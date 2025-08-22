
'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Employee } from '@/app/(app)/employee-management/lists/page';
import { 
    calculateServiceYears, 
    getPositionBadgeClass, 
    getGenderBadgeClass 
} from '@/app/(app)/employee-management/lists/page'; 
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';

interface ViewEmployeeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  employee: Employee | null;
  userPermissions: string[];
}

const DetailItem = ({ label, value, isPermitted }: { label: string; value: ReactNode, isPermitted: boolean }) => {
  if (!isPermitted) return null;
  return (
    <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-border/60 last:border-b-0">
      <dt className="text-sm font-medium text-muted-foreground col-span-1">{label}</dt>
      <dd className="text-sm text-foreground col-span-2 break-words">{value || <span className="text-xs text-muted-foreground/80">N/A</span>}</dd>
    </div>
  );
};


export function ViewEmployeeDialog({ isOpen, onOpenChange, employee, userPermissions }: ViewEmployeeDialogProps) {
  if (!employee) return null;

  const formatDateSafe = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP p'); 
    } catch (e) {
      return dateString; 
    }
  }

  const hasPermission = (permissionId: string) => userPermissions.includes(permissionId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-xl">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-xl font-semibold text-foreground">Employee Details</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Viewing details for {employee.name.toUpperCase()}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <DetailItem label="Full Name" value={employee.name.toUpperCase()} isPermitted={true} />
          <DetailItem label="Join Date" value={employee.joinDate ? format(parseISO(employee.joinDate), 'MMMM d, yyyy') : 'N/A'} isPermitted={true} />
          
          <DetailItem 
            label="Service Years" 
            value={calculateServiceYears(employee.joinDate)}
            isPermitted={hasPermission('employee:view_service_years')}
          />
          <DetailItem 
            label="Position" 
            value={
              <Badge variant="outline" className={cn("font-medium py-0.5 px-2 text-xs", getPositionBadgeClass(employee.position))}>
                {employee.position}
              </Badge>
            }
            isPermitted={hasPermission('employee:view_position')}
          />
          <DetailItem 
            label="Gender" 
            value={
              <Badge variant="outline" className={cn("font-medium py-0.5 px-2 text-xs", getGenderBadgeClass(employee.gender))}>
                {employee.gender}
              </Badge>
            }
            isPermitted={hasPermission('employee:view_gender')}
          />
          <DetailItem 
            label="Date of Birth" 
            value={employee.dob ? format(parseISO(employee.dob), 'MMMM d, yyyy') : 'N/A'}
            isPermitted={hasPermission('employee:view_dob')}
          />
          <DetailItem 
            label="Phone Number" 
            value={employee.phone}
            isPermitted={hasPermission('employee:view_phone')}
          />
          <DetailItem 
            label="NRC Number" 
            value={employee.nrc}
            isPermitted={hasPermission('employee:view_nrc')}
          />
          <DetailItem 
            label="Address" 
            value={employee.address}
            isPermitted={hasPermission('employee:view_address')}
          />

          <DetailItem label="Record Created" value={formatDateSafe(employee.createdAt)} isPermitted={true} />
          <DetailItem label="Last Updated" value={formatDateSafe(employee.updatedAt)} isPermitted={true} />
        </div>
        <DialogFooter className="mt-6 pt-4 border-t border-border/60">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
