'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
  Shield,
  UserCog,
  Database,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Stats {
  collections: Record<string, number>;
  usersByRole: Record<string, number>;
  overview: {
    totalUsers: number;
    recentSignups: number;
    activeSessions: number;
    usersWithProfiles: number;
    usersWithSmartProfiles: number;
    totalDocuments: number;
  };
}

export default function AdminDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch real stats from API
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/signin?redirect=/admin');
    } else if (session?.user) {
      // Check if user has admin role
      const userRole = (session.user as any).role;
      if (userRole !== 'admin') {
        router.push('/dashboard');
      } else {
        setIsAuthorized(true);
        fetchStats();
      }
    }
  }, [session, isPending, router, fetchStats]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || !isAuthorized) {
    return null;
  }

  // Dynamic stats from API
  const displayStats = [
    {
      title: 'Total Users',
      value: stats?.overview.totalUsers.toLocaleString() || '-',
      change: `+${stats?.overview.recentSignups || 0} this week`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Documents',
      value: stats?.overview.totalDocuments.toLocaleString() || '-',
      change: 'All user docs',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Sessions',
      value: stats?.overview.activeSessions.toLocaleString() || '-',
      change: 'Currently active',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Users with Profiles',
      value: stats?.overview.usersWithProfiles.toLocaleString() || '-',
      change: `${stats?.overview.usersWithSmartProfiles || 0} with SmartProfile`,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: UserCog,
      href: '/admin/users',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Content Management',
      description: 'Manage website content and resources',
      icon: FileText,
      href: '/admin/content',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and insights',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'System Settings',
      description: 'Configure system settings and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {session.user.name}</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to User Dashboard</Button>
            </Link>
            <Button
              variant="ghost"
              onClick={fetchStats}
              disabled={isLoadingStats}
              className="ml-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayStats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {isLoadingStats ? (
                            <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                          ) : (
                            stat.value
                          )}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                      <Link href={action.href}>
                        <Button className="w-full">Manage</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New user registered</p>
                      <p className="text-xs text-gray-500">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Content updated: Homepage</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">System settings modified</p>
                      <p className="text-xs text-gray-500">3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Database backup completed</p>
                      <p className="text-xs text-gray-500">6 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current system status and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Database</span>
                      <span className="text-sm text-green-600 font-semibold">Healthy</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">API Response Time</span>
                      <span className="text-sm text-green-600 font-semibold">45ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Server Load</span>
                      <span className="text-sm text-yellow-600 font-semibold">Medium</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Storage Usage</span>
                      <span className="text-sm text-blue-600 font-semibold">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
