'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon, Plus, X, Edit, Save, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Application, UpdateApplicationDto } from '@/types/application';

interface EditApplicationModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateApplication: (id: string, data: UpdateApplicationDto) => Promise<void>;
}

export default function EditApplicationModal({
  application,
  isOpen,
  onClose,
  onUpdateApplication,
}: EditApplicationModalProps) {
  const [formData, setFormData] = useState<UpdateApplicationDto>({});
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [submittedDate, setSubmittedDate] = useState<Date | undefined>(undefined);
  const [isDeadlineCalendarOpen, setIsDeadlineCalendarOpen] = useState(false);
  const [isSubmittedCalendarOpen, setIsSubmittedCalendarOpen] = useState(false);

  useEffect(() => {
    if (application && isOpen) {
      setFormData({
        universityName: application.universityName,
        programName: application.programName,
        degreeLevel: application.degreeLevel,
        status: application.status,
        deadline: application.deadline,
        submittedDate: application.submittedDate,
        portalUrl: application.portalUrl,
        applicationFee: application.applicationFee,
        priority: application.priority,
        notes: application.notes,
        tags: application.tags,
      });
      setDeadlineDate(application.deadline ? new Date(application.deadline) : undefined);
      setSubmittedDate(application.submittedDate ? new Date(application.submittedDate) : undefined);
      setError(null);
    }
  }, [application, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setError(null);

    // Client-side validation
    if (!formData.universityName?.trim()) {
      setError('University name is required');
      return;
    }
    if (!formData.programName?.trim()) {
      setError('Program name is required');
      return;
    }
    if (!formData.deadline) {
      setError('Application deadline is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateApplication(application.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating application:', error);
      setError(error instanceof Error ? error.message : 'Failed to update application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError(null);
    }
  };

  const handleDeadlineSelect = (date: Date | undefined) => {
    if (date) {
      setDeadlineDate(date);
      setFormData(prev => ({ ...prev, deadline: date.toISOString() }));
      setIsDeadlineCalendarOpen(false); // Close the popover after selection
    }
  };

  const handleSubmittedDateSelect = (date: Date | undefined) => {
    if (date) {
      setSubmittedDate(date);
      setFormData(prev => ({ ...prev, submittedDate: date.toISOString() }));
      setIsSubmittedCalendarOpen(false); // Close the popover after selection
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-blue-600" />
            <span>Edit Application</span>
          </DialogTitle>
          <DialogDescription>
            Update your application details and track progress
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="universityName">University Name *</Label>
                <Input
                  id="universityName"
                  value={formData.universityName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, universityName: e.target.value }))}
                  placeholder="e.g., Massachusetts Institute of Technology"
                  required
                />
              </div>
              <div>
                <Label htmlFor="programName">Program Name *</Label>
                <Input
                  id="programName"
                  value={formData.programName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, programName: e.target.value }))}
                  placeholder="e.g., Master of Science in Computer Science"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="degreeLevel">Degree Level *</Label>
                <Select
                  value={formData.degreeLevel}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, degreeLevel: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="graduate">Graduate (Master's)</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="postdoc">Postdoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Application Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline">Application Deadline *</Label>
                <Popover open={isDeadlineCalendarOpen} onOpenChange={setIsDeadlineCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !formData.deadline && 'text-muted-foreground'
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadlineDate ? format(deadlineDate, 'PPP') : 'Select deadline'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadlineDate}
                      onSelect={handleDeadlineSelect}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="submittedDate">Submitted Date</Label>
                <Popover open={isSubmittedCalendarOpen} onOpenChange={setIsSubmittedCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !formData.submittedDate && 'text-muted-foreground'
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {submittedDate ? format(submittedDate, 'PPP') : 'Not submitted yet'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={submittedDate}
                      onSelect={handleSubmittedDateSelect}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicationFee">Application Fee</Label>
                <Input
                  id="applicationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.applicationFee || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, applicationFee: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="portalUrl">Application Portal URL</Label>
                <Input
                  id="portalUrl"
                  type="url"
                  value={formData.portalUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, portalUrl: e.target.value }))}
                  placeholder="https://gradadmissions.university.edu"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Tags</h4>
            
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag (e.g., computer-science, ai, research)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Notes</h4>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this application..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
