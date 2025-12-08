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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

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

interface LeadToApplicationModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToTracker: (applicationData: any) => void;
}

export default function LeadToApplicationModal({
  lead,
  isOpen,
  onClose,
  onAddToTracker,
}: LeadToApplicationModalProps) {
  const [formData, setFormData] = useState({
    universityName: '',
    programName: '',
    deadline: new Date(),
    applicationType: 'graduate',
    status: 'not_started',
    notes: '',
    documents: [] as string[],
    portalUrl: '',
    priority: 'medium',
  });

  const [newDocument, setNewDocument] = useState('');

  React.useEffect(() => {
    if (lead) {
      // Pre-fill form based on lead data
      setFormData(prev => ({
        ...prev,
        universityName: lead.title.includes('University') ? lead.title.split(' - ')[1] || '' : '',
        programName: lead.type === 'scholarship' ? lead.title : '',
        portalUrl: lead.url,
        priority: lead.priority,
        notes: lead.description,
      }));
    }
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToTracker({
      ...formData,
      deadline: format(formData.deadline, 'yyyy-MM-dd'),
      leadId: lead?.id,
      source: lead?.source,
    });
    onClose();
  };

  const addDocument = () => {
    if (newDocument.trim()) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, newDocument.trim()],
      }));
      setNewDocument('');
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Lead to Application Tracker</DialogTitle>
          <DialogDescription>
            Convert this lead into a tracked application
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lead Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Lead Information</h4>
            <div className="space-y-2">
              <p className="text-sm"><strong>Title:</strong> {lead.title}</p>
              <p className="text-sm"><strong>Type:</strong> <Badge variant="outline">{lead.type}</Badge></p>
              <p className="text-sm"><strong>Source:</strong> {lead.source}</p>
              <p className="text-sm"><strong>Priority:</strong> <Badge className={lead.priority === 'high' ? 'bg-red-100 text-red-800' : lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{lead.priority}</Badge></p>
            </div>
          </div>

          {/* Application Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="universityName">University Name *</Label>
              <Input
                id="universityName"
                value={formData.universityName}
                onChange={(e) => setFormData(prev => ({ ...prev, universityName: e.target.value }))}
                placeholder="Enter university name"
                required
              />
            </div>
            <div>
              <Label htmlFor="programName">Program Name *</Label>
              <Input
                id="programName"
                value={formData.programName}
                onChange={(e) => setFormData(prev => ({ ...prev, programName: e.target.value }))}
                placeholder="Enter program name"
                required
              />
            </div>
            <div>
              <Label htmlFor="applicationType">Application Type</Label>
              <Select
                value={formData.applicationType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, applicationType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="graduate">Graduate</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="postdoc">Postdoc</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
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
            <div>
              <Label htmlFor="deadline">Application Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.deadline, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, deadline: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="portalUrl">Application Portal URL</Label>
              <Input
                id="portalUrl"
                value={formData.portalUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, portalUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Documents */}
          <div>
            <Label>Required Documents</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  placeholder="Add document type (e.g., SOP, Resume, Transcripts)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDocument())}
                />
                <Button type="button" onClick={addDocument} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.documents.map((doc, index) => (
                  <Badge key={index} variant="outline" className="flex items-center space-x-1">
                    <span>{doc}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
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
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this application..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Add to Application Tracker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
