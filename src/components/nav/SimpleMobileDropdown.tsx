import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface MenuItem {
  to: string;
  label: string;
}

interface MobileDropdownProps {
  title: string;
  items: MenuItem[];
  className?: string;
}

export const SimpleMobileDropdown: React.FC<MobileDropdownProps> = ({ 
  title, 
  items, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground hover:bg-muted/50 transition-colors rounded-lg"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="mt-1 space-y-1 bg-muted/30 rounded-lg p-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-md transition-colors ${
                  isActive ? 'text-primary bg-primary/5' : ''
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};