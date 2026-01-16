'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Monitor,
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
  Globe,
  Linkedin,
  GraduationCap,
  User,
  Mail,
  Settings,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Star,
  Bookmark,
  Share2,
  Download,
} from 'lucide-react';
import { LeadToApplicationModal, AddMonitorModal, SettingsModal } from '@/components/monitoring';

interface Website {
  id: string;
  name: string;
  url: string;
  type: 'university' | 'scholarship' | 'news' | 'custom';
  status: 'active' | 'paused' | 'error';
  lastChecked: string;
  lastUpdate: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  keywords: string[];
}

interface LinkedInProfile {
  id: string;
  name: string;
  title: string;
  university: string;
  department: string;
  profileUrl: string;
  lastActivity: string;
  researchInterests: string[];
  publications: number;
  followers: number;
  connectionStatus: 'connected' | 'pending' | 'not_connected';
}

interface Scholarship {
  id: string;
  title: string;
  university: string;
  amount: string;
  deadline: string;
  eligibility: string[];
  applicationUrl: string;
  status: 'open' | 'closing_soon' | 'closed';
  source: string;
  lastUpdated: string;
}

interface Professor {
  id: string;
  name: string;
  title: string;
  university: string;
  department: string;
  email: string;
  researchAreas: string[];
  recentPublications: string[];
  labWebsite: string;
  acceptingStudents: boolean;
  lastActivity: string;
}

interface AdmissionCircular {
  id: string;
  university: string;
  program: string;
  deadline: string;
  requirements: string[];
  applicationUrl: string;
  status: 'open' | 'closing_soon' | 'closed';
  source: string;
  lastUpdated: string;
}

interface Lead {
  id: string;
  type: 'scholarship' | 'professor' | 'admission' | 'opportunity';
  title: string;
  description: string;
  source: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'reviewed' | 'applied' | 'rejected';
  dateFound: string;
  tags: string[];
}

