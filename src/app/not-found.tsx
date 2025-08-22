
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background shapes */}
      <div
        className="absolute w-[300px] h-[300px] bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full filter blur-2xl opacity-50 animate-move-shape1 top-[10%] left-[10%] z-[-1]"
        style={{ filter: 'blur(80px)' }}
      />
      <div
        className="absolute w-[400px] h-[400px] bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full filter blur-2xl opacity-50 animate-move-shape2 bottom-[5%] right-[5%] z-[-1]"
        style={{ filter: 'blur(80px)' }}
      />

      <div className="text-center space-y-6 relative z-10">
        <h1 className="text-8xl md:text-9xl font-bold text-red-500 animate-bounce-in drop-shadow-custom-text">
          404
        </h1>
        <p className="text-3xl md:text-4xl font-semibold text-slate-800">
          စာမျက်နှာ ရှာမတွေ့ပါ
        </p>
        <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto">
          တောင်းဆိုထားသော စာမျက်နှာကို ကျွန်ုပ်တို့၏ ဆာဗာတွင် ရှာမတွေ့ပါ။ လိပ်စာမှန်ကန်ကြောင်း သေချာပါစေ သို့မဟုတ် အောက်ပါခလုတ်ကို နှိပ်၍ ပင်မစာမျက်နှာသို့ ပြန်သွားပါ။
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="py-3 px-6 text-base border-slate-400 hover:bg-slate-200 text-slate-700 w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
            <Button 
              asChild 
              className="py-3 px-6 text-base bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold shadow-md transition-transform duration-200 hover:translate-y-[-2px] active:translate-y-0 active:shadow-none w-full sm:w-auto"
            >
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
