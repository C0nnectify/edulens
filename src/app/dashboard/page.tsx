
'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import {
  FileText,
  Upload,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/signin?redirect=/dashboard');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  const stats = [
    {
      title: 'Documents Created',
      value: '3',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Applications Tracked',
      value: '5',
      icon: ClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Chat Sessions',
      value: '12',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Upload Progress',
      value: '75%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const quickActions = [
    {
      title: 'Upload Documents',
      description: 'Upload your academic documents for AI processing',
      icon: Upload,
      href: '/dashboard/document-ai',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Build Documents',
      description: 'Create AI-powered resumes, CVs, and SOPs',
      icon: FileText,
      href: '/dashboard/document-builder',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Track Applications',
      description: 'Monitor your university application status',
      icon: ClipboardList,
      href: '/dashboard/application-tracker',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Start Research',
      description: 'Chat with AI to research universities and programs',
      icon: MessageSquare,
      href: '/dashboard/chat',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  const recentActivity = [
    {
      title: 'Resume generated for MIT application',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      title: 'Application status updated for Stanford',
      time: '4 hours ago',
      icon: AlertCircle,
      color: 'text-blue-500',
    },
    {
      title: 'SOP created for Harvard Business School',
      time: '1 day ago',
      icon: FileText,
      color: 'text-purple-500',
    },
    {
      title: 'Chat session: Research on Canadian universities',
      time: '2 days ago',
      icon: MessageSquare,
      color: 'text-orange-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your study abroad journey with AI-powered tools
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
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
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Recommended actions to advance your applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Complete your profile</p>
                    <p className="text-xs text-gray-500">Add work experience and skills</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Generate CV for UK universities</p>
                    <p className="text-xs text-gray-500">Tailored for academic programs</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Research scholarship opportunities</p>
                    <p className="text-xs text-gray-500">Use AI chat to find funding options</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 