'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Brain,
  Building2,
  GraduationCap,
  Users,
  DollarSign,
  Home,
  Globe,
  Briefcase,
  MapPin,
  Calendar,
  TrendingUp,
  FileText,
  Mail,
  Linkedin,
  BookOpen,
  FlaskConical,
  Award,
  User,
} from 'lucide-react';
import { Application } from '@/types/application';
import { ApplicationService, ApplicationUtils } from '@/lib/api/applications';
import { OverviewTab, ProfessorsTab } from '@/components/application-detail';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadApplication();
  }, [params.id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      const data = await ApplicationService.getApplication(id);
      setApplication(data);
    } catch (error) {
      console.error('Error loading application:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading application details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
            <p className="text-gray-600 mb-4">The application you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/application-tracker')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = ApplicationUtils.getStatusConfig(status);
    return (
      <Badge className={`${config.color}`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/application-tracker')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {application.universityName}
                </h1>
                <p className="text-lg text-gray-600 mb-3">{application.programName}</p>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(application.status)}
                  <Badge variant="outline">{application.degreeLevel}</Badge>
                  <Badge variant="outline" className={ApplicationUtils.getPriorityConfig(application.priority || 'medium').color}>
                    {application.priority?.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Deadline</div>
                <div className="text-xl font-bold text-gray-900">
                  {ApplicationUtils.formatDate(application.deadline)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {ApplicationUtils.getDaysUntilDeadline(application.deadline)} days remaining
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="font-medium">
                    {application.submittedDate ? ApplicationUtils.formatDate(application.submittedDate) : 'Not yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Application Fee</p>
                  <p className="font-medium">${application.applicationFee || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Documents</p>
                  <p className="font-medium">{application.documents?.length || 0} uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="font-medium">{ApplicationUtils.getStatusProgression(application.status)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="university" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>University</span>
            </TabsTrigger>
            <TabsTrigger value="professors" className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Professors</span>
            </TabsTrigger>
            <TabsTrigger value="alumni" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Alumni</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Financial</span>
            </TabsTrigger>
            <TabsTrigger value="accommodation" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Housing</span>
            </TabsTrigger>
            <TabsTrigger value="cultural" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Cultural</span>
            </TabsTrigger>
            <TabsTrigger value="career" className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              <span>Career</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - AI Insights */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab application={application} />
          </TabsContent>

          {/* University Tab */}
          <TabsContent value="university" className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">University information coming soon</p>
            </div>
          </TabsContent>

          {/* Professors Tab */}
          <TabsContent value="professors" className="space-y-6">
            <ProfessorsTab application={application} />
          </TabsContent>

          {/* Alumni Tab */}
          <TabsContent value="alumni" className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Alumni network coming soon</p>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Financial analysis coming soon</p>
            </div>
          </TabsContent>

          {/* Accommodation Tab */}
          <TabsContent value="accommodation" className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <Home className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Accommodation info coming soon</p>
            </div>
          </TabsContent>

          {/* Cultural Tab */}
          <TabsContent value="cultural" className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <Globe className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Cultural matching coming soon</p>
            </div>
          </TabsContent>

          {/* Career Tab */}
          <TabsContent value="career" className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Career outcomes coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
