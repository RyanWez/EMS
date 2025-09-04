'use client';

import { useEffect, useState, useMemo, useRef } from 'react'; // Added useRef
import { Users, UserPlus, AlertTriangle, Cake, CalendarCheck2, ChevronLeft, ChevronRight, Briefcase, Calendar, UserCheck, UserX, Building } from 'lucide-react'; // Added Calendar icon and new icons
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientEmployee } from '@/actions/employeeActions';
import { getMonth, getYear, parseISO, format, addMonths, startOfMonth, startOfYear, addYears } from 'date-fns'; // Added startOfYear, addYears
import {
  BarChart,
  Bar,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Rectangle,
  PieChart,
  Pie
} from 'recharts';
import { ChartContainer, type ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select components

// Add this CSS for the gradient animation
const gradientAnimationCss = `
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .animate-gradient {
    background-size: 200% auto;
    animation: gradient 3s linear infinite;
  }
`;

interface EmployeeApiResponse {
  employees: ClientEmployee[];
}

const countEmployeesWithSixMonthAnniversaryInMonth = (
  employees: ClientEmployee[],
  targetMonthDate: Date // Should be the start of the target month
): number => {
  let count = 0;
  const targetYear = getYear(targetMonthDate);
  const targetMonthIndex = getMonth(targetMonthDate);

  employees.forEach(emp => {
    if (!emp.joinDate) return;
    try {
      const joinDateObj = parseISO(emp.joinDate);
      
      for (let i = 1; i <= 120; i++) { 
        const anniversaryCandidate = addMonths(joinDateObj, i * 6);

        if (getYear(anniversaryCandidate) > targetYear + 1) { 
             if (getYear(anniversaryCandidate) > targetYear || getMonth(anniversaryCandidate) > targetMonthIndex) {
                break;
            }
        }
        
        if (getYear(anniversaryCandidate) === targetYear && getMonth(anniversaryCandidate) === targetMonthIndex) {
          count++;
          break; 
        }
      }
    } catch (e) {
      // console.warn(`[Dashboard] Could not parse joinDate for 6-month anniv. calc for emp ${emp._id}: ${emp.joinDate}`);
    }
  });
  return count;
};


const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
];

