'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Brain,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Application, ApplicationFilters } from '@/types/application';
import { ApplicationService, ApplicationUtils } from '@/lib/api/applications';
import { 
  AddApplicationModal, 
  EditApplicationModal, 
  AIInsightsModal 
} from '@/components/application-tracker';

export default function ApplicationTrackerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAIInsightsModalOpen, setIsAIInsightsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Load applications on component mount
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await ApplicationService.getApplications();
      setApplications(response.applications);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApplication = async (data: any): Promise<void> => {
    try {
      const newApplication = await ApplicationService.createApplication(data);
      setApplications(prev => [...(prev || []), newApplication]);
    } catch (error) {
      console.error('Error adding application:', error);
      // Re-throw to let the modal handle the error display
      throw error;
    }
  };

  const handleUpdateApplication = async (id: string, data: any): Promise<void> => {
    try {
      const updatedApplication = await ApplicationService.updateApplication(id, data);
      setApplications(prev => (prev || []).map(app => app.id === id ? updatedApplication : app));
    } catch (error) {
      console.error('Error updating application:', error);
      // Re-throw to let the modal handle the error display
      throw error;
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await ApplicationService.deleteApplication(id);
      setApplications(prev => (prev || []).filter(app => app.id !== id));
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const handleDuplicateApplication = async (id: string) => {
    try {
      const duplicatedApplication = await ApplicationService.duplicateApplication(id);
      setApplications(prev => [...(prev || []), duplicatedApplication]);
    } catch (error) {
      console.error('Error duplicating application:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = ApplicationUtils.getStatusConfig(status);
    const Icon = config.icon === 'Clock' ? Clock : 
                 config.icon === 'AlertCircle' ? AlertCircle :
                 config.icon === 'Calendar' ? Calendar :
                 config.icon === 'CheckCircle' ? CheckCircle :
                 config.icon === 'XCircle' ? XCircle : Clock;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getStatusStats = () => {
    if (!applications || applications.length === 0) {
      return [
        { label: 'Total Applications', value: 0, color: 'text-blue-600' },
        { label: 'Under Review', value: 0, color: 'text-yellow-600' },
        { label: 'Accepted', value: 0, color: 'text-green-600' },
        { label: 'Interviews', value: 0, color: 'text-purple-600' },
      ];
    }

    const stats = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { label: 'Total Applications', value: applications.length, color: 'text-blue-600' },
      { label: 'Under Review', value: stats.under_review || 0, color: 'text-yellow-600' },
      { label: 'Accepted', value: stats.accepted || 0, color: 'text-green-600' },
      { label: 'Interviews', value: stats.interview_scheduled || 0, color: 'text-purple-600' },
    ];
  };

  const filteredApplications = (applications || []).filter(app => {
    const matchesSearch = app.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.programName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = ApplicationUtils.formatDate;
  const isDeadlineNear = ApplicationUtils.isDeadlineNear;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 p-4 sm:p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-5 sm:p-7 shadow-sm">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 right-0 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-2xl" />
            <div className="absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-200/40 via-blue-200/20 to-transparent blur-2xl" />
          </div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <ClipboardList className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Application Tracker</h1>
              </div>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
                Monitor all your university applications in one place with real-time updates.
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full sm:w-auto"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {getStatusStats().map((stat, index) => (
            <Card key={index} className="border-slate-200/60 bg-white/90">
              <CardContent className="p-5 sm:p-6 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="border-slate-200/60 bg-white/90">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search universities or programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card className="border-slate-200/60 bg-white/90">
          <CardHeader>
            <CardTitle>Your Applications ({filteredApplications.length})</CardTitle>
            <CardDescription>
              Track the status and progress of all your university applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>University & Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <ClipboardList className="h-12 w-12 mb-4 text-gray-400" />
                          <p className="text-lg font-medium mb-2">No applications found</p>
                          <p className="text-sm mb-4">
                            {(!applications || applications.length === 0)
                              ? "Get started by adding your first application"
                              : "Try adjusting your filters"}
                          </p>
                          {(!applications || applications.length === 0) && (
                            <Button
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => setIsAddModalOpen(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Application
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{app.universityName}</p>
                          <p className="text-sm text-gray-600">{app.programName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${isDeadlineNear(app.deadline) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {formatDate(app.deadline)}
                          </span>
                          {isDeadlineNear(app.deadline) && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(app.submittedDate)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(app.lastUpdated)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {app.documents.slice(0, 2).map((doc, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {doc}
                            </Badge>
                          ))}
                          {app.documents.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{app.documents.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = `/dashboard/application-tracker/${app.id}`}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(app);
                              setIsAIInsightsModalOpen(true);
                            }}
                            title="AI Insights"
                          >
                            <Brain className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(app);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit Application"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateApplication(app.id)}
                            title="Duplicate Application"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteApplication(app.id)}
                            title="Delete Application"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <span>Upcoming Deadlines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(applications || [])
                  .filter(app => isDeadlineNear(app.deadline))
                  .map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{app.universityName}</p>
                        <p className="text-sm text-gray-600">Deadline: {formatDate(app.deadline)}</p>
                      </div>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  ))}
                {(applications || []).filter(app => isDeadlineNear(app.deadline)).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No urgent deadlines</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Success Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">75%</p>
                <p className="text-sm text-gray-600 mb-4">Response Rate</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Accepted</span>
                    <span className="text-green-600">1 application</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Interview</span>
                    <span className="text-purple-600">1 application</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Under Review</span>
                    <span className="text-yellow-600">1 application</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <AddApplicationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddApplication={handleAddApplication}
        />

        <EditApplicationModal
          application={selectedApplication}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedApplication(null);
          }}
          onUpdateApplication={handleUpdateApplication}
        />

        <AIInsightsModal
          application={selectedApplication}
          isOpen={isAIInsightsModalOpen}
          onClose={() => {
            setIsAIInsightsModalOpen(false);
            setSelectedApplication(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}