'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling down 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 md:hidden">
      <button
        onClick={() => {
          document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="group bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] text-white px-6 py-3 rounded-full font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 animate-bounce-gentle"
        aria-label="Join Waitlist"
      >
        <span>Join Waitlist</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>

      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default FloatingCTA;