// Custom Number Ticker Component
interface AnimatedNumberProps {
  value: number | null;
  duration?: number; // Animation duration in milliseconds
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1000 }) => {
  const [currentValue, setCurrentValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false); // To ensure animation only plays once per mount

  useEffect(() => {
    if (value === null || hasAnimated.current) {
      return;
    }

    // Intersection Observer to start animation when component is in view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = 0;
          const end = value;
          let startTime: number | null = null;

          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;
            const animatedValue = Math.min(progress, 1) * (end || 0); // Ensure end is a number
            setCurrentValue(Math.floor(animatedValue));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCurrentValue(end); // Ensure final value is exact
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect(); // Disconnect after animation starts
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the component is visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [value, duration]);

  if (value === null) {
    return <div ref={ref}>N/A</div>;
  }

  return <div ref={ref}>{currentValue.toLocaleString()}</div>;
};


export default function DashboardPage() {
  const [allEmployees, setAllEmployees] = useState<ClientEmployee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [newEmployeesThisMonth, setNewEmployeesThisMonth] = useState<number | null>(null);
  const [birthdaysThisMonthCount, setBirthdaysThisMonthCount] = useState<number | null>(null);
  
  const [anniversaryDisplayMonth, setAnniversaryDisplayMonth] = useState(() => startOfMonth(new Date()));
  const [sixMonthAnniversaryStats, setSixMonthAnniversaryStats] = useState<{ currentDisplayMonthCount: number; nextDisplayMonthCount: number } | null>(null);

  // New states for New Hires Over Time chart
  const [newHiresViewType, setNewHiresViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [currentChartYear, setCurrentChartYear] = useState(getYear(new Date()));
  const [currentChartMonth, setCurrentChartMonth] = useState(getMonth(new Date())); // 0-indexed month

  // New states for additional dashboard features
  const [activeEmployees, setActiveEmployees] = useState<number | null>(null);
  const [inactiveEmployees, setInactiveEmployees] = useState<number | null>(null);
  const [genderDistribution, setGenderDistribution] = useState<{ male: number; female: number } | null>(null);

  // Data for Gender Distribution Pie Chart
  const genderChartData = useMemo(() => {
    if (!genderDistribution) return [];
    return [
      { name: 'Male', value: genderDistribution.male, fill: 'hsl(var(--chart-1))' },
      { name: 'Female', value: genderDistribution.female, fill: 'hsl(var(--chart-2))' }
    ].filter(item => item.value > 0);
  }, [genderDistribution]);

  const genderChartConfig = useMemo(() => ({
    male: {
      label: "Male",
      color: "hsl(var(--chart-1))",
    },
    female: {
      label: "Female",
      color: "hsl(var(--chart-2))",
    },
  }), []);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      setEmployeeError(null);
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch employee data.' }));
          throw new Error(errorData.message || `Server responded with ${response.status}`);
        }
        const data: EmployeeApiResponse = await response.json();
        setAllEmployees(data.employees || []);
      } catch (err) {
        console.error("Error fetching employee data:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching employee data.";
        setEmployeeError(errorMessage);
        setAllEmployees([]); 
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employeeError) {
        setTotalEmployees(null);
        setNewEmployeesThisMonth(null);
        setBirthdaysThisMonthCount(null);
        setSixMonthAnniversaryStats(null);
        return;
    }

    if (allEmployees.length > 0 || !isLoadingEmployees) { 
        setTotalEmployees(allEmployees.length);

        const currentDate = new Date();
        const currentActualMonth = getMonth(currentDate);
        const currentActualYear = getYear(currentDate);
        
        let newThisActualMonth = 0;
        let birthdaysInActualMonth = 0;

        allEmployees.forEach(emp => {
          if (emp.joinDate) {
            try {
              const joinDateObj = parseISO(emp.joinDate);
              if (getMonth(joinDateObj) === currentActualMonth && getYear(joinDateObj) === currentActualYear) {
                newThisActualMonth++;
              }
            } catch (e) { /* ignore parse error for this calc */ }
          }
          if (emp.dob) {
            try {
              const dobDateObj = parseISO(emp.dob);
              if (getMonth(dobDateObj) === currentActualMonth) {
                birthdaysInActualMonth++;
              }
            } catch (e) { /* ignore parse error for this calc */ }
          }
        });
        setNewEmployeesThisMonth(newThisActualMonth);
        setBirthdaysThisMonthCount(birthdaysInActualMonth);
    }
  }, [allEmployees, isLoadingEmployees, employeeError]);

  useEffect(() => {
    if (employeeError) {
        setSixMonthAnniversaryStats(null);
        return;
    }
    if (allEmployees.length > 0 || !isLoadingEmployees) {
      const currentRefMonth = startOfMonth(anniversaryDisplayMonth);
      const nextRefMonth = startOfMonth(addMonths(currentRefMonth, 1));

      const countCurrent = countEmployeesWithSixMonthAnniversaryInMonth(allEmployees, currentRefMonth);
      const countNext = countEmployeesWithSixMonthAnniversaryInMonth(allEmployees, nextRefMonth);

      setSixMonthAnniversaryStats({ currentDisplayMonthCount: countCurrent, nextDisplayMonthCount: countNext });
    }
  }, [allEmployees, anniversaryDisplayMonth, isLoadingEmployees, employeeError]);

  // Calculate additional metrics
  useEffect(() => {
    if (employeeError) {
        setActiveEmployees(null);
        setInactiveEmployees(null);
        setGenderDistribution(null);
        return;
    }

    if (allEmployees.length > 0 || !isLoadingEmployees) {
        // For now, assume all employees are active since there's no status field
        setActiveEmployees(allEmployees.length);
        setInactiveEmployees(0);

        // Calculate gender distribution
        let maleCount = 0;
        let femaleCount = 0;

        allEmployees.forEach(emp => {
          if (emp.gender === 'Male') {
            maleCount++;
          } else if (emp.gender === 'Female') {
            femaleCount++;
          }
        });

        setGenderDistribution({ male: maleCount, female: femaleCount });
    }
  }, [allEmployees, isLoadingEmployees, employeeError]);

  const handlePrevAnniversaryMonth = () => {
    setAnniversaryDisplayMonth(prev => startOfMonth(addMonths(prev, -1)));
  };
  const handleNextAnniversaryMonth = () => {
    setAnniversaryDisplayMonth(prev => startOfMonth(addMonths(prev, 1)));
  };

  const employeeCountByPosition = useMemo(() => {
    if (isLoadingEmployees || employeeError || allEmployees.length === 0) {
      return [];
    }
    const counts: { [key: string]: number } = {};
    allEmployees.forEach(emp => {
      // Ensure emp.position is a valid string before using it as a key
      const positionName = (emp.position && typeof emp.position === 'string' && emp.position.trim() !== '')
        ? emp.position
        : 'Unknown Position'; // Fallback for invalid positions
      counts[positionName] = (counts[positionName] || 0) + 1;
    });
    return Object.entries(counts).map(([position, count], index) => ({
      name: position, 
      value: count,
      fill: CHART_COLORS[index % CHART_COLORS.length], 
    }));
  }, [allEmployees, isLoadingEmployees, employeeError]);

  const positionChartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Number of Employees", // Label for the Y-axis
      },
      // Ensure 'Unknown Position' is always in config if it's a possible data point
      "Unknown Position": {
        label: "Unknown Position",
        color: "hsl(var(--muted-foreground))", // Default color for unknown positions
      }
    };
    employeeCountByPosition.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [employeeCountByPosition]);

  // Data for New Hires Over Time Chart
  const newHiresData = useMemo(() => {
    if (isLoadingEmployees || employeeError || allEmployees.length === 0) {
      return [];
    }

    if (newHiresViewType === 'monthly') {
      const monthlyHires: { [key: string]: number } = {};
      // Initialize all 12 months for the currentChartYear to 0
      for (let i = 0; i < 12; i++) {
        const monthName = format(new Date(currentChartYear, i, 1), 'MMM');
        monthlyHires[monthName] = 0;
      }

      allEmployees.forEach(emp => {
        if (emp.joinDate) {
          try {
            const joinDateObj = parseISO(emp.joinDate);
            if (getYear(joinDateObj) === currentChartYear) {
              const monthName = format(joinDateObj, 'MMM');
              monthlyHires[monthName] = (monthlyHires[monthName] || 0) + 1;
            }
          } catch (e) { /* ignore parse error */ }
        }
      });
      return Object.entries(monthlyHires).map(([month, hires], index) => ({
        name: month,
        hires: hires,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }));
    } else { // yearly view
      const yearlyHires: { [key: string]: number } = {};
      // Get a range of years, e.g., last 10 years
      const currentYear = getYear(new Date());
      for (let i = currentYear - 9; i <= currentYear; i++) {
        yearlyHires[i.toString()] = 0;
      }

      allEmployees.forEach(emp => {
        if (emp.joinDate) {
          try {
            const joinDateObj = parseISO(emp.joinDate);
            const year = getYear(joinDateObj).toString();
            if (yearlyHires.hasOwnProperty(year)) { // Only count if within our defined range
              yearlyHires[year] = (yearlyHires[year] || 0) + 1;
            }
          } catch (e) { /* ignore parse error */ }
        }
      });
      return Object.entries(yearlyHires).map(([year, hires], index) => ({
        name: year,
        hires: hires,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })).sort((a, b) => parseInt(a.name) - parseInt(b.name)); // Sort by year
    }
  }, [allEmployees, isLoadingEmployees, employeeError, newHiresViewType, currentChartYear]);

  const newHiresChartConfig = useMemo(() => {
    const config: ChartConfig = {
      hires: {
        label: "New Hires",
        color: "hsl(var(--primary))",
      },
    };
    newHiresData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [newHiresData]);

  const handlePrevChartPeriod = () => {
    if (newHiresViewType === 'monthly') {
      setCurrentChartYear(prevYear => prevYear - 1);
    } else { // yearly
      setCurrentChartYear(prevYear => prevYear - 1);
    }
  };

  const handleNextChartPeriod = () => {
    if (newHiresViewType === 'monthly') {
      setCurrentChartYear(prevYear => prevYear + 1);
    } else { // yearly
      setCurrentChartYear(prevYear => prevYear + 1);
    }
  };

  return (
    // Removed space-y-8 and adjusted padding for the entire dashboard to move up
    <div className="pt-4 pb-8 px-4 md:px-6 lg:px-8"> 
      {/* Inject the CSS for the gradient animation */}
      <style dangerouslySetInnerHTML={{ __html: gradientAnimationCss }} />

      {/* Removed mb-6 and mt-8 from the title div to reduce top spacing */}
      <div className="flex flex-col items-start justify-center text-left"> 
        {/* Added gradient and animation classes to h1 */}
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text animate-gradient"> 
          Dashboard
        </h1>
      </div>

      {/* Removed mt-8 from the grid for spacing after the title */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mt-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Users className="h-5 w-5 text-primary opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : employeeError ? (
              <div className="text-sm text-destructive flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 mr-2" /> Error
              </div>
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {/* Animated Number for Total Employees */}
                <AnimatedNumber value={totalEmployees} />
              </div>
            )}
            {employeeError && <p className="text-xs text-destructive mt-1 truncate" title={employeeError}>{employeeError}</p>}
            {!isLoadingEmployees && !employeeError && totalEmployees !== null && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Currently active in the system.
                    </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Employees This Month
            </CardTitle>
            <UserPlus className="h-5 w-5 text-green-500 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : employeeError ? (
              <div className="text-sm text-destructive flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 mr-2" /> Error
              </div>
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {/* Animated Number for New Employees This Month */}
                <AnimatedNumber value={newEmployeesThisMonth} />
              </div>
            )}
              {employeeError && <p className="text-xs text-destructive mt-1 truncate" title={employeeError}>{employeeError}</p>}
            {!isLoadingEmployees && !employeeError && newEmployeesThisMonth !== null && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Hired in {format(new Date(), 'MMMM')}.
                    </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Birthdays (This Month)
            </CardTitle>
            <Cake className="h-5 w-5 text-pink-500 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : employeeError ? (
              <div className="text-sm text-destructive flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 mr-2" /> Error
              </div>
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {/* Animated Number for Birthdays This Month */}
                <AnimatedNumber value={birthdaysThisMonthCount} />
              </div>
            )}
              {employeeError && <p className="text-xs text-destructive mt-1 truncate" title={employeeError}>{employeeError}</p>}
            {!isLoadingEmployees && !employeeError && birthdaysThisMonthCount !== null && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Employees celebrating birthdays this month.
                    </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              6-Month Service
            </CardTitle>
            <CalendarCheck2 className="h-5 w-5 text-teal-500 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <>
                <Skeleton className="h-6 w-28 mt-1 mb-2" />
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-5 w-24" />
              </>
            ) : employeeError ? (
              <div className="text-sm text-destructive flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 mr-2" /> Error
              </div>
            ) : sixMonthAnniversaryStats !== null ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <Button variant="ghost" size="icon" onClick={handlePrevAnniversaryMonth} className="h-7 w-7">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(anniversaryDisplayMonth, 'MMMM')}
                  </p>
                  <Button variant="ghost" size="icon" onClick={handleNextAnniversaryMonth} className="h-7 w-7">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {sixMonthAnniversaryStats.currentDisplayMonthCount}
                  <span className="text-xs font-normal text-muted-foreground"> in {format(anniversaryDisplayMonth, 'MMM')}</span>
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {sixMonthAnniversaryStats.nextDisplayMonthCount}
                  <span className="text-xs font-normal text-muted-foreground"> in {format(addMonths(anniversaryDisplayMonth, 1), 'MMM')}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Completions in displayed months.
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-foreground">N/A</div>
            )}
            {employeeError && <p className="text-xs text-destructive mt-1 truncate" title={employeeError}>{employeeError}</p>}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Employees
            </CardTitle>
            <UserCheck className="h-5 w-5 text-green-600 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : employeeError ? (
              <div className="text-sm text-destructive flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 mr-2" /> Error
              </div>
            ) : (
              <div className="text-2xl font-bold text-foreground">
                <AnimatedNumber value={activeEmployees} />
              </div>
            )}
            {employeeError && <p className="text-xs text-destructive mt-1 truncate" title={employeeError}>{employeeError}</p>}
            {!isLoadingEmployees && !employeeError && activeEmployees !== null && (
              <p className="text-xs text-muted-foreground pt-1">
                Currently active employees.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gender Distribution
            </CardTitle>
            <Building className="h-5 w-5 text-purple-500 opacity-80" />
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <div className="flex justify-center items-center h-16">
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            ) : employeeError ? (
              <div className="text-sm text-destructive flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 mr-2" /> Error
              </div>
            ) : genderDistribution ? (
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {genderDistribution.male}
                  </div>
                  <div className="text-xs text-muted-foreground">Male</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-pink-600">
                    {genderDistribution.female}
                  </div>
                  <div className="text-xs text-muted-foreground">Female</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center">No data</div>
            )}
            {employeeError && <p className="text-xs text-destructive mt-1 truncate" title={employeeError}>{employeeError}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {/* Adjusted mt-4 to the grid for spacing after the cards */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3 pt-4 mt-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-primary opacity-80" />
              Employee Count by Position
            </CardTitle>
            <CardDescription>Distribution of employees across different positions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <div className="flex justify-center items-center h-72">
                <Skeleton className="h-60 w-full rounded-md" />
              </div>
            ) : employeeError ? (
              <div className="text-sm text-destructive flex flex-col items-center justify-center h-72">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>Error loading position data.</p>
                <p className="text-xs truncate" title={employeeError}>{employeeError}</p>
              </div>
            ) : employeeCountByPosition.length > 0 ? (
              <ChartContainer config={positionChartConfig} className="aspect-square h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart accessibilityLayer data={employeeCountByPosition}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value: string) => {
                        const configEntry = positionChartConfig[value];
                        return String(configEntry?.label || value);
                      }}
                    />
                    <YAxis dataKey="value" tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                      dataKey="value"
                      strokeWidth={2}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationBegin={0}
                      activeBar={({ ...props }) => {
                        return (
                          <Rectangle
                            {...props}
                            fillOpacity={0.8}
                            stroke={props.payload.fill}
                            strokeDasharray={4}
                            strokeDashoffset={4}
                          />
                        )
                      }}
                    >
                      {employeeCountByPosition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    <Legend verticalAlign="bottom" height={40} iconSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-muted-foreground">
                No employee data available to display chart.
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Hires Over Time Chart Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500 opacity-80" />
              New Hires Over Time
            </CardTitle>
            <CardDescription>
              <div className="flex items-center space-x-2">
                <span>View by:</span>
                <Select value={newHiresViewType} onValueChange={(value: 'monthly' | 'yearly') => {
                  setNewHiresViewType(value);
                  // Reset year/month when switching view type
                  setCurrentChartYear(getYear(new Date()));
                  setCurrentChartMonth(getMonth(new Date()));
                }}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">လအလိုက်</SelectItem>
                    <SelectItem value="yearly">နှစ်အလိုက်</SelectItem>
                  </SelectContent>
                </Select>
                {newHiresViewType === 'monthly' && (
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={handlePrevChartPeriod} className="h-7 w-7">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                      {currentChartYear}
                    </span>
                    <Button variant="ghost" size="icon" onClick={handleNextChartPeriod} className="h-7 w-7">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                 {newHiresViewType === 'yearly' && (
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={handlePrevChartPeriod} className="h-7 w-7">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                      {currentChartYear}
                    </span>
                    <Button variant="ghost" size="icon" onClick={handleNextChartPeriod} className="h-7 w-7">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <div className="flex justify-center items-center h-72">
                <Skeleton className="h-60 w-full rounded-md" />
              </div>
            ) : employeeError ? (
              <div className="text-sm text-destructive flex flex-col items-center justify-center h-72">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>Error loading new hires data.</p>
                <p className="text-xs truncate" title={employeeError}>{employeeError}</p>
              </div>
            ) : newHiresData.length > 0 ? (
              <ChartContainer config={newHiresChartConfig} className="aspect-square h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart accessibilityLayer data={newHiresData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value: string) => {
                        const configEntry = newHiresChartConfig[value];
                        return String(configEntry?.label || value);
                      }}
                    />
                    <YAxis dataKey="hires" tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                      dataKey="hires"
                      strokeWidth={2}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationBegin={0}
                      activeBar={({ ...props }) => {
                        return (
                          <Rectangle
                            {...props}
                            fillOpacity={0.8}
                            stroke={props.payload.fill}
                            strokeDasharray={4}
                            strokeDashoffset={4}
                          />
                        )
                      }}
                    >
                      {newHiresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    <Legend verticalAlign="bottom" height={40} iconSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-muted-foreground">
                No new hires data available to display chart.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution Pie Chart */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Building className="h-5 w-5 mr-2 text-purple-500 opacity-80" />
              Gender Distribution
            </CardTitle>
            <CardDescription>Breakdown of employees by gender.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <div className="flex justify-center items-center h-72">
                <Skeleton className="h-60 w-60 rounded-full" />
              </div>
            ) : employeeError ? (
              <div className="text-sm text-destructive flex flex-col items-center justify-center h-72">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>Error loading gender data.</p>
                <p className="text-xs truncate" title={employeeError}>{employeeError}</p>
              </div>
            ) : genderChartData.length > 0 ? (
              <ChartContainer config={genderChartConfig} className="aspect-square h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      isAnimationActive={true}
                      animationDuration={800}
                    >
                      {genderChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={40} iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-muted-foreground">
                No gender data available to display chart.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
