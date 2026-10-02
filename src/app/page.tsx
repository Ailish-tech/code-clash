'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !videoRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      // Calculate how far we've scrolled down the page
      const maxScroll = scrollHeight - clientHeight;
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      
      setScrollProgress(progress);

      // Request animation frame for smooth video scrubbing
      requestAnimationFrame(() => {
        if (videoRef.current && videoRef.current.duration) {
          videoRef.current.currentTime = videoRef.current.duration * progress;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call to set state
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative bg-slate-950" style={{ height: '400vh' }}>
      
      {/* Fixed Background Video */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video 
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
          preload="auto"
          muted
          playsInline
        >
          <source src="/pirate_bg.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-slate-950/40 mix-blend-multiply" />
      </div>

      {/* Content Layer (Fixed on screen, opacity based on scroll) */}
      <div className="fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none z-10 font-serif">
        
        {/* Intro Text (Fades out as you scroll down) */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300"
          style={{ opacity: scrollProgress < 0.3 ? 1 - (scrollProgress * 3.33) : 0 }}
        >
          <h1 className="text-6xl md:text-8xl font-black mb-6 text-amber-500 drop-shadow-[0_0_20px_rgba(217,119,6,0.8)] uppercase text-center tracking-widest">
            Captain's Code
          </h1>
          <p className="text-2xl text-slate-300 max-w-2xl text-center mb-8 drop-shadow-md">
            Scroll to embark on the journey...
          </p>
          <div className="animate-bounce text-4xl text-amber-500 mt-10">
            👇
          </div>
        </div>

        {/* Login Options (Fades in at the end of the scroll) */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 pointer-events-auto"
          style={{ 
            opacity: scrollProgress > 0.85 ? 1 : 0,
            transform: scrollProgress > 0.85 ? 'translateY(0)' : 'translateY(50px)',
            pointerEvents: scrollProgress > 0.85 ? 'auto' : 'none'
          }}
        >
          <h2 className="text-5xl font-bold mb-12 text-amber-500 uppercase drop-shadow-[0_0_15px_rgba(217,119,6,0.8)]">
            Choose Yer Path
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8">
            <Link 
              href="/participant" 
              className="px-10 py-6 bg-slate-900 border-2 border-amber-700 hover:bg-slate-800 hover:border-amber-500 text-amber-500 font-bold text-2xl rounded-xl shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.6)] transition-all hover:scale-105 uppercase tracking-widest flex items-center gap-4"
            >
              <span>☠️</span> Participant Login
            </Link>
            
            <Link 
              href="/admin" 
              className="px-10 py-6 bg-amber-700 border-2 border-amber-900 hover:bg-amber-600 hover:border-amber-400 text-slate-950 font-black text-2xl rounded-xl shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.6)] transition-all hover:scale-105 uppercase tracking-widest flex items-center gap-4"
            >
              <span>👑</span> Admin Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
