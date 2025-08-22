
'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuroraTextProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  className?: string;
}

export const AuroraText = ({ children, className, ...props }: AuroraTextProps) => {
  return (
    // Using h1 to match the original dashboard page structure for the main title
    <h1
      className={cn(
        'text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight', // Base styles from original DashboardPage
        'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500', // Aurora-like gradient
        'bg-clip-text text-transparent',
        'animate-gradient-move bg-[length:200%_200%]', // Shared animation
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
};
