'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardList,
  Plus,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Mail,
  Bell,
  Activity,
  BarChart3,
  Target,
} from 'lucide-react';
import { DeadlineCountdown } from '@/components/shared/DeadlineCountdown';
import { formatInUserTimezone } from '@/lib/utils/timezone';

interface DashboardData {
  overview: {
    totalApplications: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    completionRate: number;
  };
  upcomingDeadlines: Array<{
    id: string;
    applicationId: string;
    universityName: string;
    programName: string;
    type: string;
    stage: string;
    date: string;
    countdown: {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
      isExpired: boolean;
      urgencyLevel: string;
      displayText: string;
    };
    urgencyLevel: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    applicationId?: string;
    universityName?: string;
  }>;
  applications: Array<{
    id: string;
    universityName: string;
    programName: string;
    status: string;
    priority: string;
    deadline: string;
    completionPercentage: number;
  }>;
  statistics: {
    averageResponseTime: number;
    successRate: number;
    totalFeesSpent: number;
    applicationsWithInterviews: number;
  };
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications/dashboard');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'interview_scheduled':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'waitlisted':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_update':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'deadline_added':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'document_uploaded':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'email_received':
        return <Mail className="h-4 w-4 text-orange-600" />;
      case 'reminder_sent':
        return <Bell className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">No dashboard data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back! Here's an overview of your application progress.
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.overview.totalApplications}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {data.overview.completionRate}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <Progress value={data.overview.completionRate} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {data.statistics.successRate}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Fees</p>
                  <p className="text-3xl font-bold text-orange-600">
                    ${data.statistics.totalFeesSpent}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Application Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.overview.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <p className="text-sm text-gray-600 capitalize">
                        {status.replace('_', ' ')}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  Upcoming Deadlines
                </CardTitle>
                <Badge variant="outline" className="text-red-600 border-red-300">
                  {data.upcomingDeadlines.length} Active
                </Badge>
              </div>
              <CardDescription>Deadlines requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {data.upcomingDeadlines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming deadlines</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingDeadlines.slice(0, 5).map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">
                            {deadline.universityName}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {deadline.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{deadline.programName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatInUserTimezone(deadline.date, 'PPp')}
                        </p>
                      </div>
                      <DeadlineCountdown
                        deadline={deadline.date}
                        showBadge
                        showIcon
                        compact
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.slice(0, 6).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50 rounded"
                    >
                      <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {activity.description}
                        </p>
                        {activity.universityName && (
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.universityName}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatInUserTimezone(activity.timestamp, 'PPp')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Applications Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Applications</CardTitle>
                <CardDescription>
                  Track progress and status of all applications
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.applications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No applications yet</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Application
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.applications.slice(0, 6).map((app) => (
                  <Card key={app.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {app.universityName}
                          </h3>
                          <p className="text-sm text-gray-600">{app.programName}</p>
                        </div>
                        <Badge className={getPriorityColor(app.priority)}>
                          {app.priority}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline" className={getStatusColor(app.status)}>
                            {app.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Deadline:</span>
                          <span className="font-medium text-gray-900">
                            {formatInUserTimezone(app.deadline, 'PP')}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Completion:</span>
                            <span className="font-medium text-gray-900">
                              {app.completionPercentage}%
                            </span>
                          </div>
                          <Progress value={app.completionPercentage} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.statistics.averageResponseTime} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interviews Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.statistics.applicationsWithInterviews}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.overview.byStatus.accepted || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
