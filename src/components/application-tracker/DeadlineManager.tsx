'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { DeadlineCountdown } from '@/components/shared/DeadlineCountdown';
import { formatInUserTimezone } from '@/lib/utils/timezone';

interface Deadline {
  id: string;
  applicationId: string;
  type: string;
  stage: string;
  date: string;
  time?: string;
  timezone: string;
  isExtended: boolean;
  status: string;
  notes?: string;
}

interface DeadlineManagerProps {
  applicationId: string;
}

export default function DeadlineManager({ applicationId }: DeadlineManagerProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: 'application',
    stage: 'regular',
    date: '',
    time: '23:59',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: '',
  });

  useEffect(() => {
    loadDeadlines();
  }, [applicationId]);

  const loadDeadlines = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${applicationId}/deadlines`);
      const result = await response.json();

      if (result.success) {
        setDeadlines(result.data);
      }
    } catch (error) {
      console.error('Error loading deadlines:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deadlines',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingDeadline
        ? `/api/applications/${applicationId}/deadlines/${editingDeadline.id}`
        : `/api/applications/${applicationId}/deadlines`;

      const response = await fetch(url, {
        method: editingDeadline ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: `Deadline ${editingDeadline ? 'updated' : 'created'} successfully`,
        });
        setIsAddModalOpen(false);
        setEditingDeadline(null);
        setFormData({
          type: 'application',
          stage: 'regular',
          date: '',
          time: '23:59',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notes: '',
        });
        loadDeadlines();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving deadline:', error);
      toast({
        title: 'Error',
        description: 'Failed to save deadline',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (deadlineId: string) => {
    if (!confirm('Are you sure you want to delete this deadline?')) return;

    try {
      const response = await fetch(`/api/applications/${applicationId}/deadlines/${deadlineId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Deadline deleted successfully',
        });
        loadDeadlines();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting deadline:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete deadline',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setFormData({
      type: deadline.type,
      stage: deadline.stage,
      date: deadline.date.split('T')[0],
      time: deadline.time || '23:59',
      timezone: deadline.timezone,
      notes: deadline.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      application: 'Application',
      transcript: 'Transcript',
      lor: 'Letter of Recommendation',
      interview_response: 'Interview Response',
      decision: 'Decision',
      enrollment_deposit: 'Enrollment Deposit',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      early_decision: 'Early Decision',
      early_action: 'Early Action',
      regular: 'Regular',
      rolling: 'Rolling',
      priority: 'Priority',
    };
    return labels[stage] || stage;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deadlines</CardTitle>
            <CardDescription>Track all important dates for this application</CardDescription>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Deadline
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingDeadline ? 'Edit Deadline' : 'Add New Deadline'}
                </DialogTitle>
                <DialogDescription>
                  Set up important dates and get reminders
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Deadline Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application">Application</SelectItem>
                      <SelectItem value="transcript">Transcript</SelectItem>
                      <SelectItem value="lor">Letter of Recommendation</SelectItem>
                      <SelectItem value="interview_response">Interview Response</SelectItem>
                      <SelectItem value="decision">Decision</SelectItem>
                      <SelectItem value="enrollment_deposit">Enrollment Deposit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData({ ...formData, stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early_decision">Early Decision</SelectItem>
                      <SelectItem value="early_action">Early Action</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="rolling">Rolling</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingDeadline(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDeadline ? 'Update' : 'Create'} Deadline
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No deadlines set yet</p>
            <p className="text-sm mt-1">Add your first deadline to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{getTypeLabel(deadline.type)}</Badge>
                    <Badge variant="secondary">{getStageLabel(deadline.stage)}</Badge>
                    {deadline.isExtended && (
                      <Badge variant="default">Extended</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {formatInUserTimezone(deadline.date, 'PPp')}
                  </div>
                  {deadline.notes && (
                    <p className="text-sm text-gray-500 mt-1">{deadline.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <DeadlineCountdown deadline={deadline.date} showBadge compact />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(deadline)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(deadline.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