export default function MonitoringAgentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isAddMonitorModalOpen, setIsAddMonitorModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Mock data - in real implementation, this would come from API
  const [websites, setWebsites] = useState<Website[]>([
    {
      id: '1',
      name: 'MIT Graduate Admissions',
      url: 'https://gradadmissions.mit.edu',
      type: 'university',
      status: 'active',
      lastChecked: '2024-01-15T10:30:00Z',
      lastUpdate: '2024-01-15T09:15:00Z',
      frequency: 'daily',
      keywords: ['admissions', 'deadline', 'requirements'],
    },
    {
      id: '2',
      name: 'Stanford CS Department',
      url: 'https://cs.stanford.edu',
      type: 'university',
      status: 'active',
      lastChecked: '2024-01-15T10:25:00Z',
      lastUpdate: '2024-01-15T08:45:00Z',
      frequency: 'daily',
      keywords: ['graduate', 'research', 'faculty'],
    },
    {
      id: '3',
      name: 'Scholarship Portal',
      url: 'https://scholarships.com',
      type: 'scholarship',
      status: 'active',
      lastChecked: '2024-01-15T10:20:00Z',
      lastUpdate: '2024-01-15T07:30:00Z',
      frequency: 'daily',
      keywords: ['computer science', 'graduate', 'international'],
    },
  ]);

  const [linkedinProfiles, setLinkedinProfiles] = useState<LinkedInProfile[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      title: 'Professor of Computer Science',
      university: 'MIT',
      department: 'CSAIL',
      profileUrl: 'https://linkedin.com/in/sarah-johnson',
      lastActivity: '2024-01-14T15:30:00Z',
      researchInterests: ['Machine Learning', 'AI', 'Robotics'],
      publications: 45,
      followers: 2500,
      connectionStatus: 'connected',
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      title: 'Associate Professor',
      university: 'Stanford',
      department: 'Computer Science',
      profileUrl: 'https://linkedin.com/in/michael-chen',
      lastActivity: '2024-01-13T12:15:00Z',
      researchInterests: ['Deep Learning', 'Computer Vision'],
      publications: 32,
      followers: 1800,
      connectionStatus: 'pending',
    },
  ]);

  const [scholarships, setScholarships] = useState<Scholarship[]>([
    {
      id: '1',
      title: 'MIT Presidential Fellowship',
      university: 'MIT',
      amount: '$50,000/year',
      deadline: '2024-02-15',
      eligibility: ['International students', 'PhD candidates', 'STEM fields'],
      applicationUrl: 'https://mit.edu/fellowship',
      status: 'open',
      source: 'MIT Website',
      lastUpdated: '2024-01-15T09:00:00Z',
    },
    {
      id: '2',
      title: 'Stanford Graduate Fellowship',
      university: 'Stanford University',
      amount: '$45,000/year',
      deadline: '2024-02-01',
      eligibility: ['Graduate students', 'Research focus', 'Academic excellence'],
      applicationUrl: 'https://stanford.edu/fellowship',
      status: 'closing_soon',
      source: 'Stanford Website',
      lastUpdated: '2024-01-14T14:30:00Z',
    },
  ]);

  const [professors, setProfessors] = useState<Professor[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      title: 'Professor',
      university: 'MIT',
      department: 'Computer Science',
      email: 'sarah@mit.edu',
      researchAreas: ['Machine Learning', 'AI', 'Robotics'],
      recentPublications: ['Deep Learning in Robotics', 'AI Ethics', 'Neural Networks'],
      labWebsite: 'https://ai.mit.edu',
      acceptingStudents: true,
      lastActivity: '2024-01-14T16:00:00Z',
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      title: 'Associate Professor',
      university: 'Stanford',
      department: 'Computer Science',
      email: 'mchen@stanford.edu',
      researchAreas: ['Deep Learning', 'Computer Vision'],
      recentPublications: ['Vision Transformers', 'Self-Supervised Learning'],
      labWebsite: 'https://vision.stanford.edu',
      acceptingStudents: true,
      lastActivity: '2024-01-13T11:30:00Z',
    },
  ]);

  const [admissionCirculars, setAdmissionCirculars] = useState<AdmissionCircular[]>([
    {
      id: '1',
      university: 'MIT',
      program: 'PhD in Computer Science',
      deadline: '2024-12-15',
      requirements: ['GRE', 'TOEFL', 'SOP', 'LOR', 'Transcripts'],
      applicationUrl: 'https://gradadmissions.mit.edu',
      status: 'open',
      source: 'MIT Graduate Admissions',
      lastUpdated: '2024-01-15T08:00:00Z',
    },
    {
      id: '2',
      university: 'Stanford University',
      program: 'MS in Computer Science',
      deadline: '2024-01-31',
      requirements: ['GRE', 'TOEFL', 'SOP', 'LOR', 'Transcripts'],
      applicationUrl: 'https://gradadmissions.stanford.edu',
      status: 'closing_soon',
      source: 'Stanford Graduate Admissions',
      lastUpdated: '2024-01-14T10:00:00Z',
    },
  ]);

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      type: 'scholarship',
      title: 'MIT Presidential Fellowship',
      description: 'Full funding for PhD students in STEM fields',
      source: 'MIT Website',
      url: 'https://mit.edu/fellowship',
      priority: 'high',
      status: 'new',
      dateFound: '2024-01-15T09:00:00Z',
      tags: ['funding', 'phd', 'stem'],
    },
    {
      id: '2',
      type: 'professor',
      title: 'Dr. Sarah Johnson - MIT',
      description: 'Professor accepting PhD students in AI/ML',
      source: 'LinkedIn',
      url: 'https://linkedin.com/in/sarah-johnson',
      priority: 'high',
      status: 'new',
      dateFound: '2024-01-14T16:00:00Z',
      tags: ['ai', 'ml', 'phd', 'mit'],
    },
  ]);

  const getStatusBadge = (status: string, type: string = 'default') => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      error: { color: 'bg-red-100 text-red-800', icon: XCircle },
      open: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closing_soon: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      closed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      new: { color: 'bg-blue-100 text-blue-800', icon: Star },
      reviewed: { color: 'bg-purple-100 text-purple-800', icon: Eye },
      applied: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      connected: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      not_connected: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      low: { color: 'bg-green-100 text-green-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge className={`${config.color}`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  };

  const addToApplicationTracker = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleAddToTracker = (applicationData: any) => {
    // This would integrate with the application tracker
    console.log('Adding to application tracker:', applicationData);
    // In real implementation, this would make an API call to add the lead to the application tracker
    // Update lead status to 'applied'
    setLeads(prev => prev.map(lead => 
      lead.id === selectedLead?.id 
        ? { ...lead, status: 'applied' as const }
        : lead
    ));
  };

  const handleAddMonitor = (monitorData: any) => {
    // Add new monitor to the appropriate list
    console.log('Adding monitor:', monitorData);
    if (monitorData.monitorType === 'website') {
      setWebsites(prev => [...prev, monitorData]);
    }
    // Handle other monitor types...
  };

  const handleSaveSettings = (settings: any) => {
    // Save settings to backend/local storage
    console.log('Saving settings:', settings);
    // In real implementation, this would make an API call to save settings
    localStorage.setItem('monitoring-settings', JSON.stringify(settings));
  };

  const getOverviewStats = () => {
    return [
      { label: 'Websites Monitored', value: websites.length, color: 'text-blue-600', icon: Globe },
      { label: 'LinkedIn Profiles', value: linkedinProfiles.length, color: 'text-blue-700', icon: Linkedin },
      { label: 'Scholarships Found', value: scholarships.length, color: 'text-green-600', icon: GraduationCap },
      { label: 'Professors Tracked', value: professors.length, color: 'text-purple-600', icon: User },
      { label: 'Admission Deadlines', value: admissionCirculars.length, color: 'text-orange-600', icon: Calendar },
      { label: 'New Leads', value: leads.filter(l => l.status === 'new').length, color: 'text-red-600', icon: Star },
    ];
  };

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
                <Monitor className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Monitoring Agent</h1>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isMonitoringActive}
                    onCheckedChange={setIsMonitoringActive}
                  />
                  <span className="text-sm text-slate-600">
                    {isMonitoringActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
                Monitor websites, LinkedIn profiles, scholarships, and admission deadlines automatically.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full sm:w-auto"
                onClick={() => setIsAddMonitorModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Monitor
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {getOverviewStats().map((stat, index) => (
            <Card key={index} className="border-slate-200/60 bg-white/90">
              <CardContent className="p-4 text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-white/90 border border-slate-200/60 rounded-xl p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="websites">Websites</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
            <TabsTrigger value="professors">Professors</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {leads.slice(0, 5).map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{lead.title}</p>
                              <p className="text-xs text-gray-600">{lead.source}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getPriorityBadge(lead.priority)}
                            <span className="text-xs text-gray-500">{formatDate(lead.dateFound)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-red-600" />
                    <span>Upcoming Deadlines</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {[...scholarships, ...admissionCirculars]
                        .filter(item => isDeadlineNear(item.deadline))
                        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                        .slice(0, 5)
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {'title' in item ? item.title : item.program}
                              </p>
                              <p className="text-xs text-gray-600">{item.university}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-red-600">{formatDate(item.deadline)}</p>
                              <AlertCircle className="h-4 w-4 text-red-500 ml-auto" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  <span>Email Notifications</span>
                </CardTitle>
                <CardDescription>
                  Configure your daily update preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Daily Summary</p>
                      <p className="text-xs text-gray-600">New leads and updates</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Deadline Alerts</p>
                      <p className="text-xs text-gray-600">Urgent deadlines</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Professor Updates</p>
                      <p className="text-xs text-gray-600">Research and activity</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Websites Tab */}
          <TabsContent value="websites" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Monitored Websites</CardTitle>
                    <CardDescription>
                      Track changes and updates on university and scholarship websites
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => setIsAddMonitorModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Website
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Website</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {websites.map((website) => (
                      <TableRow key={website.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{website.name}</p>
                            <p className="text-sm text-gray-600">{website.url}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{website.type}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(website.status)}</TableCell>
                        <TableCell>{website.frequency}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(website.lastChecked)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LinkedIn Tab */}
          <TabsContent value="linkedin" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>LinkedIn Profiles</CardTitle>
                    <CardDescription>
                      Track professor and researcher activity on LinkedIn
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Research Areas</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedinProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile.name}</p>
                            <p className="text-sm text-gray-600">{profile.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{profile.university}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {profile.researchInterests.slice(0, 2).map((interest, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                            {profile.researchInterests.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{profile.researchInterests.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(profile.connectionStatus)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(profile.lastActivity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scholarships Tab */}
          <TabsContent value="scholarships" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Scholarships & Funding</CardTitle>
                    <CardDescription>
                      Track scholarship opportunities and funding sources
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scholarship</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scholarships.map((scholarship) => (
                      <TableRow key={scholarship.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{scholarship.title}</p>
                            <p className="text-sm text-gray-600">{scholarship.source}</p>
                          </div>
                        </TableCell>
                        <TableCell>{scholarship.university}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {scholarship.amount}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${isDeadlineNear(scholarship.deadline) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {formatDate(scholarship.deadline)}
                            </span>
                            {isDeadlineNear(scholarship.deadline) && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(scholarship.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professors Tab */}
          <TabsContent value="professors" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Professors & Researchers</CardTitle>
                    <CardDescription>
                      Track professor profiles, research, and student acceptance status
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Professor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Professor</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Research Areas</TableHead>
                      <TableHead>Accepting Students</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professors.map((professor) => (
                      <TableRow key={professor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{professor.name}</p>
                            <p className="text-sm text-gray-600">{professor.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{professor.university}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {professor.researchAreas.slice(0, 2).map((area, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                            {professor.researchAreas.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{professor.researchAreas.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {professor.acceptingStudents ? (
                            <Badge className="bg-green-100 text-green-800">Yes</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(professor.lastActivity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Discovered Leads</CardTitle>
                    <CardDescription>
                      New opportunities found by the monitoring agent
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Found</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.title}</p>
                            <p className="text-sm text-gray-600">{lead.description}</p>
                            <p className="text-xs text-gray-500">{lead.source}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.type}</Badge>
                        </TableCell>
                        <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(lead.dateFound)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => addToApplicationTracker(lead)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <LeadToApplicationModal
          lead={selectedLead}
          isOpen={isLeadModalOpen}
          onClose={() => {
            setIsLeadModalOpen(false);
            setSelectedLead(null);
          }}
          onAddToTracker={handleAddToTracker}
        />

        <AddMonitorModal
          isOpen={isAddMonitorModalOpen}
          onClose={() => setIsAddMonitorModalOpen(false)}
          onAddMonitor={handleAddMonitor}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveSettings}
        />
      </div>
    </DashboardLayout>
  );
}
