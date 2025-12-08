'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  Info,
  AlertTriangle,
  FileCheck,
  Download,
} from 'lucide-react';
import { formatInUserTimezone } from '@/lib/utils/timezone';

interface DocumentRequirement {
  id: string;
  type: string;
  name: string;
  required: boolean;
  formats: string[];
  maxSizeMB: number;
  maxPages?: number;
  wordCountMin?: number;
  wordCountMax?: number;
  instructions?: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  fileUrl: string;
  uploadedAt: string;
  fileSize?: number;
  validationStatus?: string;
}

interface ChecklistRequirement {
  requirement: DocumentRequirement;
  status: 'missing' | 'uploaded' | 'validated' | 'rejected';
  uploadedDocument?: UploadedDocument;
  validationResults?: Array<{
    type: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    suggestion?: string;
  }>;
}

interface DocumentChecklistProps {
  applicationId: string;
}

export default function DocumentChecklist({ applicationId }: DocumentChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistRequirement[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingRequired, setMissingRequired] = useState<string[]>([]);
  const [missingOptional, setMissingOptional] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<DocumentRequirement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChecklist();
  }, [applicationId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${applicationId}/checklist`);
      const result = await response.json();

      if (result.success) {
        setChecklist(result.data.requirements);
        setCompletionPercentage(result.data.completionPercentage);
        setMissingRequired(result.data.missingRequired);
        setMissingOptional(result.data.missingOptional);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load document checklist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (requirementId: string) => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(requirementId);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('requirementId', requirementId);

      const response = await fetch(`/api/applications/${applicationId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Document uploaded successfully',
        });
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setSelectedRequirement(null);
        loadChecklist();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Document deleted successfully',
        });
        loadChecklist();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'uploaded':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'uploaded':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getValidationIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
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
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Document Checklist
            </CardTitle>
            <CardDescription>
              Track required and optional documents for this application
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{completionPercentage}%</p>
            <p className="text-sm text-gray-600">Complete</p>
          </div>
        </div>
        <Progress value={completionPercentage} className="mt-4" />
      </CardHeader>
      <CardContent>
        {/* Missing Required Documents Alert */}
        {missingRequired.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Missing Required Documents</p>
                <p className="text-sm text-red-700 mt-1">
                  You need to upload {missingRequired.length} required document(s):
                </p>
                <ul className="mt-2 space-y-1">
                  {missingRequired.map((doc, index) => (
                    <li key={index} className="text-sm text-red-700">
                      • {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Document List */}
        <div className="space-y-4">
          {checklist.map((item) => (
            <div
              key={item.requirement.id}
              className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {item.requirement.name}
                    </h3>
                    {item.requirement.required ? (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Optional
                      </Badge>
                    )}
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1.5">{item.status}</span>
                    </Badge>
                  </div>

                  {/* Requirements Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                    <span>Formats: {item.requirement.formats.join(', ')}</span>
                    <span>Max Size: {item.requirement.maxSizeMB} MB</span>
                    {item.requirement.maxPages && (
                      <span>Max Pages: {item.requirement.maxPages}</span>
                    )}
                    {item.requirement.wordCountMax && (
                      <span>
                        Word Count: {item.requirement.wordCountMin || 0} -{' '}
                        {item.requirement.wordCountMax}
                      </span>
                    )}
                  </div>

                  {item.requirement.instructions && (
                    <p className="text-sm text-gray-600 italic">
                      {item.requirement.instructions}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                {item.status === 'missing' ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRequirement(item.requirement);
                      setIsUploadModalOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.uploadedDocument?.fileUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.uploadedDocument!.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Uploaded Document Info */}
              {item.uploadedDocument && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.uploadedDocument.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Uploaded {formatInUserTimezone(item.uploadedDocument.uploadedAt, 'PPp')}
                          {item.uploadedDocument.fileSize &&
                            ` • ${formatFileSize(item.uploadedDocument.fileSize)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Validation Results */}
                  {item.validationResults && item.validationResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {item.validationResults.map((validation, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          {getValidationIcon(validation.status)}
                          <div className="flex-1">
                            <p className="text-gray-900">{validation.message}</p>
                            {validation.suggestion && (
                              <p className="text-gray-600 text-xs mt-1">
                                💡 {validation.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {checklist.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No document requirements set</p>
            <p className="text-sm mt-1">Requirements will appear here once added</p>
          </div>
        )}

        {/* Optional Documents Info */}
        {missingOptional.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Optional Documents</p>
                <p className="text-sm text-blue-700 mt-1">
                  Consider uploading these optional documents to strengthen your application:
                </p>
                <ul className="mt-2 space-y-1">
                  {missingOptional.slice(0, 5).map((doc, index) => (
                    <li key={index} className="text-sm text-blue-700">
                      • {doc}
                    </li>
                  ))}
                  {missingOptional.length > 5 && (
                    <li className="text-sm text-blue-700">
                      • And {missingOptional.length - 5} more...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              {selectedRequirement?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequirement && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-700 mb-2">
                  <strong>Requirements:</strong>
                </p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Formats: {selectedRequirement.formats.join(', ')}</li>
                  <li>• Max Size: {selectedRequirement.maxSizeMB} MB</li>
                  {selectedRequirement.maxPages && (
                    <li>• Max Pages: {selectedRequirement.maxPages}</li>
                  )}
                  {selectedRequirement.wordCountMax && (
                    <li>
                      • Word Count: {selectedRequirement.wordCountMin || 0} -{' '}
                      {selectedRequirement.wordCountMax}
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept={selectedRequirement?.formats.map((f) => `.${f.toLowerCase()}`).join(',')}
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                  setSelectedRequirement(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedRequirement && handleUpload(selectedRequirement.id)}
                disabled={!selectedFile || uploading !== null}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
