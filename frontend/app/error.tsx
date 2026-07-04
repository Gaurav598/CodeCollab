'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0f111a] relative overflow-hidden text-center group">
      {/* Animated Background Blobs */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-red-600/20 rounded-full blur-[80px] -translate-y-1/2 animate-[pulse_6s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-rose-600/20 rounded-full blur-[70px] animate-[pulse_5s_cubic-bezier(0.4,0,0.6,1)_infinite]" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[60px] animate-[ping_8s_cubic-bezier(0,0,0.2,1)_infinite]"></div>

      <div className="z-10 flex flex-col items-center max-w-md mx-auto p-10 bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] transform transition-transform duration-700 hover:scale-[1.02]">
        {/* Floating 3D Icon */}
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500/30 via-red-500/10 to-transparent flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(239,68,68,0.3)] border border-red-500/30 backdrop-blur-md animate-[bounce_3s_ease-in-out_infinite] transform-gpu preserve-3d group-hover:rotate-y-12 transition-transform">
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-2xl"></div>
           <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500 drop-shadow-[0_2px_15px_rgba(239,68,68,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
        </div>
        
        <h2 className="text-3xl font-black tracking-tight mb-3 text-white drop-shadow-md">
          Something went wrong
        </h2>
        <div className="bg-background/40 backdrop-blur-md px-5 py-3 rounded-xl border border-white/5 shadow-inner mb-8">
          <p className="text-gray-300 text-sm font-medium leading-relaxed">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>

        <div className="flex gap-4 w-full">
            <button
            onClick={() => reset()}
            className="flex-1 group/btn relative py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-[0_5px_20px_rgba(var(--primary),0.4)] hover:shadow-[0_8px_25px_rgba(var(--primary),0.6)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out rounded-xl"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover/btn:-rotate-180 duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Try again
            </span>
            </button>
            <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 group/btn relative py-3 bg-muted text-foreground font-bold rounded-xl shadow-sm hover:bg-muted/80 hover:-translate-y-1 border border-border transition-all duration-300 overflow-hidden"
            >
            <span className="relative z-10 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Dashboard
            </span>
            </button>
        </div>
      </div>
    </div>
  );
}
