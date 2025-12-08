'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Smartphone, Clock, TestTube } from 'lucide-react';

interface NotificationPreferences {
  channels: {
    email: { enabled: boolean; address: string };
    sms: { enabled: boolean; phone: string };
    push: { enabled: boolean };
  };
  types: {
    deadlineReminders: boolean;
    statusUpdates: boolean;
    documentRequests: boolean;
    aiInsights: boolean;
    weeklyDigest: boolean;
    lorReminders: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  timezone: string;
}

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    channels: {
      email: { enabled: true, address: '' },
      sms: { enabled: false, phone: '' },
      push: { enabled: false },
    },
    types: {
      deadlineReminders: true,
      statusUpdates: true,
      documentRequests: true,
      aiInsights: false,
      weeklyDigest: true,
      lorReminders: true,
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York',
    },
    timezone: 'America/New_York',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      const result = await response.json();

      if (result.success) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Notification preferences saved successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async (channel: string) => {
    try {
      setTesting(channel);

      let recipient = '';
      if (channel === 'email') {
        recipient = preferences.channels.email.address;
      } else if (channel === 'sms') {
        recipient = preferences.channels.sms.phone;
      }

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipient }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Test Sent',
          description: `Test ${channel} notification sent successfully`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: 'Error',
        description: `Failed to send test ${channel}`,
        variant: 'destructive',
      });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage how you receive updates about your applications
          </p>
        </div>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Mail className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <Label htmlFor="email-enabled">Email Notifications</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={preferences.channels.email.address}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        channels: {
                          ...preferences.channels,
                          email: {
                            ...preferences.channels.email,
                            address: e.target.value,
                          },
                        },
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <Switch
                  id="email-enabled"
                  checked={preferences.channels.email.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      channels: {
                        ...preferences.channels,
                        email: { ...preferences.channels.email, enabled: checked },
                      },
                    })
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => sendTestNotification('email')}
                disabled={!preferences.channels.email.enabled || testing === 'email'}
              >
                {testing === 'email' ? (
                  <>
                    <TestTube className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test
                  </>
                )}
              </Button>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <Label htmlFor="sms-enabled">SMS Notifications</Label>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={preferences.channels.sms.phone}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        channels: {
                          ...preferences.channels,
                          sms: {
                            ...preferences.channels.sms,
                            phone: e.target.value,
                          },
                        },
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <Switch
                  id="sms-enabled"
                  checked={preferences.channels.sms.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      channels: {
                        ...preferences.channels,
                        sms: { ...preferences.channels.sms, enabled: checked },
                      },
                    })
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => sendTestNotification('sms')}
                disabled={!preferences.channels.sms.enabled || testing === 'sms'}
              >
                {testing === 'sms' ? (
                  <>
                    <TestTube className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test
                  </>
                )}
              </Button>
            </div>

            {/* Push */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <Label htmlFor="push-enabled">Push Notifications</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Receive notifications on your mobile device
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={preferences.channels.push.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      channels: {
                        ...preferences.channels,
                        push: { enabled: checked },
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries({
              deadlineReminders: 'Deadline Reminders',
              statusUpdates: 'Application Status Updates',
              documentRequests: 'Document Requests',
              aiInsights: 'AI Insights & Recommendations',
              weeklyDigest: 'Weekly Summary Digest',
              lorReminders: 'Letter of Recommendation Reminders',
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key}>{label}</Label>
                <Switch
                  id={key}
                  checked={preferences.types[key as keyof typeof preferences.types]}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      types: { ...preferences.types, [key]: checked },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quiet Hours
            </CardTitle>
            <CardDescription>
              Mute notifications during specific hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <Switch
                id="quiet-hours"
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    quietHours: { ...preferences.quietHours, enabled: checked },
                  })
                }
              />
            </div>

            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        quietHours: {
                          ...preferences.quietHours,
                          start: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        quietHours: {
                          ...preferences.quietHours,
                          end: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card>
          <CardHeader>
            <CardTitle>Timezone</CardTitle>
            <CardDescription>
              Set your timezone for accurate deadline reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={preferences.timezone}
              onValueChange={(value) =>
                setPreferences({ ...preferences, timezone: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={loadPreferences} disabled={saving}>
            Reset
          </Button>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
