
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, getDaysInMonth as dfnsGetDaysInMonth, isExists, getYear, getMonth, getDate, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { editEmployeeAction, type ClientEmployee } from '@/actions/employeeActions'; // Updated action
import type { Employee as EmployeeDataForList } from '@/app/(app)/employee-management/lists/page'; // For prop type

const employeePositions = [
  "Super", "Leader", "Account Department", "Operation", "Security", "Fire Safety", "Cleaner"
] as const;

// Schema for form validation (client-side)
const editEmployeeSchema = z.object({
  _id: z.string(), // Keep _id for submission
  name: z.string().min(1, { message: 'Full name is required.' }),
  nrc: z.string().optional(),
  joinDate: z.date({ required_error: 'Join date is required.' }),
  position: z.enum(employeePositions, { required_error: 'Position is required.' }),
  gender: z.enum(['Male', 'Female'], { required_error: 'Gender is required.' }),
  dob: z.date({ required_error: 'Date of birth is required.' }),
  phone: z.string().min(1, { message: 'Phone number is required.' }).regex(/^09\d{7,9}$/, { message: 'Phone number must start with 09 and be 9 to 11 digits long.'}),
  address: z.string().optional(),
});

export type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  employee: EmployeeDataForList | null; // Employee data to edit
  onEmployeeUpdated?: (updatedEmployee: ClientEmployee) => void;
}

const currentYear = new Date().getFullYear();
// For DOB: 1990 to 2015
const dobYears = Array.from({ length: 2015 - 1990 + 1 }, (_, i) => 2015 - i);
// For Join Date: 2020 to current year
const joinYears = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: format(new Date(0, i), 'MMMM'),
}));

