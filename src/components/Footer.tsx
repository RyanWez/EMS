import type { SVGProps } from "react";
import Link from "next/link";

const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  );
  
  const TelegramIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>
    </svg>
  );

/**
 * Renders the footer for the website.
 * It includes copyright information and social media links.
 */
export function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} RyanWez. All rights reserved.
        </p>
        <div className="flex items-center space-x-4">
            <Link href="https://facebook.com/ryanwez0" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <FacebookIcon className="w-6 h-6" />
            </Link>
            <Link href="https://t.me/RyanWez" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <TelegramIcon className="w-6 h-6" />
            </Link>
        </div>
      </div>
    </footer>
  );
}
