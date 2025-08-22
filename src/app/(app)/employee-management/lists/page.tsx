
'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Users, PlusCircle, Loader2, FileDown, Search, ChevronLeft, ChevronRight, Filter, XCircle, Eye, UserCog, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddEmployeeDialog } from '@/components/dialogs/AddEmployeeDialog';
import { EditEmployeeDialog } from '@/components/dialogs/EditEmployeeDialog';
import { ViewEmployeeDialog } from '@/components/dialogs/ViewEmployeeDialog';
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
import type { ClientEmployee } from '@/actions/employeeActions';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';


export interface Employee extends ClientEmployee {}

const employeePositionsList: Employee["position"][] = [
  "Super", "Leader", "Account Department", "Operation", "Security", "Fire Safety", "Cleaner"
];

const ALL_POSITIONS_KEY = "ALL_POSITIONS_FILTER_KEY";
const ALL_GENDERS_KEY = "ALL_GENDERS_FILTER_KEY";
const ANY_SERVICE_KEY = "ANY_SERVICE_KEY";

const serviceYearsRanges = [
  { value: ANY_SERVICE_KEY, label: "Any Service Years" },
  { value: "LT_1", label: "< 1 Year" },
  { value: "1_3", label: "1-3 Years" },
  { value: "3_5", label: "3-5 Years" }, 
  { value: "5_10", label: "5-10 Years" },
  { value: "GT_10", label: "10+ Years" },
];

const positionOrder: Employee["position"][] = [
  "Super",
  "Leader",
  "Account Department",
  "Operation",
  "Security",
  "Fire Safety",
  "Cleaner"
];

const sortEmployees = (employeesArray: Employee[]): Employee[] => {
  return [...employeesArray].sort((a, b) => {
    const posAIndex = positionOrder.indexOf(a.position);
    const posBIndex = positionOrder.indexOf(b.position);
    if (posAIndex !== posBIndex) {
      return posAIndex - posBIndex;
    }
    const dateA = parseISO(a.joinDate);
    const dateB = parseISO(b.joinDate);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime(); 
    }
    const createdAtA = parseISO(a.createdAt);
    const createdAtB = parseISO(b.createdAt);
    return createdAtA.getTime() - createdAtB.getTime();
  });
};

export const calculateServiceYears = (joinDateStr: string): string => {
  if (!joinDateStr) return "N/A";
  try {
    const joinDate = parseISO(joinDateStr);
    const now = new Date();
    if (isNaN(joinDate.getTime())) return "Invalid Date";

    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    let days = now.getDate() - joinDate.getDate();

    if (days < 0) {
      months--;
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += lastDayOfPrevMonth;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 0) return "Future Date";
    if (years === 0 && months === 0 && days === 0 && now.getTime() < joinDate.getTime() + 24*60*60*1000) return "Joined Today";
    if (years === 0 && months === 0 && days === 0) return "0 D";

    let result = [];
    if (years > 0) result.push(`${years} Y`);
    if (months > 0) result.push(`${months} M`);
    if (days > 0) result.push(`${days} D`);
    
    return result.length > 0 ? result.join(', ') : "0 D";
  } catch (error) {
    console.error("Error calculating service years:", error);
    return "Error Calc.";
  }
};

const getNumericServiceYears = (joinDateStr: string): number => {
  if (!joinDateStr) return -1;
  try {
    const joinDate = parseISO(joinDateStr); 
    const now = new Date();
    if (isNaN(joinDate.getTime())) return -1;

    let years = now.getFullYear() - joinDate.getFullYear();
    const monthDiff = now.getMonth() - joinDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < joinDate.getDate())) {
      years--;
    }
    return Math.max(0, years);
  } catch {
    return -1;
  }
};

export const getPositionBadgeClass = (position: Employee["position"]): string => {
    switch (position) {
      case "Super": return "bg-purple-100 text-purple-700 dark:bg-purple-900/80 dark:text-purple-300 border-purple-300 dark:border-purple-700";
      case "Leader": return "bg-green-100 text-green-700 dark:bg-green-900/80 dark:text-green-300 border-green-300 dark:border-green-700";
      case "Account Department": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
      case "Operation": return "bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300 border-blue-300 dark:border-blue-700";
      case "Security": return "bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-300 border-slate-300 dark:border-slate-700";
      case "Fire Safety": return "bg-orange-100 text-orange-700 dark:bg-orange-900/80 dark:text-orange-300 border-orange-300 dark:border-orange-700";
      case "Cleaner": return "bg-gray-100 text-gray-700 dark:bg-gray-700/80 dark:text-gray-300 border-gray-300 dark:border-gray-700";
      default: return "text-foreground border-border";
    }
};

