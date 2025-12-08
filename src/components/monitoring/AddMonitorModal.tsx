'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Globe, Linkedin, GraduationCap, User } from 'lucide-react';

interface AddMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMonitor: (monitorData: any) => void;
}

export default function AddMonitorModal({
  isOpen,
  onClose,
  onAddMonitor,
}: AddMonitorModalProps) {
  const [monitorType, setMonitorType] = useState<'website' | 'linkedin' | 'scholarship' | 'professor'>('website');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'university',
    frequency: 'daily',
    keywords: [] as string[],
    notifications: true,
    emailAlerts: true,
  });
  const [newKeyword, setNewKeyword] = useState('');

  const monitorTypes = [
    { value: 'website', label: 'Website', icon: Globe, description: 'Monitor university and scholarship websites' },
    { value: 'linkedin', label: 'LinkedIn Profile', icon: Linkedin, description: 'Track professor and researcher profiles' },
    { value: 'scholarship', label: 'Scholarship Portal', icon: GraduationCap, description: 'Monitor scholarship opportunities' },
    { value: 'professor', label: 'Professor Profile', icon: User, description: 'Track professor research and activity' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMonitor({
      ...formData,
      monitorType,
      id: Date.now().toString(),
      status: 'active',
      lastChecked: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    });
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      type: 'university',
      frequency: 'daily',
      keywords: [],
      notifications: true,
      emailAlerts: true,
    });
    setNewKeyword('');
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  const renderFormFields = () => {
    switch (monitorType) {
      case 'website':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Website Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., MIT Graduate Admissions"
                required
              />
            </div>
            <div>
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://gradadmissions.mit.edu"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Website Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="scholarship">Scholarship Portal</SelectItem>
                  <SelectItem value="news">News Site</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'linkedin':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Profile Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Dr. Sarah Johnson"
                required
              />
            </div>
            <div>
              <Label htmlFor="url">LinkedIn Profile URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://linkedin.com/in/sarah-johnson"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Profile Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="researcher">Researcher</SelectItem>
                  <SelectItem value="industry">Industry Professional</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'scholarship':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Scholarship Portal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Scholarships.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="url">Portal URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://scholarships.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Portal Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Scholarships</SelectItem>
                  <SelectItem value="university">University Specific</SelectItem>
                  <SelectItem value="field">Field Specific</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'professor':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Professor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Dr. Michael Chen"
                required
              />
            </div>
            <div>
              <Label htmlFor="url">Profile URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://profiles.stanford.edu/michael-chen"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">University</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                placeholder="e.g., Stanford University"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Monitor</DialogTitle>
          <DialogDescription>
            Set up automated monitoring for websites, LinkedIn profiles, scholarships, or professors
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Monitor Type Selection */}
          <div>
            <Label>Monitor Type</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {monitorTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMonitorType(type.value as any)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      monitorType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Form Fields */}
          {renderFormFields()}

          {/* Monitoring Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="frequency">Check Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
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
            </div>

            {/* Keywords */}
            <div>
              <Label>Keywords to Monitor</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword (e.g., admissions, deadline, funding)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" onClick={addKeyword} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="flex items-center space-x-1">
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(index)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-3">
              <Label>Notification Settings</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">In-app Notifications</p>
                  <p className="text-xs text-gray-600">Get notified when changes are detected</p>
                </div>
                <Switch
                  checked={formData.notifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Email Alerts</p>
                  <p className="text-xs text-gray-600">Receive email notifications for important updates</p>
                </div>
                <Switch
                  checked={formData.emailAlerts}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailAlerts: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Add Monitor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
