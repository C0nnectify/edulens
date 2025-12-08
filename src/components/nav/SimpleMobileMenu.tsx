import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleMobileMenuProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  openSignin: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleMobileMenu: React.FC<SimpleMobileMenuProps> = ({
  isLoggedIn,
  onLogout,
  openSignin,
  isOpen,
  onClose
}) => {
  const menuItems = [
    { to: '/about', label: 'About' }
  ];

  const handleAIAgentClick = () => {
    const section = document.getElementById('ai-agent-marketplace');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      {/* Semi-transparent overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Menu panel sliding from left - Full screen width */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-full bg-white dark:bg-gray-900 shadow-xl overflow-y-auto",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-white dark:bg-gray-900 sticky top-0 z-[70]">
          <div className="text-xl sm:text-2xl font-bold">
            <span className="text-primary">Edu</span>
            <span className="text-blue-900 dark:text-blue-400">Lens</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-10 w-10 sm:h-12 sm:w-12 hover:bg-muted touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </Button>
        </div>

        {/* Navigation menu with improved spacing */}
        <div className="flex flex-col min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-96px)]">
          <nav className="flex-1 py-6 sm:py-8">
            <div className="space-y-1 px-4 sm:px-6">
              {/* Study Abroad button */}
              <NavLink
                to="/"
                className="block px-4 sm:px-6 py-5 sm:py-6 text-xl sm:text-2xl font-medium rounded-xl transition-all duration-200 hover:bg-primary/5 hover:text-primary touch-manipulation text-foreground border-b border-border/20"
                onClick={onClose}
              >
                Study Abroad
              </NavLink>
              
              {/* AI Agent button */}
              <button
                onClick={handleAIAgentClick}
                className="block w-full text-left px-4 sm:px-6 py-5 sm:py-6 text-xl sm:text-2xl font-medium rounded-xl transition-all duration-200 hover:bg-primary/5 hover:text-primary touch-manipulation text-foreground border-b border-border/20"
              >
                AI Agent
              </button>

              {/* Other menu items */}
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "block px-4 sm:px-6 py-5 sm:py-6 text-xl sm:text-2xl font-medium rounded-xl transition-all duration-200",
                      "hover:bg-primary/5 hover:text-primary touch-manipulation border-b border-border/20",
                      isActive 
                        ? "bg-primary/10 text-primary border-l-4 border-primary" 
                        : "text-foreground"
                    )
                  }
                  onClick={onClose}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Bottom section with auth button - Always visible */}
          <div className="border-t border-border p-4 sm:p-6 bg-white dark:bg-gray-900 sticky bottom-0">
            {!isLoggedIn ? (
              <Button
                onClick={() => {
                  openSignin();
                  onClose();
                }}
                className="w-full h-14 sm:h-16 text-xl sm:text-2xl font-medium touch-manipulation"
                size="lg"
              >
                Sign Up
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                variant="destructive"
                className="w-full h-14 sm:h-16 text-xl sm:text-2xl font-medium touch-manipulation"
                size="lg"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};