export const getGenderBadgeClass = (gender: Employee["gender"]): string => {
    if (gender === "Male") return "bg-sky-100 text-sky-700 dark:bg-sky-900/80 dark:text-sky-300 border-sky-300 dark:border-sky-700";
    else if (gender === "Female") return "bg-pink-100 text-pink-700 dark:bg-pink-900/80 dark:text-pink-300 border-pink-300 dark:border-pink-700";
    return "text-foreground border-border";
};

const baseTableHeadersConfig = [
  { key: "name", label: "Name", className: "sticky left-0 z-20 bg-muted min-w-[150px] md:min-w-[200px]", cellClassName: "sticky left-0 z-10"},
  { key: "joinDate", label: "Join Date", className: "min-w-[120px]" },
  { key: "serviceYears", label: "Service Years", className: "min-w-[150px]", permission: "employee:view_service_years"},
  { key: "position", label: "Position", className: "min-w-[150px]", permission: "employee:view_position" }, 
  { key: "gender", label: "Gender", className: "min-w-[100px]", permission: "employee:view_gender" }, 
  { key: "dob", label: "DOB", className: "min-w-[120px]", permission: "employee:view_dob" }, 
  { key: "phone", label: "Phone No.", className: "min-w-[150px]", permission: "employee:view_phone" }, 
  { key: "nrc", label: "NRC", className: "min-w-[180px]", permission: "employee:view_nrc" }, 
  { key: "address", label: "Address", className: "min-w-[150px]", permission: "employee:view_address" }, 
  { key: "action", label: "Action", className: "sticky right-0 z-20 bg-muted min-w-[150px] text-center", cellClassName: "sticky right-0 z-10 text-center" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const genderOptions: Employee["gender"][] = ["Male", "Female"];

export default function EmployeeListPage() {
  const { user, isLoading: authLoading, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>(ALL_POSITIONS_KEY);
  const [selectedGender, setSelectedGender] = useState<string>(ALL_GENDERS_KEY);
  const [selectedServiceYearRange, setSelectedServiceYearRange] = useState<string>(ANY_SERVICE_KEY);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);

  const canViewPage = hasPermission('employee:view_list_page');
  const canExportData = hasPermission('employee:export');
  const canAddNewEmployee = hasPermission('employee:add_new');
  const canEditEmployee = hasPermission('employee:edit_action');
  const canDeleteEmployee = hasPermission('employee:delete_action');
  const canViewDetailsModal = hasPermission('employee:view_details_modal');

  const tableHeadersConfig = useMemo(() => {
    return baseTableHeadersConfig.filter(header => {
      if (header.key === 'action') return true; // Always show action column if any action is permitted
      if (header.key === 'name' || header.key === 'joinDate') return true; // Always show these base columns
      return header.permission ? hasPermission(header.permission) : true;
    });
  }, [hasPermission]);


  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch employees: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to fetch employees: ${response.statusText}`);
      }
      const data: { employees: ClientEmployee[] } = await response.json();
      const fetchedEmployees: Employee[] = (data.employees || []).map((emp: ClientEmployee) => ({
        ...emp,
      }));
      setEmployees(sortEmployees(fetchedEmployees));
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && canViewPage) {
      fetchEmployees();
    } else if (!authLoading && !canViewPage) {
        setError("You do not have permission to view this page.");
        setIsLoading(false);
    }
  }, [authLoading, canViewPage]);


  const handleEmployeeAdded = (newEmployeeData: ClientEmployee) => {
     setEmployees(prevEmployees => sortEmployees([newEmployeeData as Employee, ...prevEmployees.filter(emp => emp._id !== newEmployeeData._id)]));
  };

  const handleEmployeeUpdated = (updatedEmployeeData: ClientEmployee) => {
    setEmployees(prevEmployees =>
      sortEmployees(
        prevEmployees.map(emp =>
          emp._id === updatedEmployeeData._id ? (updatedEmployeeData as Employee) : emp
        )
      )
    );
    setIsEditDialogOpen(false);
  };

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
  };

  const openEditDialog = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsEditDialogOpen(true);
  };
  
  const openViewDialog = (employee: Employee) => {
    setEmployeeToView(employee);
    setIsViewDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    
    const originalEmployees = [...employees]; 
    const employeeNameToDelete = employeeToDelete.name;
    setEmployees(prevEmployees => sortEmployees(prevEmployees.filter(emp => emp._id !== employeeToDelete._id)));
    setEmployeeToDelete(null); 

    try {
      const response = await fetch(`/api/employees/${employeeToDelete._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete employee.'}));
        throw new Error(errorData.message || 'Failed to delete employee.');
      }
      toast({
        title: 'Employee Deleted',
        description: `${employeeNameToDelete} has been successfully deleted.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error Deleting Employee',
        description: err instanceof Error ? err.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
      setEmployees(sortEmployees(originalEmployees)); 
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportTable = () => {
    if (filteredEmployees.length === 0) { 
      toast({
        title: 'No Data',
        description: 'There is no data matching your current filters to export.',
        variant: 'default',
      });
      return;
    }
    const headers = tableHeadersConfig
      .filter(header => header.key !== 'action')
      .map(header => header.label);
    const rows = filteredEmployees.map(emp => { 
      return tableHeadersConfig
        .filter(header => header.key !== 'action')
        .map(hConfig => {
          switch (hConfig.key) {
            case 'name': return emp.name.toUpperCase();
            case 'joinDate': return emp.joinDate;
            case 'serviceYears': return calculateServiceYears(emp.joinDate);
            case 'position': return emp.position;
            case 'gender': return emp.gender;
            case 'dob': return emp.dob;
            case 'phone': return emp.phone;
            case 'nrc': return emp.nrc || 'N/A';
            case 'address': return emp.address || 'N/A';
            default: return '';
          }
        });
    });
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'employees_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
     toast({
        title: 'Exporting Data',
        description: 'Employee data is being exported to CSV.',
        variant: 'success',
      });
  };

  const filteredEmployees = useMemo(() => {
    let tempEmployees = [...employees];
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      tempEmployees = tempEmployees.filter(emp =>
        emp.name.toLowerCase().includes(lowercasedQuery) ||
        (hasPermission('employee:view_position') && emp.position.toLowerCase().includes(lowercasedQuery)) ||
        (hasPermission('employee:view_phone') && emp.phone.includes(searchQuery)) ||
        (hasPermission('employee:view_nrc') && emp.nrc && emp.nrc.toLowerCase().includes(lowercasedQuery))
      );
    }
    if (selectedPosition !== ALL_POSITIONS_KEY) {
      tempEmployees = tempEmployees.filter(emp => emp.position === selectedPosition);
    }
    if (selectedGender !== ALL_GENDERS_KEY) {
      tempEmployees = tempEmployees.filter(emp => emp.gender === selectedGender);
    }

    if (selectedServiceYearRange !== ANY_SERVICE_KEY) {
      tempEmployees = tempEmployees.filter(emp => {
        const numYears = getNumericServiceYears(emp.joinDate);
        if (numYears === -1) return false; 
        switch (selectedServiceYearRange) {
          case "LT_1": return numYears < 1;
          case "1_3": return numYears >= 1 && numYears <= 3;
          case "3_5": return numYears > 3 && numYears <= 5; 
          case "5_10": return numYears > 5 && numYears <= 10;
          case "GT_10": return numYears > 10;
          default: return true;
        }
      });
    }

    return tempEmployees;
  }, [employees, searchQuery, selectedPosition, selectedGender, selectedServiceYearRange, hasPermission]);

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, rowsPerPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePositionChange = (value: string) => {
    setSelectedPosition(value);
    setCurrentPage(1);
  };

  const handleGenderChange = (value: string) => {
    setSelectedGender(value);
    setCurrentPage(1);
  };

  const handleServiceYearRangeChange = (value: string) => {
    setSelectedServiceYearRange(value);
    setCurrentPage(1);
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedPosition(ALL_POSITIONS_KEY);
    setSelectedGender(ALL_GENDERS_KEY);
    setSelectedServiceYearRange(ANY_SERVICE_KEY);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const isAnyFilterActive = searchQuery || selectedPosition !== ALL_POSITIONS_KEY || selectedGender !== ALL_GENDERS_KEY || selectedServiceYearRange !== ANY_SERVICE_KEY;

  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading employees...</p>
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
      <div className="pb-4 border-b border-border space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center">
                    <Users className="h-7 w-7 mr-3 text-primary" /> Employee List
                </h2>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-center">
                {canExportData && (
                    <Button variant="outline" onClick={handleExportTable}>
                        <FileDown className="mr-2 h-4 w-4" /> Export
                    </Button>
                )}
                {canAddNewEmployee && (
                    <AddEmployeeDialog onEmployeeAdded={handleEmployeeAdded}>
                        <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New
                        </Button>
                    </AddEmployeeDialog>
                )}
            </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row flex-wrap gap-4 items-center p-4 border border-border rounded-lg bg-card shadow-sm">
        <div className="flex-grow w-full md:w-auto md:min-w-[240px] relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by name, position, phone, NRC..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8 w-full"
            />
        </div>
        {hasPermission('employee:view_position') && (
            <div className="flex-grow w-full md:w-auto md:min-w-[180px]">
            <Select value={selectedPosition} onValueChange={handlePositionChange}>
                <SelectTrigger>
                <SelectValue placeholder="Filter by Position" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value={ALL_POSITIONS_KEY}>All Positions</SelectItem>
                {employeePositionsList.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
        )}
        {hasPermission('employee:view_gender') && (
            <div className="flex-grow w-full md:w-auto md:min-w-[180px]">
            <Select value={selectedGender} onValueChange={handleGenderChange}>
                <SelectTrigger>
                <SelectValue placeholder="Filter by Gender" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value={ALL_GENDERS_KEY}>All Genders</SelectItem>
                {genderOptions.map(gen => (
                    <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
        )}
        {hasPermission('employee:view_service_years') && (
            <div className="flex-grow w-full md:w-auto md:min-w-[180px]">
            <Select value={selectedServiceYearRange} onValueChange={handleServiceYearRangeChange}>
                <SelectTrigger>
                <SelectValue placeholder="Filter by Service Years" />
                </SelectTrigger>
                <SelectContent>
                {serviceYearsRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
        )}
        {isAnyFilterActive && (
          <Button variant="ghost" onClick={handleClearFilters} className="text-muted-foreground hover:text-destructive">
            <XCircle className="mr-2 h-4 w-4" /> Clear All Filters
          </Button>
        )}
      </div>


      <AlertDialog open={!!employeeToDelete || isViewDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setEmployeeToDelete(null);
            setIsViewDialogOpen(false);
            setEmployeeToView(null);
            setIsEditDialogOpen(false);
            setEmployeeToEdit(null);
          }
      }}>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative">
            <Table className="min-w-full">
               <TableHeader className="bg-muted">
                <TableRow>
                  {tableHeadersConfig.map((header) => (
                    <TableHead
                      key={header.key}
                      className={cn(`
                        p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap
                        sticky top-0 bg-muted`,
                        header.className,
                        (header.key === "name" || header.key === "action") && "z-30 bg-muted" 
                      )}
                    >
                      {header.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border bg-card">
                {(isLoading && !employees.length) ? ( 
                   <TableRow>
                    <TableCell
                      colSpan={tableHeadersConfig.length}
                      className="h-48 text-center text-lg text-muted-foreground"
                    >
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary my-4" />
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : error && !employees.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableHeadersConfig.length}
                      className="h-48 text-center text-lg text-destructive"
                    >
                      Error loading employees: {error}
                    </TableCell>
                  </TableRow>
                ) : paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableHeadersConfig.length}
                      className="h-48 text-center text-lg text-muted-foreground"
                    >
                      {isAnyFilterActive ? "No employees found matching your criteria." : "No employees found."}
                      <br />
                      {!isAnyFilterActive && canAddNewEmployee && "Click \"Add New\" to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const isDeletingCurrent = isDeleting && employeeToDelete?._id === emp._id;
                    return (
                    <TableRow key={emp._id} className={cn(
                        "group hover:bg-muted", 
                        isDeletingCurrent && "opacity-50"
                        )}>
                      {tableHeadersConfig.map((header) => {
                        const minWidthClasses = header.className ? header.className.split(" ").filter(c => c.startsWith("min-w-") || c.startsWith("md:min-w-")).join(" ") : "";
                        const isStickyCell = header.key === "name" || header.key === "action";

                        let cellContent: ReactNode;
                        switch (header.key) {
                            case "name": 
                                cellContent = (
                                    <div className="flex items-center">
                                        {emp.name.toUpperCase()}
                                    </div>
                                ); 
                                break;
                            case "joinDate": cellContent = emp.joinDate ? format(parseISO(emp.joinDate), "yyyy-MM-dd") : "N/A"; break;
                            case "serviceYears": cellContent = calculateServiceYears(emp.joinDate); break;
                            case "position": cellContent = <Badge variant="outline" className={cn("font-normal", getPositionBadgeClass(emp.position))}>{emp.position}</Badge>; break;
                            case "gender": cellContent = <Badge variant="outline" className={cn("font-normal", getGenderBadgeClass(emp.gender))}>{emp.gender}</Badge>; break;
                            case "dob": cellContent = emp.dob ? format(parseISO(emp.dob), "yyyy-MM-dd") : "N/A"; break;
                            case "phone": cellContent = emp.phone; break;
                            case "nrc": cellContent = (emp.nrc || <span className="text-xs text-muted-foreground/80">N/A</span>); break;
                            case "address": cellContent = (emp.address || <span className="text-xs text-muted-foreground/80">N/A</span>); break;
                            case "action":
                                cellContent = (
                                  <div className={cn("flex items-center justify-center space-x-1.5")}>
                                    {canViewDetailsModal && (
                                        <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 border-blue-500/50 hover:border-blue-500 text-blue-500 hover:bg-blue-500/5"
                                        onClick={() => openViewDialog(emp)}
                                        disabled={isDeleting}
                                        title={`View details for ${emp.name}`}
                                        >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View {emp.name}</span>
                                        </Button>
                                    )}
                                    {canEditEmployee && (
                                        <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 border-primary/50 hover:border-primary text-primary hover:bg-primary/5"
                                        onClick={() => openEditDialog(emp)}
                                        disabled={isDeleting}
                                        title={`Edit ${emp.name}`}
                                        >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit {emp.name}</span>
                                        </Button>
                                    )}
                                    {canDeleteEmployee && (
                                        <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 border-destructive/50 hover:border-destructive text-destructive hover:bg-destructive/5"
                                            onClick={() => openDeleteDialog(emp)}
                                            disabled={isDeleting}
                                            title={`Delete ${emp.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete ${emp.name}</span>
                                        </Button>
                                        </AlertDialogTrigger>
                                    )}
                                    {/* If no actions are permitted, show a placeholder or nothing */}
                                    {!canViewDetailsModal && !canEditEmployee && !canDeleteEmployee && (
                                        <span className="text-xs text-muted-foreground">No actions</span>
                                    )}
                                  </div>
                                );
                                break;
                            default: cellContent = null;
                        }

                        return (
                          <TableCell
                            key={`${emp._id}-${header.key}`}
                            className={cn(
                              "p-3 text-sm text-foreground whitespace-nowrap",
                              header.cellClassName,
                              minWidthClasses,
                              isStickyCell && "bg-card group-hover:bg-muted"
                            )}
                          >
                           {cellContent}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {employeeToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the employee record for <strong className="text-foreground">{employeeToDelete.name}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} onClick={() => setEmployeeToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteEmployee}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

       <EditEmployeeDialog
        isOpen={isEditDialogOpen}
        onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEmployeeToEdit(null);
        }}
        employee={employeeToEdit}
        onEmployeeUpdated={handleEmployeeUpdated}
      />

      <ViewEmployeeDialog
        isOpen={isViewDialogOpen}
        onOpenChange={(open) => {
            setIsViewDialogOpen(open);
            if (!open) setEmployeeToView(null);
        }}
        employee={employeeToView}
        userPermissions={user?.permissions || []}
      />


      {(!isLoading || employees.length > 0) && !error && filteredEmployees.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex-1 text-center sm:text-left">
            Total {filteredEmployees.length} {filteredEmployees.length === 1 ? "employee" : "employees"}.
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={rowsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {ROWS_PER_PAGE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
