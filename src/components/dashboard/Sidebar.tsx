'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Document AI',
    href: '/dashboard/document-ai',
    icon: Upload,
  },
  {
    name: 'Document Builder',
    href: '/dashboard/document-builder',
    icon: FileText,
  },
  {
    name: 'Application Tracker',
    href: '/dashboard/application-tracker',
    icon: ClipboardList,
  },
  {
    name: 'Monitoring Agent',
    href: '/dashboard/monitoring-agent',
    icon: Monitor,
  },
  {
    name: 'Chat',
    href: '/dashboard/chat',
    icon: MessageSquare,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <GraduationCap className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-bold text-gray-900">EduLens</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 h-5 w-5 flex-shrink-0'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-gray-200 p-3">
        <Link
          href="/dashboard/settings"
          className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
          Settings
        </Link>
      </div>

      {/* User Info with Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="ml-2 flex-shrink-0 h-9 w-9 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}