'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
  Mail,
  User,
  TrendingUp,
  Activity,
  Sparkles,
} from 'lucide-react';
import { formatInUserTimezone } from '@/lib/utils/timezone';

interface StatusUpdateModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

interface StatusHistory {
  id: string;
  applicationId: string;
  oldStatus: string;
  newStatus: string;
  notes?: string;
  source: string;
  timestamp: string;
  notificationSent: boolean;
}

interface StatusMetrics {
  totalUpdates: number;
  firstUpdate: string;
  lastUpdate: string;
  currentStatus: string;
  averageTimePerStage: Record<string, number>;
}

export default function StatusUpdateModal({
  applicationId,
  isOpen,
  onClose,
  onStatusUpdated,
}: StatusUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [metrics, setMetrics] = useState<StatusMetrics | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    source: 'manual',
  });

  useEffect(() => {
    if (isOpen) {
      loadStatusHistory();
    }
  }, [isOpen, applicationId]);

  const loadStatusHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/applications/${applicationId}/status`);
      const result = await response.json();

      if (result.success) {
        setStatusHistory(result.data.history);
        setMetrics(result.data.metrics);
        // Set current status as default
        if (result.data.metrics.currentStatus) {
          setFormData((prev) => ({
            ...prev,
            status: result.data.metrics.currentStatus,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading status history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load status history',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.status) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Application status updated successfully',
        });
        setFormData({ status: '', notes: '', source: 'manual' });
        loadStatusHistory();
        onStatusUpdated?.();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'under_review':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'interview_scheduled':
        return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'waitlisted':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'submitted':
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
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
      case 'waitlisted':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'email_parsing':
        return <Mail className="h-4 w-4 text-orange-600" />;
      case 'portal_scrape':
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'ai_detection':
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'email_parsing':
        return 'Email Parsing';
      case 'portal_scrape':
        return 'Portal Scrape';
      case 'ai_detection':
        return 'AI Detection';
      default:
        return 'Manual';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Update Application Status
          </DialogTitle>
          <DialogDescription>
            Update the current status and view the complete history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metrics Overview */}
          {metrics && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Updates</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalUpdates}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Status</p>
                <Badge variant="outline" className={getStatusColor(metrics.currentStatus)}>
                  {metrics.currentStatus.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatInUserTimezone(metrics.lastUpdate, 'PP')}
                </p>
              </div>
            </div>
          )}

          {/* Update Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details about this status update..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </form>

          <Separator />

          {/* Status Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status History</h3>
              <Badge variant="outline">{statusHistory.length} Updates</Badge>
            </div>

            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading history...</p>
              </div>
            ) : statusHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No status history yet</p>
                <p className="text-sm mt-1">Updates will appear here</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Timeline Items */}
                <div className="space-y-6">
                  {statusHistory.map((item, index) => (
                    <div key={item.id} className="relative flex gap-4">
                      {/* Timeline Dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                          }`}
                        >
                          {getStatusIcon(item.newStatus)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getStatusColor(item.newStatus)}
                              >
                                {item.newStatus.replace('_', ' ')}
                              </Badge>
                              {item.oldStatus && (
                                <>
                                  <span className="text-gray-400">←</span>
                                  <Badge variant="outline" className="text-gray-600">
                                    {item.oldStatus.replace('_', ' ')}
                                  </Badge>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getSourceIcon(item.source)}
                              <span className="text-xs text-gray-500">
                                {getSourceLabel(item.source)}
                              </span>
                            </div>
                          </div>

                          {item.notes && (
                            <p className="text-sm text-gray-700 mb-2">{item.notes}</p>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                            <span>
                              {formatInUserTimezone(item.timestamp, 'PPp')}
                            </span>
                            {item.notificationSent && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="h-3 w-3 mr-1" />
                                Notified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Average Time Per Stage */}
          {metrics && Object.keys(metrics.averageTimePerStage).length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Average Time Per Stage
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(metrics.averageTimePerStage).map(([stage, days]) => (
                    <div key={stage} className="p-3 border rounded-lg">
                      <p className="text-sm text-gray-600 capitalize mb-1">
                        {stage.replace('_', ' ')}
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {days.toFixed(1)} days
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
