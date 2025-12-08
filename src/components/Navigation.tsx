'use client';

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Menu, X, Rocket } from "lucide-react";
import { useWaitlist } from "@/contexts/WaitlistContext";

const Navigation = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openWaitlistModal } = useWaitlist();

  // For demo, let's pretend user is not logged in
  const isLoggedIn = false;

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
    <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Desktop and Mobile Layout */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-xl sm:text-2xl font-bold">
              <span className="text-blue-600">Edu</span>
              <span className="text-purple-600">Lens</span>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden sm:flex items-center space-x-4 lg:space-x-6">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base"
            >
              Home
            </Link>
            <button 
              onClick={handleAIAgentClick}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base"
            >
              AI Agent
            </button>
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base"
            >
              About
            </Link>
          </div>

          {/* Desktop Auth Button and Mobile Menu */}
          <div className="flex items-center space-x-2">
            {/* Desktop Waitlist Button */}
            <Button 
              onClick={() => openWaitlistModal('navigation')}
              className="hidden sm:block md:flex gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 lg:px-6 lg:py-2 rounded-lg text-sm lg:text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Join Waitlist
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
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

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden fixed top-[72px] left-0 w-full bg-white/90 border-b border-gray-200 shadow-lg z-[60] backdrop-blur-sm">
            <div className="py-2 max-w-7xl mx-auto">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleHomeClick}
                  className="text-left px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={handleAIAgentClick}
                  className="text-left px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  AI Agent
                </button>
                <button
                  onClick={handleAboutClick}
                  className="text-left px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  About
                </button>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Button 
                    onClick={() => openWaitlistModal('mobile-navigation')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Join Waitlist
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
