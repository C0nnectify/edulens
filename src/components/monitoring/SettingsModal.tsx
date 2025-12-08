'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Mail,
  Bell,
  Clock,
  Globe,
  Linkedin,
  GraduationCap,
  User,
  Shield,
  Save,
  TestTube,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface EmailSettings {
  enabled: boolean;
  email: string;
  dailySummary: boolean;
  deadlineAlerts: boolean;
  professorUpdates: boolean;
  scholarshipAlerts: boolean;
  newLeadNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface TrackingSettings {
  websiteCheckFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  linkedinCheckFrequency: 'daily' | 'weekly' | 'monthly';
  scholarshipCheckFrequency: 'daily' | 'weekly' | 'monthly';
  professorCheckFrequency: 'weekly' | 'monthly';
  maxConcurrentChecks: number;
  retryAttempts: number;
  timeoutSeconds: number;
}

interface NotificationSettings {
  inAppNotifications: boolean;
  browserNotifications: boolean;
  soundNotifications: boolean;
  priorityAlerts: boolean;
  digestMode: boolean;
}

interface SecuritySettings {
  dataRetention: '30days' | '90days' | '1year' | 'forever';
  shareData: boolean;
  analytics: boolean;
  backupEnabled: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
}: SettingsModalProps) {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    enabled: true,
    email: '',
    dailySummary: true,
    deadlineAlerts: true,
    professorUpdates: false,
    scholarshipAlerts: true,
    newLeadNotifications: true,
    frequency: 'daily',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });

  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>({
    websiteCheckFrequency: 'daily',
    linkedinCheckFrequency: 'weekly',
    scholarshipCheckFrequency: 'daily',
    professorCheckFrequency: 'weekly',
    maxConcurrentChecks: 5,
    retryAttempts: 3,
    timeoutSeconds: 30,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    inAppNotifications: true,
    browserNotifications: false,
    soundNotifications: false,
    priorityAlerts: true,
    digestMode: false,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    dataRetention: '1year',
    shareData: false,
    analytics: true,
    backupEnabled: true,
  });

  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSave = () => {
    const allSettings = {
      email: emailSettings,
      tracking: trackingSettings,
      notifications: notificationSettings,
      security: securitySettings,
    };
    onSave(allSettings);
    onClose();
  };

  const sendTestEmail = async () => {
    setTestEmailStatus('sending');
    // Simulate API call
    setTimeout(() => {
      setTestEmailStatus('success');
      setTimeout(() => setTestEmailStatus('idle'), 3000);
    }, 2000);
  };

  const getFrequencyDescription = (frequency: string) => {
    const descriptions = {
      hourly: 'Checks every hour - High resource usage',
      daily: 'Checks once per day - Balanced approach',
      weekly: 'Checks once per week - Low resource usage',
      monthly: 'Checks once per month - Minimal resource usage',
    };
    return descriptions[frequency as keyof typeof descriptions] || '';
  };

  const getFrequencyColor = (frequency: string) => {
    const colors = {
      hourly: 'text-red-600',
      daily: 'text-green-600',
      weekly: 'text-blue-600',
      monthly: 'text-gray-600',
    };
    return colors[frequency as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Monitoring Agent Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure your monitoring preferences, email notifications, and tracking frequencies
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Tracking</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Email Settings Tab */}
          <TabsContent value="email" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Enable or disable email notifications</p>
                </div>
                <Switch
                  checked={emailSettings.enabled}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {emailSettings.enabled && (
                <>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="email"
                        type="email"
                        value={emailSettings.email}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={sendTestEmail}
                        disabled={!emailSettings.email || testEmailStatus === 'sending'}
                      >
                        {testEmailStatus === 'sending' ? (
                          <TestTube className="h-4 w-4 animate-spin" />
                        ) : testEmailStatus === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : testEmailStatus === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {testEmailStatus === 'success' && (
                      <p className="text-sm text-green-600 mt-1">Test email sent successfully!</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Notification Types</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Daily Summary</p>
                          <p className="text-xs text-gray-600">Daily digest of all monitoring activity</p>
                        </div>
                        <Switch
                          checked={emailSettings.dailySummary}
                          onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, dailySummary: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Deadline Alerts</p>
                          <p className="text-xs text-gray-600">Urgent notifications for approaching deadlines</p>
                        </div>
                        <Switch
                          checked={emailSettings.deadlineAlerts}
                          onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, deadlineAlerts: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Professor Updates</p>
                          <p className="text-xs text-gray-600">Research activity and publication updates</p>
                        </div>
                        <Switch
                          checked={emailSettings.professorUpdates}
                          onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, professorUpdates: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Scholarship Alerts</p>
                          <p className="text-xs text-gray-600">New scholarship opportunities and deadlines</p>
                        </div>
                        <Switch
                          checked={emailSettings.scholarshipAlerts}
                          onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, scholarshipAlerts: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">New Lead Notifications</p>
                          <p className="text-xs text-gray-600">Immediate alerts for new opportunities</p>
                        </div>
                        <Switch
                          checked={emailSettings.newLeadNotifications}
                          onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, newLeadNotifications: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="frequency">Email Frequency</Label>
                      <Select
                        value={emailSettings.frequency}
                        onValueChange={(value) => setEmailSettings(prev => ({ ...prev, frequency: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Quiet Hours</p>
                        <p className="text-xs text-gray-600">Pause notifications during specified hours</p>
                      </div>
                      <Switch
                        checked={emailSettings.quietHours.enabled}
                        onCheckedChange={(checked) => setEmailSettings(prev => ({ 
                          ...prev, 
                          quietHours: { ...prev.quietHours, enabled: checked }
                        }))}
                      />
                    </div>

                    {emailSettings.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quietStart">Start Time</Label>
                          <Input
                            id="quietStart"
                            type="time"
                            value={emailSettings.quietHours.start}
                            onChange={(e) => setEmailSettings(prev => ({ 
                              ...prev, 
                              quietHours: { ...prev.quietHours, start: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quietEnd">End Time</Label>
                          <Input
                            id="quietEnd"
                            type="time"
                            value={emailSettings.quietHours.end}
                            onChange={(e) => setEmailSettings(prev => ({ 
                              ...prev, 
                              quietHours: { ...prev.quietHours, end: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Tracking Settings Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Check Frequencies</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <h5 className="font-medium">Website Monitoring</h5>
                    </div>
                    <Select
                      value={trackingSettings.websiteCheckFrequency}
                      onValueChange={(value) => setTrackingSettings(prev => ({ ...prev, websiteCheckFrequency: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className={`text-xs mt-2 ${getFrequencyColor(trackingSettings.websiteCheckFrequency)}`}>
                      {getFrequencyDescription(trackingSettings.websiteCheckFrequency)}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Linkedin className="h-5 w-5 text-blue-700" />
                      <h5 className="font-medium">LinkedIn Profiles</h5>
                    </div>
                    <Select
                      value={trackingSettings.linkedinCheckFrequency}
                      onValueChange={(value) => setTrackingSettings(prev => ({ ...prev, linkedinCheckFrequency: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className={`text-xs mt-2 ${getFrequencyColor(trackingSettings.linkedinCheckFrequency)}`}>
                      {getFrequencyDescription(trackingSettings.linkedinCheckFrequency)}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                      <h5 className="font-medium">Scholarships</h5>
                    </div>
                    <Select
                      value={trackingSettings.scholarshipCheckFrequency}
                      onValueChange={(value) => setTrackingSettings(prev => ({ ...prev, scholarshipCheckFrequency: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className={`text-xs mt-2 ${getFrequencyColor(trackingSettings.scholarshipCheckFrequency)}`}>
                      {getFrequencyDescription(trackingSettings.scholarshipCheckFrequency)}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="h-5 w-5 text-purple-600" />
                      <h5 className="font-medium">Professors</h5>
                    </div>
                    <Select
                      value={trackingSettings.professorCheckFrequency}
                      onValueChange={(value) => setTrackingSettings(prev => ({ ...prev, professorCheckFrequency: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className={`text-xs mt-2 ${getFrequencyColor(trackingSettings.professorCheckFrequency)}`}>
                      {getFrequencyDescription(trackingSettings.professorCheckFrequency)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Performance Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxConcurrent">Max Concurrent Checks</Label>
                    <Input
                      id="maxConcurrent"
                      type="number"
                      min="1"
                      max="20"
                      value={trackingSettings.maxConcurrentChecks}
                      onChange={(e) => setTrackingSettings(prev => ({ ...prev, maxConcurrentChecks: parseInt(e.target.value) }))}
                    />
                    <p className="text-xs text-gray-600 mt-1">Higher values = faster checking, more resource usage</p>
                  </div>

                  <div>
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      min="1"
                      max="10"
                      value={trackingSettings.retryAttempts}
                      onChange={(e) => setTrackingSettings(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                    />
                    <p className="text-xs text-gray-600 mt-1">Number of retries for failed checks</p>
                  </div>

                  <div>
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      min="5"
                      max="120"
                      value={trackingSettings.timeoutSeconds}
                      onChange={(e) => setTrackingSettings(prev => ({ ...prev, timeoutSeconds: parseInt(e.target.value) }))}
                    />
                    <p className="text-xs text-gray-600 mt-1">Timeout for each check request</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">In-App Notifications</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">In-App Notifications</p>
                    <p className="text-xs text-gray-600">Show notifications within the dashboard</p>
                  </div>
                  <Switch
                    checked={notificationSettings.inAppNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, inAppNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Browser Notifications</p>
                    <p className="text-xs text-gray-600">Show browser notifications (requires permission)</p>
                  </div>
                  <Switch
                    checked={notificationSettings.browserNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, browserNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Sound Notifications</p>
                    <p className="text-xs text-gray-600">Play sound for important notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.soundNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, soundNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Priority Alerts</p>
                    <p className="text-xs text-gray-600">Always show high-priority notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.priorityAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, priorityAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Digest Mode</p>
                    <p className="text-xs text-gray-600">Group notifications into digest summaries</p>
                  </div>
                  <Switch
                    checked={notificationSettings.digestMode}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, digestMode: checked }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Data & Privacy</h4>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="dataRetention">Data Retention Period</Label>
                  <Select
                    value={securitySettings.dataRetention}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, dataRetention: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">30 Days</SelectItem>
                      <SelectItem value="90days">90 Days</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">How long to keep monitoring data</p>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Share Anonymous Data</p>
                    <p className="text-xs text-gray-600">Help improve the service with anonymous usage data</p>
                  </div>
                  <Switch
                    checked={securitySettings.shareData}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, shareData: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Analytics</p>
                    <p className="text-xs text-gray-600">Track usage patterns for service improvement</p>
                  </div>
                  <Switch
                    checked={securitySettings.analytics}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, analytics: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Automatic Backup</p>
                    <p className="text-xs text-gray-600">Automatically backup your monitoring settings</p>
                  </div>
                  <Switch
                    checked={securitySettings.backupEnabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, backupEnabled: checked }))}
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-yellow-800">Data Security Notice</h5>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your monitoring data is encrypted and stored securely. We never share your personal information 
                      or monitoring targets with third parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
