import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Menu, X, Home, Zap, Users, Calendar, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  to: string;
  label: string;
  icon?: React.ElementType;
}

interface DropdownSection {
  title: string;
  items: MenuItem[];
  icon: React.ElementType;
}

interface ModernMobileMenuProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  openSignin: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ModernMobileMenu: React.FC<ModernMobileMenuProps> = ({
  isLoggedIn,
  onLogout,
  openSignin,
  isOpen,
  onClose
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections: DropdownSection[] = [
    {
      title: 'Study Abroad',
      icon: Home,
      items: [
        { to: '/undergraduate-postgraduate', label: 'Undergraduate & Postgraduate' },
        { to: '/phd-doctoral', label: 'PhD & Doctoral Programs' },
        { to: '/summer-camps', label: 'Summer Camps' },
        { to: '/virtual-tours', label: 'Virtual Tours' },
        { to: '/university-reviews', label: 'University Reviews' },
      ]
    },
    {
      title: 'Tools',
      icon: Zap,
      items: [
        { to: '/ai-agents', label: 'AI Agents' },
        { to: '/resume-builder', label: 'Resume Builder' },
        { to: '/sop-library', label: 'SOP Library' },
        { to: '/resume-library', label: 'Resume Library' },
        { to: '/gmail-library', label: 'Gmail Library' },
        { to: '/gre-ielts-resources', label: 'GRE & IELTS Resources' },
      ]
    },
    {
      title: 'Community',
      icon: Users,
      items: [
        { to: '/forum', label: 'Forum' },
        { to: '/scholarships', label: 'Scholarships' },
        { to: '/resources', label: 'Resource Library' },
      ]
    }
  ];

  const singleItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/marketplace', label: 'Marketplace', icon: Globe }
  ];

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Menu Panel */}
      <div className="fixed top-0 left-0 h-full w-80 bg-background border-r border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="text-2xl font-bold">
            <span className="text-primary">Edu</span>
            <span className="text-secondary bg-secondary/10 px-1 rounded">Lens</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className="space-y-2 px-6">
            {/* Single Items */}
            {singleItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl text-foreground hover:bg-primary/5 hover:text-primary transition-all duration-200",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )
                  }
                  onClick={onClose}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {/* Collapsible Sections */}
            {sections.map((section) => {
              const IconComponent = section.icon;
              const isExpanded = expandedSection === section.title;
              
              return (
                <div key={section.title} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{section.title}</span>
                    </div>
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="space-y-1 pl-8 pr-4">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              "block px-4 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors",
                              isActive && "text-primary bg-primary/5 font-medium"
                            )
                          }
                          onClick={onClose}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6">
          <div className="space-y-3">
            {!isLoggedIn ? (
              <Button
                onClick={() => {
                  openSignin();
                  onClose();
                }}
                className="w-full"
              >
                Sign In
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                variant="destructive"
                className="w-full"
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