export function EditEmployeeDialog({ isOpen, onOpenChange, employee, onEmployeeUpdated }: EditEmployeeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: { // Will be overridden by useEffect when employee prop changes
      _id: '',
      name: '',
      nrc: '',
      phone: '09',
      address: '',
      position: undefined,
      gender: undefined,
    },
  });

  // States for date part dropdowns
  const [dobDay, setDobDay] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');
  const [joinDay, setJoinDay] = useState<string>('');
  const [joinMonth, setJoinMonth] = useState<string>('');
  const [joinYear, setJoinYear] = useState<string>('');

  const [dobDaysInMonth, setDobDaysInMonth] = useState<number[]>([]);
  const [joinDaysInMonth, setJoinDaysInMonth] = useState<number[]>([]);

  // Effect to populate form when employee data is available
  useEffect(() => {
    if (employee && isOpen) { // Ensure employee data exists and dialog is open
      const dobDate = parseISO(employee.dob); // dob is YYYY-MM-DD string
      const joinDateDate = parseISO(employee.joinDate); // joinDate is YYYY-MM-DD string

      form.reset({
        _id: employee._id,
        name: employee.name,
        nrc: employee.nrc || '',
        joinDate: joinDateDate,
        position: employee.position,
        gender: employee.gender,
        dob: dobDate,
        phone: employee.phone,
        address: employee.address || '',
      });

      setDobDay(getDate(dobDate).toString());
      setDobMonth((getMonth(dobDate) + 1).toString());
      setDobYear(getYear(dobDate).toString());

      setJoinDay(getDate(joinDateDate).toString());
      setJoinMonth((getMonth(joinDateDate) + 1).toString());
      setJoinYear(getYear(joinDateDate).toString());

    } else if (!isOpen) { // Reset form if dialog is closed
        form.reset({
            _id: '', name: '', nrc: '', phone: '09', address: '',
            position: undefined, gender: undefined,
            // Reset date parts as well
        });
        setDobDay(''); setDobMonth(''); setDobYear('');
        setJoinDay(''); setJoinMonth(''); setJoinYear('');
    }
  }, [employee, form, isOpen]);


  // Effect to update form.dob when dobDay, dobMonth, or dobYear changes
  useEffect(() => {
    if (dobYear && dobMonth && dobDay) {
      const year = parseInt(dobYear, 10);
      const month = parseInt(dobMonth, 10);
      const day = parseInt(dobDay, 10);
      if (isExists(year, month - 1, day)) {
        const newDob = new Date(year, month - 1, day);
        if (year >= 1990 && year <= 2015) {
          form.setValue('dob', newDob, { shouldValidate: true });
        } else {
          form.setValue('dob', undefined as unknown as Date, { shouldValidate: true });
        }
      } else {
        form.setValue('dob', undefined as unknown as Date, { shouldValidate: true });
      }
    } else if (form.getValues('dob')) { // Only clear if it was set
        // form.setValue('dob', undefined as unknown as Date, { shouldValidate: true });
    }
  }, [dobDay, dobMonth, dobYear, form]);

  // Effect to update form.joinDate when joinDay, joinMonth, or joinYear changes
  useEffect(() => {
    if (joinYear && joinMonth && joinDay) {
      const year = parseInt(joinYear, 10);
      const month = parseInt(joinMonth, 10);
      const day = parseInt(joinDay, 10);
      if (isExists(year, month - 1, day)) {
        const newJoinDate = new Date(year, month - 1, day);
        const minJoinDate = new Date(2020, 0, 1);
        const maxJoinDate = new Date();
        if (newJoinDate >= minJoinDate && newJoinDate <= maxJoinDate) {
          form.setValue('joinDate', newJoinDate, { shouldValidate: true });
        } else {
          form.setValue('joinDate', undefined as unknown as Date, { shouldValidate: true });
        }
      } else {
        form.setValue('joinDate', undefined as unknown as Date, { shouldValidate: true });
      }
    } else if (form.getValues('joinDate')) { // Only clear if it was set
        // form.setValue('joinDate', undefined as unknown as Date, { shouldValidate: true });
    }
  }, [joinDay, joinMonth, joinYear, form]);

  // Dynamic days for DOB
  useEffect(() => {
    if (dobYear && dobMonth) {
      const numDays = dfnsGetDaysInMonth(new Date(parseInt(dobYear, 10), parseInt(dobMonth, 10) - 1));
      setDobDaysInMonth(Array.from({ length: numDays }, (_, i) => i + 1));
      if (parseInt(dobDay, 10) > numDays) {
        setDobDay(''); // Reset day if it's invalid for the new month/year
      }
    } else {
      setDobDaysInMonth([]);
    }
  }, [dobYear, dobMonth, dobDay]);

  // Dynamic days for Join Date
  useEffect(() => {
    if (joinYear && joinMonth) {
      const numDays = dfnsGetDaysInMonth(new Date(parseInt(joinYear, 10), parseInt(joinMonth, 10) - 1));
      setJoinDaysInMonth(Array.from({ length: numDays }, (_, i) => i + 1));
      if (parseInt(joinDay, 10) > numDays) {
        setJoinDay('');
      }
    } else {
      setJoinDaysInMonth([]);
    }
  }, [joinYear, joinMonth, joinDay]);


  async function onSubmit(data: EditEmployeeFormData) {
    if (!employee) return; // Should not happen if dialog is open with an employee

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...data,
        _id: employee._id, // Ensure _id is from the original employee prop
        joinDate: format(data.joinDate, 'yyyy-MM-dd'),
        dob: format(data.dob, 'yyyy-MM-dd'),
      };

      const result = await editEmployeeAction(submissionData);

      if (result.success && result.updatedEmployee) {
        toast({
          title: 'Employee Updated',
          description: `${data.name} has been successfully updated.`,
          variant: 'success',
        });
        onEmployeeUpdated?.(result.updatedEmployee);
        onOpenChange(false); // Close dialog
      } else {
        toast({
          title: 'Error Updating Employee',
          description: result.message || 'Failed to update employee. Please check the details.',
          variant: 'destructive',
        });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            const fieldName = field as keyof EditEmployeeFormData;
             if (messages && messages.length > 0 && form.getFieldState(fieldName) !== undefined) {
               form.setError(fieldName, { type: 'server', message: messages.join(', ')});
            }
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while updating the employee.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDialogClose = (openState: boolean) => {
    onOpenChange(openState);
    if (!openState) {
        // Reset form or other cleanup if dialog is closed without submitting
        form.reset({
            _id: '', name: '', nrc: '', phone: '09', address: '',
            position: undefined, gender: undefined,
        });
        setDobDay(''); setDobMonth(''); setDobYear('');
        setJoinDay(''); setJoinMonth(''); setJoinYear('');
    }
  }

  if (!employee && isOpen) { // Handle case where dialog is open but employee is null (should ideally not happen)
      return null; 
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update the employee's details below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Form Fields - Order: Name, Join Date, Position, Gender, DOB, Phone, NRC, Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="joinDate"
                render={() => (
                  <FormItem>
                    <FormLabel>Join Date</FormLabel>
                     <div className="flex gap-2">
                      <Select value={joinYear} onValueChange={setJoinYear} disabled={isSubmitting}>
                        <SelectTrigger className="flex-1" aria-label="Year of Join">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {joinYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={joinMonth} onValueChange={setJoinMonth} disabled={isSubmitting || !joinYear}>
                        <SelectTrigger className="flex-1" aria-label="Month of Join">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={joinDay} onValueChange={setJoinDay} disabled={isSubmitting || !joinMonth}>
                        <SelectTrigger className="flex-1" aria-label="Day of Join">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {joinDaysInMonth.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage>{form.formState.errors.joinDate?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeePositions.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dob"
                render={() => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <div className="flex gap-2">
                      <Select value={dobYear} onValueChange={setDobYear} disabled={isSubmitting}>
                        <SelectTrigger className="flex-1" aria-label="Year of Birth">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {dobYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={dobMonth} onValueChange={setDobMonth} disabled={isSubmitting || !dobYear}>
                        <SelectTrigger className="flex-1" aria-label="Month of Birth">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={dobDay} onValueChange={setDobDay} disabled={isSubmitting || !dobMonth}>
                        <SelectTrigger className="flex-1" aria-label="Day of Birth">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {dobDaysInMonth.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage>{form.formState.errors.dob?.message}</FormMessage>
                  </FormItem>
                )}
              />


               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="09xxxxxxxxx" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nrc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NRC Number <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 12/ABC(N)123456" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter full address"
                        className="resize-none"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
