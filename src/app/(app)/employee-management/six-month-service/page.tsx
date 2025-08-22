
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CalendarCheck2, ListFilter, Search, ShieldAlert, User, Briefcase } from "lucide-react";
import { format, parseISO, getMonth, getDate, addMonths, isBefore, startOfDay, getYear } from 'date-fns';
import type { ClientEmployee } from '@/actions/employeeActions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { calculateServiceYears, getPositionBadgeClass } from '@/app/(app)/employee-management/lists/page';

interface EmployeeAnniversaryItem {
  _id: string;
  name: string;
  position: ClientEmployee["position"];
  joinDate: string; // Keep original join date for display if needed
  nextAnniversaryDate: Date; // Still needed for filtering/grouping logic
  currentServiceDuration: string;
}

interface MonthAnniversaryGroup {
  monthIndex: number; // 0-11
  monthName: string;
  anniversaries: EmployeeAnniversaryItem[];
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function SixMonthServiceAnniversaryPage() {
  const { isLoading: authLoading, hasPermission } = useAuth();
  const [allEmployees, setAllEmployees] = useState<ClientEmployee[]>([]);
  const [processedAnniversaries, setProcessedAnniversaries] = useState<MonthAnniversaryGroup[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState<string | null>(null);

  const canViewPage = hasPermission('employee:view_six_month_service_page');
  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    if (authLoading) {
        setIsLoading(true);
        return;
    }
    if (!canViewPage) {
      setError("You do not have permission to view this page.");
      setIsLoading(false);
      return;
    }

    const fetchAndProcessAnniversaries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to fetch employee data: ${response.statusText}` }));
          throw new Error(errorData.message || `Failed to fetch employee data: ${response.statusText}`);
        }
        const data: { employees: ClientEmployee[] } = await response.json();
        const employees = data.employees || [];
        setAllEmployees(employees);

        const monthData: MonthAnniversaryGroup[] = monthNames.map((name, displayMonthIndex) => {
          const anniversariesInThisDisplayMonth: EmployeeAnniversaryItem[] = [];
          
          employees.forEach(emp => {
            if (emp.joinDate) {
              try {
                const joinDateObj = parseISO(emp.joinDate);
                
                // Iterate through potential 6-month anniversaries starting from join date
                let anniversaryCandidate = joinDateObj;
                for (let i = 0; i < 240; i++) { // Check up to 120 years (240 * 6 months)
                  if (i > 0) { 
                    anniversaryCandidate = addMonths(joinDateObj, i * 6);
                  }
                  
                  if (getMonth(anniversaryCandidate) === displayMonthIndex && !isBefore(anniversaryCandidate, today)) {
                    anniversariesInThisDisplayMonth.push({
                      _id: emp._id,
                      name: emp.name,
                      position: emp.position,
                      joinDate: emp.joinDate, // Store original join date
                      nextAnniversaryDate: anniversaryCandidate, // Store the calculated specific anniversary
                      currentServiceDuration: calculateServiceYears(emp.joinDate),
                    });
                    break; 
                  }
                  
                  const candidateYear = getYear(anniversaryCandidate);
                  const todayYear = getYear(today);
                  if (candidateYear > todayYear + 2 && getMonth(anniversaryCandidate) !== displayMonthIndex) {
                     break;
                  }
                   if (candidateYear > todayYear + 5) {
                    break;
                  }
                }
              } catch (parseError) {
                console.warn(`Could not parse joinDate for employee ${emp.name} (ID: ${emp._id}): ${emp.joinDate}`, parseError);
              }
            }
          });

          anniversariesInThisDisplayMonth.sort((a, b) => 
            a.nextAnniversaryDate.getTime() - b.nextAnniversaryDate.getTime() || 
            a.name.localeCompare(b.name)
          );
          
          return {
            monthIndex: displayMonthIndex,
            monthName: name,
            anniversaries: anniversariesInThisDisplayMonth,
          };
        });
        
        setProcessedAnniversaries(monthData);

      } catch (err) {
        console.error("Error fetching or processing anniversaries:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessAnniversaries();
  }, [authLoading, canViewPage, today]);

  useEffect(() => {
    if (!isLoading && !authLoading && canViewPage && processedAnniversaries.length > 0 && selectedMonthIndex === null) {
      const currentActualMonth = getMonth(new Date()); 
      const currentMonthData = processedAnniversaries.find(
        m => m.monthIndex === currentActualMonth && m.anniversaries.length > 0
      );
      if (currentMonthData) {
        setSelectedMonthIndex(currentActualMonth);
      } else {
        const firstMonthWithData = processedAnniversaries.find(m => m.anniversaries.length > 0);
        setSelectedMonthIndex(firstMonthWithData ? firstMonthWithData.monthIndex : currentActualMonth);
      }
    }
  }, [isLoading, authLoading, canViewPage, processedAnniversaries, selectedMonthIndex]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (isLoading || authLoading || !canViewPage || processedAnniversaries.length === 0) return;

    if (!debouncedSearchQuery) {
      setHighlightedEmployeeId(null);
      return;
    }

    const lowercasedQuery = debouncedSearchQuery.toLowerCase();
    const foundEmployee = allEmployees.find(emp => emp.name.toLowerCase().includes(lowercasedQuery));

    if (foundEmployee?.joinDate) {
      let earliestUpcomingAnniversaryOverall: Date | null = null;
      const joinDateObj = parseISO(foundEmployee.joinDate);

      for (let i = 0; i < 48; i++) { 
        const candidate = addMonths(joinDateObj, i * 6);
        if (!isBefore(candidate, today)) {
          earliestUpcomingAnniversaryOverall = candidate;
          break;
        }
      }

      if (earliestUpcomingAnniversaryOverall) {
        const anniversaryMonth = getMonth(earliestUpcomingAnniversaryOverall);
        setSelectedMonthIndex(anniversaryMonth);
        setHighlightedEmployeeId(foundEmployee._id);
      } else {
        setHighlightedEmployeeId(null);
      }
    } else {
      setHighlightedEmployeeId(null);
    }
  }, [debouncedSearchQuery, allEmployees, processedAnniversaries, isLoading, authLoading, canViewPage, today]);

  const anniversariesForSelectedMonth = useMemo(() => {
    if (selectedMonthIndex === null) return [];
    const monthGroup = processedAnniversaries.find(m => m.monthIndex === selectedMonthIndex);
    return monthGroup?.anniversaries || [];
  }, [selectedMonthIndex, processedAnniversaries]);

  const selectedMonthName = useMemo(() => {
    if (selectedMonthIndex === null) return "";
    return monthNames[selectedMonthIndex];
  }, [selectedMonthIndex]);

  if (authLoading || (isLoading && canViewPage)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading 6-Month Service Data...</p>
      </div>
    );
  }

  if (!canViewPage && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">{error || "You do not have permission to view this page."}</p>
      </div>
    );
  }
  
  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-destructive">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error Loading Data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center">
            <CalendarCheck2 className="h-7 w-7 mr-3 text-primary" /> Upcoming 6-Month Service Milestones
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a month to view upcoming 6-month service milestones or search by name.
          </p>
        </div>
        <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search employee by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
            />
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 md:p-6">
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4 lg:col-span-3 flex flex-col">
              <div className="pb-3 border-b mb-3 flex-shrink-0">
                <h3 className="text-lg font-semibold flex items-center text-foreground">
                  <ListFilter className="h-5 w-5 mr-2 text-primary" />
                  Filter by Month
                </h3>
              </div>
              <ScrollArea className="flex-grow max-h-96 md:max-h-[calc(100vh-22rem)] pr-2">
                <div className="space-y-1">
                  {processedAnniversaries.map((month) => (
                    <Button
                      key={month.monthIndex}
                      variant={selectedMonthIndex === month.monthIndex ? "default" : "outline"}
                      className={cn(
                        "w-full justify-start text-sm h-10 px-3 shadow-sm hover:shadow-md",
                        selectedMonthIndex === month.monthIndex 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "text-foreground hover:bg-muted border-border"
                      )}
                      onClick={() => {
                        setSelectedMonthIndex(month.monthIndex);
                        setSearchQuery(''); 
                        setDebouncedSearchQuery('');
                        setHighlightedEmployeeId(null);
                      }}
                    >
                      <CalendarCheck2
                         className={cn(
                          "h-4 w-4 mr-3",
                          selectedMonthIndex === month.monthIndex 
                            ? "text-primary-foreground/90" 
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="flex-grow">{month.monthName}</span>
                      {month.anniversaries.length > 0 && (
                        <Badge 
                          variant={selectedMonthIndex === month.monthIndex ? "secondary" : "outline"}
                          className={cn(
                            "h-5 px-2 text-xs",
                            selectedMonthIndex === month.monthIndex ? "bg-primary-foreground/20 text-primary-foreground" : "border-border text-muted-foreground"
                          )}
                        >
                          {month.anniversaries.length}
                        </Badge>
                      )}
                    </Button>
                  ))}
                  {processedAnniversaries.every(m => m.anniversaries.length === 0) && !isLoading && (
                     <p className="p-3 text-sm text-muted-foreground text-center">No anniversary data available.</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="md:col-span-8 lg:col-span-9 md:border-l md:pl-6 flex flex-col">
              <div className="bg-muted/30 py-3 px-4 rounded-lg mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold flex items-center text-foreground">
                  <CalendarCheck2 className="h-5 w-5 mr-2 text-primary" />
                  Milestones in {selectedMonthName || (debouncedSearchQuery && !highlightedEmployeeId ? 'All Months (No Match)' : (selectedMonthIndex !== null ? '' : 'Select a Month'))}
                </h3>
              </div>
              
              <ScrollArea className="flex-grow max-h-96 md:max-h-[calc(100vh-22rem)] pr-2">
                {anniversariesForSelectedMonth.length === 0 && selectedMonthIndex !== null && !debouncedSearchQuery ? ( 
                  <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                      <CalendarCheck2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No 6-month service milestones in {selectedMonthName}.</p>
                  </div>
                ) : anniversariesForSelectedMonth.length === 0 && debouncedSearchQuery && !highlightedEmployeeId ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No employee matched your search: "{debouncedSearchQuery}".</p>
                  </div>
                ) : anniversariesForSelectedMonth.length === 0 && selectedMonthIndex === null && !debouncedSearchQuery ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                      <ListFilter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Please select a month to view milestones.</p>
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {anniversariesForSelectedMonth.map((emp, index) => (
                      <li 
                          key={emp._id} 
                          className={cn(
                              "flex items-start p-3 bg-background hover:bg-muted/50 rounded-lg border border-border transition-colors shadow-sm",
                              emp._id === highlightedEmployeeId && "ring-2 ring-primary ring-offset-2 shadow-md"
                          )}
                      >
                        <Avatar className="h-10 w-10 mr-3 border mt-1">
                          <AvatarFallback className="bg-muted">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <p className="font-semibold text-foreground leading-tight">{emp.name.toUpperCase()}</p>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Original Join: {format(parseISO(emp.joinDate), 'MMM d, yyyy')}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                            <Badge variant="outline" className={cn("font-normal text-xs py-0.5", getPositionBadgeClass(emp.position))}>
                                <Briefcase className="h-3 w-3 mr-1.5" />{emp.position}
                            </Badge>
                            <Badge variant="secondary" className="text-xs py-0.5">
                                Current Service: {emp.currentServiceDuration}
                            </Badge>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                 {anniversariesForSelectedMonth.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3 text-center flex-shrink-0">
                    Showing {anniversariesForSelectedMonth.length} employee(s) for {selectedMonthName}.
                  </p>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

