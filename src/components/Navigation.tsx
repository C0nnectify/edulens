'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Menu, X, Rocket } from "lucide-react";
import { useWaitlist } from "@/contexts/WaitlistContext";

const Navigation = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openWaitlistModal } = useWaitlist();

  // For demo, let's pretend user is not logged in
  const isLoggedIn = false;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleAIAgentClick = () => {
    const section = document.getElementById('ai-agent-marketplace');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#ai-agent-marketplace');
    }
    setIsMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  const handleAboutClick = () => {
    router.push('/about');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b z-50 transition-all duration-300 ${
        scrolled ? 'border-gray-200 shadow-md py-2' : 'border-transparent shadow-sm py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop and Mobile Layout */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-xl sm:text-2xl font-bold touch-manipulation">
              <span className="text-blue-600">Edu</span>
              <span className="text-purple-600">Lens</span>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base touch-manipulation"
            >
              Home
            </Link>
            <button 
              onClick={handleAIAgentClick}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base touch-manipulation"
            >
              AI Agent
            </button>
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base touch-manipulation"
            >
              About
            </Link>
          </div>

          {/* Desktop Auth Button and Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Waitlist Button */}
            <Button 
              onClick={() => openWaitlistModal('navigation')}
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 lg:px-6 rounded-lg text-sm lg:text-base shadow-lg hover:shadow-xl transition-all active:scale-95 touch-manipulation"
            >
              <Rocket className="w-4 h-4" />
              <span className="hidden lg:inline">Join Waitlist</span>
              <span className="lg:hidden">Join</span>
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 touch-manipulation active:scale-95"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with slide animation */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="md:hidden fixed top-[72px] left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto animate-slide-up">
              <div className="flex flex-col h-full">
                <div className="flex-1 px-4 py-6 space-y-1">
                  <button
                    onClick={handleHomeClick}
                    className="w-full text-left px-4 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium rounded-lg transition-colors touch-manipulation active:scale-98"
                  >
                    Home
                  </button>
                  <button
                    onClick={handleAIAgentClick}
                    className="w-full text-left px-4 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium rounded-lg transition-colors touch-manipulation active:scale-98"
                  >
                    AI Agent
                  </button>
                  <button
                    onClick={handleAboutClick}
                    className="w-full text-left px-4 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium rounded-lg transition-colors touch-manipulation active:scale-98"
                  >
                    About
                  </button>
                </div>
                
                {/* Bottom CTA - Fixed at bottom for mobile app feel */}
                <div className="p-4 border-t border-gray-200 bg-gradient-to-t from-gray-50 to-white">
                  <Button 
                    onClick={() => {
                      openWaitlistModal('mobile-navigation');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 touch-manipulation text-base"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Join Waitlist
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
