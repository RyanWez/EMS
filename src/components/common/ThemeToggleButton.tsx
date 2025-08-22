
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ThemeToggleButton({ buttonClassName }: { buttonClassName?: string }) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className={cn("h-11 w-11 opacity-0", buttonClassName)} disabled />;
  }

  const currentIcon =
    resolvedTheme === 'dark' ? <Moon className="h-[1.4rem] w-[1.4rem]" /> :
    <Sun className="h-[1.4rem] w-[1.4rem]" />;
  
  const getMenuItemClass = (itemTheme: string) => cn(
    "hover:bg-muted cursor-pointer flex items-center gap-2",
    theme === itemTheme && "bg-muted font-semibold"
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-11 w-11 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-offset-background", // Default neutral classes
            buttonClassName // Allow overriding/extending
          )}
        >
          {currentIcon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card text-card-foreground border shadow-md rounded-md">
        <DropdownMenuItem onClick={() => setTheme('light')} className={getMenuItemClass('light')}>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className={getMenuItemClass('dark')}>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
