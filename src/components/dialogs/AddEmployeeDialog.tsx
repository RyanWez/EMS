
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, getDaysInMonth as dfnsGetDaysInMonth, isExists, getYear, getMonth, getDate, startOfMonth, subYears } from 'date-fns';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addEmployeeAction, type ClientEmployee } from '@/actions/employeeActions';

const employeePositions = [
  "Super", "Leader", "Account Department", "Operation", "Security", "Fire Safety", "Cleaner"
] as const;

// Schema for form validation (client-side)
const employeeSchema = z.object({
  name: z.string().min(1, { message: 'Full name is required.' }),
  nrc: z.string().optional(),
  joinDate: z.date({ required_error: 'Join date is required.' }),
  position: z.enum(employeePositions, { required_error: 'Position is required.' }),
  gender: z.enum(['Male', 'Female'], { required_error: 'Gender is required.' }),
  dob: z.date({ required_error: 'Date of birth is required.' }),
  phone: z.string().optional().refine((val) => !val || /^09\d{7,9}$/.test(val), { message: 'Phone number must start with 09 and be 9 to 11 digits long.' }),
  address: z.string().optional(),
});

export type AddEmployeeFormData = z.infer<typeof employeeSchema>;

interface AddEmployeeDialogProps {
  children: ReactNode;
  onEmployeeAdded?: (newEmployee: ClientEmployee) => void;
}

const currentYear = new Date().getFullYear();
const dobYears = Array.from({ length: 2015 - 1990 + 1 }, (_, i) => 2015 - i); 
const joinYears = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i); 
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: format(new Date(0, i), 'MMMM'),
}));

const getDefaultDob = () => {
    const defaultDob = subYears(new Date(), 23);
    const year = getYear(defaultDob);
    if (year > 2015) defaultDob.setFullYear(2015);
    if (year < 1990) defaultDob.setFullYear(1990);
    return defaultDob;
};


export function AddEmployeeDialog({ children, onEmployeeAdded }: AddEmployeeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddEmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      nrc: '',
      phone: '',
      address: '',
      dob: getDefaultDob(),
    },
  });

  const [dobDay, setDobDay] = useState<string>(getDate(form.getValues('dob') || getDefaultDob()).toString());
  const [dobMonth, setDobMonth] = useState<string>((getMonth(form.getValues('dob') || getDefaultDob()) + 1).toString());
  const [dobYear, setDobYear] = useState<string>(getYear(form.getValues('dob') || getDefaultDob()).toString());

  const [joinDay, setJoinDay] = useState<string>('');
  const [joinMonth, setJoinMonth] = useState<string>('');
  const [joinYear, setJoinYear] = useState<string>('');

  const [dobDaysInMonth, setDobDaysInMonth] = useState<number[]>([]);
  const [joinDaysInMonth, setJoinDaysInMonth] = useState<number[]>([]);

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
            form.setValue('dob', undefined as unknown as Date, {shouldValidate: true}); 
        }
      } else {
        form.setValue('dob', undefined as unknown as Date, { shouldValidate: true });
      }
    } else {
        form.setValue('dob', undefined as unknown as Date, {shouldValidate: true});
    }
  }, [dobDay, dobMonth, dobYear, form]);

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
            form.setValue('joinDate', undefined as unknown as Date, {shouldValidate: true});
        }
      } else {
        form.setValue('joinDate', undefined as unknown as Date, { shouldValidate: true });
      }
    } else {
        form.setValue('joinDate', undefined as unknown as Date, {shouldValidate: true});
    }
  }, [joinDay, joinMonth, joinYear, form]);

  useEffect(() => {
    if (dobYear && dobMonth) {
      const numDays = dfnsGetDaysInMonth(new Date(parseInt(dobYear, 10), parseInt(dobMonth, 10) - 1));
      setDobDaysInMonth(Array.from({ length: numDays }, (_, i) => i + 1));
      if (parseInt(dobDay, 10) > numDays) {
        setDobDay(''); 
      }
    } else {
      setDobDaysInMonth([]);
    }
  }, [dobYear, dobMonth, dobDay]);

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


  async function onSubmit(data: AddEmployeeFormData) {
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...data,
        joinDate: format(data.joinDate, 'yyyy-MM-dd'),
        dob: format(data.dob, 'yyyy-MM-dd'),
      };
      
      const result = await addEmployeeAction(submissionData);

      if (result.success && result.newEmployee) {
        toast({
          title: 'Employee Added',
          description: `${data.name} has been successfully added.`,
          variant: 'success',
        });
        setIsOpen(false);
        const defaultDob = getDefaultDob();
        form.reset({
            name: '',
            nrc: '',
            phone: '',
            address: '',
            dob: defaultDob,
            joinDate: undefined,
            position: undefined,
            gender: undefined,
        });
        setDobDay(getDate(defaultDob).toString());
        setDobMonth((getMonth(defaultDob) + 1).toString());
        setDobYear(getYear(defaultDob).toString());
        setJoinDay('');
        setJoinMonth('');
        setJoinYear('');
        if (onEmployeeAdded) {
            onEmployeeAdded(result.newEmployee);
        }
      } else {
        toast({
          title: 'Error Adding Employee',
          description: result.message || 'Failed to add employee. Please check the details.',
          variant: 'destructive',
        });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            const fieldName = field as keyof AddEmployeeFormData;
            if (messages && messages.length > 0 && form.getFieldState(fieldName)) {
               form.setError(fieldName, { type: 'server', message: messages.join(', ')});
            }
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while adding the employee.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        const defaultDob = getDefaultDob();
        form.reset({
            name: '', nrc: '', phone: '', address: '',
            dob: defaultDob,
            joinDate: undefined, position: undefined, gender: undefined,
        });
        setDobDay(getDate(defaultDob).toString());
        setDobMonth((getMonth(defaultDob) + 1).toString());
        setDobYear(getYear(defaultDob).toString());
        setJoinDay(''); setJoinMonth(''); setJoinYear('');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>Fill in the form to add a new employee.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                    <FormLabel>Phone Number <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
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
                Add New Employee
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
