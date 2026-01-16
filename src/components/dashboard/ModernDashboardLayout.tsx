'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Upload,
  ClipboardList,
  MessageSquare,
  LogOut,
  GraduationCap,
  Settings,
  Home,
  Monitor,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// Sidebar context for managing state
interface SidebarContextType {
  isOpen: boolean;
  isMobile: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setIsOpen: (open: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Document Vault', href: '/dashboard/document-vault', icon: Upload },
  { name: 'Document Builder', href: '/dashboard/document-builder', icon: FileText },
  { name: 'Application Tracker', href: '/dashboard/application-tracker', icon: ClipboardList },
  { name: 'Monitoring Agent', href: '/dashboard/monitoring-agent', icon: Monitor },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
];

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
}

// Custom hook for detecting mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Sidebar content component
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, isMobile } = useSidebar();
  
  const showLabels = !isCollapsed || isMobile;

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-gray-200/60 h-16",
        showLabels ? "px-5" : "px-3 justify-center"
      )}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
          </div>
          {showLabels && (
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              EduLens
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-4 space-y-1", showLabels ? "px-3" : "px-2")}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const NavItem = (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl font-medium transition-all duration-200",
                showLabels ? "px-3 py-2.5 text-sm" : "p-3 justify-center",
                isActive
                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className={cn(
                "relative flex-shrink-0",
                isActive && "before:absolute before:inset-0 before:bg-indigo-500/20 before:rounded-lg before:blur-sm"
              )}>
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors relative",
                    isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
              </div>
              {showLabels && (
                <span className={cn(
                  isActive && "font-semibold"
                )}>{item.name}</span>
              )}
              {isActive && showLabels && (
                <div className="ml-auto h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </Link>
          );

          if (!showLabels) {
            return (
              <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return NavItem;
        })}
      </nav>

      {/* AI Assistant Badge */}
      {showLabels && (
        <div className="px-3 pb-3">
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-3 border border-indigo-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700">AI-Powered</span>
            </div>
            <p className="text-xs text-gray-600">Get smart recommendations for your study abroad journey</p>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className={cn("border-t border-gray-200/60 py-3", showLabels ? "px-3" : "px-2")}>
        {showLabels ? (
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <Settings className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            Settings
          </Link>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                onClick={onNavigate}
                className="flex items-center justify-center p-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Settings
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* User Info */}
      <div className={cn("border-t border-gray-200/60 p-3", !showLabels && "px-2")}>
        <div className={cn(
          "flex items-center",
          showLabels ? "gap-3" : "flex-col gap-2"
        )}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-sm opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white">
              <span className="text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          {showLabels && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
          {showLabels ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="flex-shrink-0 h-9 w-9 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-9 w-9 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Log Out
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

// Desktop Sidebar
function DesktopSidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <aside className={cn(
      "hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/60 transition-all duration-300 ease-in-out relative group",
      isCollapsed ? "w-[72px]" : "w-[260px]"
    )}>
      <SidebarContent />
      
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute -right-3 top-20 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
        )}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}

// Mobile Sidebar (Sheet)
function MobileSidebar() {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="w-[280px] p-0 bg-white/95 backdrop-blur-xl">
        <SidebarContent onNavigate={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Mobile Header
function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">EduLens</span>
        </div>

        <div className="w-9" /> {/* Spacer for centering */}
      </div>
    </header>
  );
}

export default function ModernDashboardLayout({ children }: ModernDashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  // Keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        if (isMobile) {
          setIsOpen(!isOpen);
        } else {
          setIsCollapsed(!isCollapsed);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isOpen, isCollapsed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse" />
            <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
              <GraduationCap className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const contextValue: SidebarContextType = {
    isOpen,
    isMobile,
    isCollapsed,
    toggleSidebar: () => isMobile ? setIsOpen(!isOpen) : setIsCollapsed(!isCollapsed),
    setIsOpen,
    setIsCollapsed,
  };

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarContext.Provider value={contextValue}>
        <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <DesktopSidebar />
          <MobileSidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <MobileHeader />
            <main className="flex-1 overflow-auto">
              <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </TooltipProvider>
  );
}
