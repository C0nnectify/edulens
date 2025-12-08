'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Mail,
  Shield,
  Send,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ValidationCheck {
  id: string;
  category: string;
  name: string;
  status: 'pass' | 'warning' | 'fail' | 'pending';
  message: string;
  details?: string;
  suggestion?: string;
}

interface ValidationReport {
  overallStatus: 'ready' | 'has_warnings' | 'not_ready';
  completionPercentage: number;
  checks: ValidationCheck[];
  canSubmit: boolean;
  blockers: string[];
  warnings: string[];
}

interface PreSubmissionValidationProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

export default function PreSubmissionValidation({
  applicationId,
  isOpen,
  onClose,
  onSubmit,
}: PreSubmissionValidationProps) {
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const { toast } = useToast();

  const runValidation = async () => {
    try {
      setValidating(true);
      const response = await fetch(`/api/applications/${applicationId}/validate-submission`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setReport(result.data);

        if (result.data.overallStatus === 'not_ready') {
          toast({
            title: 'Validation Failed',
            description: `${result.data.blockers.length} critical issue(s) found`,
            variant: 'destructive',
          });
        } else if (result.data.overallStatus === 'has_warnings') {
          toast({
            title: 'Validation Complete',
            description: `${result.data.warnings.length} warning(s) found`,
          });
        } else {
          toast({
            title: 'All Checks Passed!',
            description: 'Your application is ready to submit',
          });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error running validation:', error);
      toast({
        title: 'Error',
        description: 'Failed to run validation',
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!report?.canSubmit) {
      toast({
        title: 'Cannot Submit',
        description: 'Please resolve all critical issues before submitting',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${applicationId}/submit`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Application submitted successfully',
        });
        onSubmit?.();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'fail':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'documents':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'deadlines':
        return <Clock className="h-5 w-5 text-purple-600" />;
      case 'profile':
        return <Shield className="h-5 w-5 text-green-600" />;
      case 'communication':
        return <Mail className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const groupedChecks = report?.checks.reduce((acc, check) => {
    if (!acc[check.category]) {
      acc[check.category] = [];
    }
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, ValidationCheck[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Pre-Submission Validation
          </DialogTitle>
          <DialogDescription>
            Review all checks before submitting your application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Run Validation Button */}
          {!report && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Submit?
              </h3>
              <p className="text-gray-600 mb-6">
                Run a comprehensive validation check to ensure your application is complete
              </p>
              <Button
                onClick={runValidation}
                disabled={validating}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {validating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Run Validation
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Validation Report */}
          {report && (
            <>
              {/* Overall Status */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 border-2">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Overall Status</p>
                    <Badge
                      className={
                        report.overallStatus === 'ready'
                          ? 'bg-green-100 text-green-700'
                          : report.overallStatus === 'has_warnings'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {report.overallStatus === 'ready' && 'Ready to Submit'}
                      {report.overallStatus === 'has_warnings' && 'Has Warnings'}
                      {report.overallStatus === 'not_ready' && 'Not Ready'}
                    </Badge>
                  </div>
                </Card>

                <Card className="p-4 border-2">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Completion</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {report.completionPercentage}%
                    </p>
                  </div>
                </Card>

                <Card className="p-4 border-2">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Critical Issues</p>
                    <p className="text-3xl font-bold text-red-600">
                      {report.blockers.length}
                    </p>
                  </div>
                </Card>
              </div>

              <Progress value={report.completionPercentage} className="h-2" />

              {/* Critical Blockers */}
              {report.blockers.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-2">
                        Critical Issues ({report.blockers.length})
                      </p>
                      <ul className="space-y-1">
                        {report.blockers.map((blocker, index) => (
                          <li key={index} className="text-sm text-red-700">
                            • {blocker}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-red-600 mt-3 font-medium">
                        You must resolve these issues before submitting.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {report.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900 mb-2">
                        Warnings ({report.warnings.length})
                      </p>
                      <ul className="space-y-1">
                        {report.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-yellow-700">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-yellow-600 mt-3">
                        You can submit with warnings, but we recommend addressing them.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Detailed Checks by Category */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detailed Validation Results
                </h3>

                {groupedChecks &&
                  Object.entries(groupedChecks).map(([category, checks]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {category}
                        </h4>
                        <Badge variant="outline">
                          {checks.filter((c) => c.status === 'pass').length} /{' '}
                          {checks.length} passed
                        </Badge>
                      </div>

                      <div className="space-y-2 pl-7">
                        {checks.map((check) => (
                          <div
                            key={check.id}
                            className="flex items-start gap-3 p-3 border rounded-lg"
                          >
                            {getStatusIcon(check.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-gray-900">{check.name}</p>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(check.status)}
                                >
                                  {check.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">{check.message}</p>
                              {check.details && (
                                <p className="text-sm text-gray-600 mb-1">{check.details}</p>
                              )}
                              {check.suggestion && (
                                <p className="text-sm text-blue-600 mt-2">
                                  💡 {check.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-4 pt-4 border-t">
                <Button variant="outline" onClick={runValidation} disabled={validating}>
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Re-validating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Re-run Validation
                    </>
                  )}
                </Button>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitApplication}
                    disabled={!report.canSubmit || submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg ${className}`}>{children}</div>;
}
