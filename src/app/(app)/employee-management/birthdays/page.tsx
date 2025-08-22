
'use client';

import { useState, useEffect, useMemo, useCallback, type MouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Cake, User, Loader2, AlertTriangle, CalendarDays, ListFilter, Search, Sparkles, Copy, PartyPopper } from "lucide-react";
import { format, parseISO, getMonth, getDate } from 'date-fns';
import type { ClientEmployee } from '@/actions/employeeActions';
import { generateBirthdayWish, type BirthdayWishInput, type BirthdayWishOutput } from '@/ai/flows/birthdayWishFlow';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface EmployeeBirthdayItem {
  _id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  birthDay: number;
  birthMonth: number; // 0-11 for easy sorting
}

interface MonthBirthdayGroup {
  monthIndex: number; // 0-11
  monthName: string;
  birthdays: EmployeeBirthdayItem[];
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function EmployeeBirthdaysPage() {
  const [allEmployees, setAllEmployees] = useState<ClientEmployee[]>([]);
  const [processedBirthdays, setProcessedBirthdays] = useState<MonthBirthdayGroup[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState(''); // Immediate input value
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); // Debounced value for searching
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState<string | null>(null);

  const [isWishGeneratingFor, setIsWishGeneratingFor] = useState<string | null>(null);
  const [generatedWish, setGeneratedWish] = useState<string | null>(null);
  const [showWishPopoverFor, setShowWishPopoverFor] = useState<string | null>(null);

  const [todaysBirthdays, setTodaysBirthdays] = useState<EmployeeBirthdayItem[]>([]);
  
  const { toast } = useToast();

  const triggerConfetti = useCallback(() => {
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
    const end = Date.now() + 1.5 * 1000; 

    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
        zIndex: 9999,
      });
      if (typeof window !== 'undefined') {
          requestAnimationFrame(frame);
      }
    };
    if (typeof window !== 'undefined') {
      frame();
    }
  }, []);


  const isBirthdayTodayCheck = useCallback((dobString: string): boolean => {
    if (!dobString) return false;
    try {
      const dobDate = parseISO(dobString);
      const today = new Date();
      return getMonth(dobDate) === getMonth(today) && getDate(dobDate) === getDate(today);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const fetchAndProcessBirthdays = async () => {
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

        const currentTodaysBirthdaysList: EmployeeBirthdayItem[] = [];
        const groupedByMonth: Record<number, EmployeeBirthdayItem[]> = {};
        
        employees.forEach(emp => {
          if (emp.dob) {
            try {
              const dobDate = parseISO(emp.dob);
              const month = getMonth(dobDate);
              const day = getDate(dobDate);
              const birthdayItem: EmployeeBirthdayItem = {
                _id: emp._id,
                name: emp.name,
                dob: emp.dob,
                birthDay: day,
                birthMonth: month,
              };
              if (!groupedByMonth[month]) {
                groupedByMonth[month] = [];
              }
              groupedByMonth[month].push(birthdayItem);
              if (isBirthdayTodayCheck(emp.dob)) {
                currentTodaysBirthdaysList.push(birthdayItem);
              }
            } catch (parseError) {
              console.warn(`Could not parse DOB for employee ${emp.name} (ID: ${emp._id}): ${emp.dob}`, parseError);
            }
          }
        });
        setTodaysBirthdays(currentTodaysBirthdaysList);

        if (currentTodaysBirthdaysList.length > 0 && typeof window !== 'undefined' && !sessionStorage.getItem('confettiShownToday')) {
          triggerConfetti(); 
          sessionStorage.setItem('confettiShownToday', 'true');
        }

        const monthData: MonthBirthdayGroup[] = monthNames.map((name, index) => {
          const birthdaysInMonth = groupedByMonth[index] || [];
          birthdaysInMonth.sort((a, b) => a.birthDay - b.birthDay);
          return {
            monthIndex: index,
            monthName: name,
            birthdays: birthdaysInMonth,
          };
        });
        
        setProcessedBirthdays(monthData);

        // Initial month selection logic moved to the search useEffect
      } catch (err) {
        console.error("Error fetching or processing birthdays:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessBirthdays();
  }, [triggerConfetti, isBirthdayTodayCheck]); 

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Effect for handling search and initial month selection
  useEffect(() => {
    if (isLoading || processedBirthdays.length === 0) return;

    if (!debouncedSearchQuery) { // Use debouncedSearchQuery here
      setHighlightedEmployeeId(null);
      if (selectedMonthIndex === null || !processedBirthdays.find(m => m.monthIndex === selectedMonthIndex)?.birthdays.length) { 
          const currentMonth = getMonth(new Date());
          const currentMonthData = processedBirthdays.find(m => m.monthIndex === currentMonth);
          if (currentMonthData && currentMonthData.birthdays.length > 0) {
            setSelectedMonthIndex(currentMonth);
          } else {
            const firstMonthWithBirthdays = processedBirthdays.find(m => m.birthdays.length > 0);
            setSelectedMonthIndex(firstMonthWithBirthdays ? firstMonthWithBirthdays.monthIndex : currentMonth);
          }
      }
      return;
    }

    const lowercasedQuery = debouncedSearchQuery.toLowerCase(); // Use debouncedSearchQuery
    const foundEmployee = allEmployees.find(emp => emp.name.toLowerCase().includes(lowercasedQuery));

    if (foundEmployee && foundEmployee.dob) {
      try {
        const dobDate = parseISO(foundEmployee.dob);
        const birthMonth = getMonth(dobDate);
        setSelectedMonthIndex(birthMonth);
        setHighlightedEmployeeId(foundEmployee._id);
      } catch (parseError) {
        console.warn(`Could not parse DOB for searched employee ${foundEmployee.name}: ${foundEmployee.dob}`, parseError);
        setHighlightedEmployeeId(null);
      }
    } else {
      setHighlightedEmployeeId(null);
      // If no employee found for search, optionally clear selected month or show a "not found" state
      // For now, it keeps the last selected month or defaults if no employee matches
    }
  }, [debouncedSearchQuery, allEmployees, processedBirthdays, isLoading, selectedMonthIndex]);


  const birthdaysForSelectedMonth = useMemo(() => {
    if (selectedMonthIndex === null) return [];
    const monthGroup = processedBirthdays.find(m => m.monthIndex === selectedMonthIndex);
    if (!monthGroup) return [];
    
    // If there's an active search query and an employee is highlighted, ensure they are in the list
    // This might not be necessary if setSelectedMonthIndex correctly shows the searched employee's month
    return monthGroup.birthdays;

  }, [selectedMonthIndex, processedBirthdays, highlightedEmployeeId, debouncedSearchQuery]);

  const selectedMonthName = useMemo(() => {
    if (selectedMonthIndex === null) return "";
    return monthNames[selectedMonthIndex];
  }, [selectedMonthIndex]);

  const handleGenerateWish = async (employee: EmployeeBirthdayItem) => {
    setIsWishGeneratingFor(employee._id);
    setGeneratedWish(null);
    setShowWishPopoverFor(null); 
    try {
      const input: BirthdayWishInput = { employeeName: employee.name };
      const result: BirthdayWishOutput = await generateBirthdayWish(input);
      setGeneratedWish(result.wish);
      setShowWishPopoverFor(employee._id); 
    } catch (error) {
      console.error("Error generating birthday wish:", error);
      setGeneratedWish("Failed to generate wish. Please try again.");
      setShowWishPopoverFor(employee._id); 
      toast({
        title: "Error",
        description: "Could not generate birthday wish.",
        variant: "destructive",
      });
    } finally {
      setIsWishGeneratingFor(null);
    }
  };

  const handleCopyWish = (wish: string | null) => {
    if (wish && navigator.clipboard) {
      navigator.clipboard.writeText(wish)
        .then(() => {
          toast({ title: "Copied!", description: "Birthday wish copied to clipboard.", variant: "success" });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy wish.", variant: "destructive" });
          console.error('Failed to copy text: ', err);
        });
    }
  };
  
  const handleEmployeeCardClick = (employee: EmployeeBirthdayItem) => {
    if (isBirthdayTodayCheck(employee.dob)) {
      triggerConfetti(); 
    }
  };
  

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading birthdays...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-destructive">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error Loading Birthdays</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center">
            <CalendarDays className="h-7 w-7 mr-3 text-primary" /> Employee Birthdays
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a month to view employee birthdays or search by name.
          </p>
        </div>
        <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search employee by name..."
                value={searchQuery} // Use the immediate searchQuery for input value
                onChange={(e) => setSearchQuery(e.target.value)} // Update immediate searchQuery
                className="pl-8 w-full"
            />
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 md:p-6">
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-3 lg:col-span-3 flex flex-col">
              <div className="pb-3 border-b mb-3 flex-shrink-0">
                <h3 className="text-lg font-semibold flex items-center text-foreground">
                  <ListFilter className="h-5 w-5 mr-2 text-primary" />
                  Select Month
                </h3>
              </div>
              <ScrollArea className="h-[360px]">
                <div className="space-y-1 p-1">
                  {processedBirthdays.map((month) => (
                    <Button
                      key={month.monthIndex}
                      variant={selectedMonthIndex === month.monthIndex ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start text-sm h-10 px-3",
                        selectedMonthIndex === month.monthIndex 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "text-foreground hover:bg-muted"
                      )}
                      onClick={() => {
                        setSelectedMonthIndex(month.monthIndex);
                        setSearchQuery(''); // Clear search query when a month is manually selected
                        setDebouncedSearchQuery(''); // Also clear debounced search query
                        setHighlightedEmployeeId(null);
                      }}
                    >
                      <Cake
                         className={cn(
                          "h-4 w-4 mr-3",
                          selectedMonthIndex === month.monthIndex 
                            ? "text-primary-foreground/90" 
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="flex-grow">{month.monthName}</span>
                      {month.birthdays.length > 0 && (
                        <Badge 
                          variant={selectedMonthIndex === month.monthIndex ? "secondary" : "outline"}
                          className={cn(
                            "h-5 px-2 text-xs",
                            selectedMonthIndex === month.monthIndex ? "bg-primary-foreground/20 text-primary-foreground" : "border-border text-muted-foreground"
                          )}
                        >
                          {month.birthdays.length}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="md:col-span-9 lg:col-span-9 md:border-l md:pl-6">
              <div className="bg-muted/30 py-3 px-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold flex items-center text-foreground">
                  <Cake className="h-5 w-5 mr-2 text-primary" />
                  Birthdays in {selectedMonthName || (debouncedSearchQuery && !highlightedEmployeeId ? 'All Months (No Match)' : '')}
                </h3>
              </div>
              <div>
                {birthdaysForSelectedMonth.length === 0 && selectedMonthIndex !== null && !debouncedSearchQuery ? ( 
                   <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Cake className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground">No Birthdays in {selectedMonthName}</h3>
                    <p className="text-sm">There are no employee birthdays scheduled for this month.</p>
                  </div>
                ) : birthdaysForSelectedMonth.length === 0 && debouncedSearchQuery && !highlightedEmployeeId ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground">No Employee Found</h3>
                        <p className="text-sm">No employee matched your search query: "{debouncedSearchQuery}".</p>
                    </div>
                ) : (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {birthdaysForSelectedMonth.map((emp, index) => {
                      const empIsBirthdayToday = isBirthdayTodayCheck(emp.dob);
                      return (
                      <li 
                        key={emp._id} 
                        className={cn(
                            "flex items-center p-3 bg-background hover:bg-muted/50 rounded-lg border border-border transition-colors shadow-sm cursor-pointer",
                            emp._id === highlightedEmployeeId && "ring-2 ring-primary ring-offset-2 shadow-md",
                            empIsBirthdayToday && "border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100/70 dark:hover:bg-yellow-800/50"
                        )}
                        onClick={() => handleEmployeeCardClick(emp)}
                      >
                        <Badge 
                          variant="secondary" 
                          className="mr-3 h-7 w-7 flex items-center justify-center text-sm font-semibold bg-muted text-muted-foreground"
                        >
                          {index + 1}
                        </Badge>
                        <Avatar className="h-10 w-10 mr-3 border">
                          <AvatarFallback className="bg-muted">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <p className="font-medium text-foreground flex items-center">
                            {emp.name.toUpperCase()}
                            {empIsBirthdayToday && <PartyPopper className="h-4 w-4 ml-2 text-yellow-500" />}
                          </p>
                          <div className="flex items-center">
                            <p className="text-xs text-muted-foreground">
                                {emp.dob ? format(parseISO(emp.dob), 'MMMM do') : 'N/A'}
                            </p>
                            {empIsBirthdayToday && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600 px-1.5 py-0.5 text-xs">
                                Today
                                </Badge>
                            )}
                          </div>
                        </div>
                        {empIsBirthdayToday && (
                            <Popover 
                                open={showWishPopoverFor === emp._id} 
                                onOpenChange={(open: any) => {
                                    if(!open) {
                                        setShowWishPopoverFor(null);
                                        setGeneratedWish(null); 
                                    }
                                }}
                            >
                            <PopoverTrigger asChild>
                                <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleGenerateWish(emp);
                                }}
                                disabled={isWishGeneratingFor === emp._id}
                                title="Generate Birthday Wish"
                                >
                                {isWishGeneratingFor === emp._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" side="top" align="end">
                                {generatedWish ? (
                                <div className="space-y-2">
                                    <p className="text-sm">{generatedWish}</p>
                                    <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => handleCopyWish(generatedWish)}
                                    >
                                    <Copy className="mr-2 h-3 w-3" /> Copy Wish
                                    </Button>
                                </div>
                                ) : (
                                <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                                )}
                            </PopoverContent>
                            </Popover>
                        )}
                      </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

