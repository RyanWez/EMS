
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Compass, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/60">
          <CardHeader className="text-center items-center pb-4">
            <div className="p-4 bg-destructive/10 rounded-full mb-4 border border-destructive/20">
                <Compass className="h-12 w-12 text-destructive" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-6xl font-bold text-destructive tracking-tighter">
              404
            </CardTitle>
            <CardDescription className="text-xl font-medium text-foreground pt-2">
              Page Not Found
            </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-base text-muted-foreground">
                Sorry, the page you are looking for could not be found. It might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="w-full sm:w-auto"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
                <Button 
                    asChild 
                    className="w-full sm:w-auto"
                >
                    <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
