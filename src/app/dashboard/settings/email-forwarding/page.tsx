'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Info,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';
import { formatInUserTimezone } from '@/lib/utils/timezone';

interface ParsedEmail {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  detectedStatus: string;
  confidence: number;
  applied: boolean;
  applicationId?: string;
  universityName?: string;
}

export default function EmailForwardingPage() {
  const [forwardingEmail, setForwardingEmail] = useState('');
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const [testEmail, setTestEmail] = useState({
    from: 'admissions@university.edu',
    subject: 'Application Status Update',
    body: '',
  });

  useEffect(() => {
    loadForwardingSetup();
  }, []);

  const loadForwardingSetup = async () => {
    try {
      setLoading(true);
      // Generate unique forwarding email for user
      const userId = 'user123'; // Get from auth
      setForwardingEmail(`applications+${userId}@edulen.app`);

      // Load recent parsed emails
      const response = await fetch('/api/email-parsing/history');
      const result = await response.json();

      if (result.success) {
        setParsedEmails(result.data);
      }
    } catch (error) {
      console.error('Error loading setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(forwardingEmail);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Forwarding email address copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestEmail = async () => {
    if (!testEmail.from || !testEmail.subject || !testEmail.body) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTesting(true);
      const response = await fetch('/api/email-parsing/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEmail),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: `Detected status: ${result.data.detectedStatus} (${Math.round(
            result.data.confidence * 100
          )}% confidence)`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast({
        title: 'Error',
        description: 'Failed to parse test email',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge className="bg-green-100 text-green-700">
          {Math.round(confidence * 100)}% High
        </Badge>
      );
    } else if (confidence >= 0.6) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          {Math.round(confidence * 100)}% Medium
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-700">
          {Math.round(confidence * 100)}% Low
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading setup...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Email Forwarding Setup</h1>
          </div>
          <p className="text-gray-600">
            Automatically parse university emails and update application statuses
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Automatic Updates</p>
                  <p className="text-sm text-gray-600">Status updates in real-time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI-Powered</p>
                  <p className="text-sm text-gray-600">85%+ accuracy rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Secure</p>
                  <p className="text-sm text-gray-600">Encrypted processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forwarding Email */}
        <Card>
          <CardHeader>
            <CardTitle>Your Forwarding Email</CardTitle>
            <CardDescription>
              Forward university emails to this address to automatically track status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={forwardingEmail}
                readOnly
                className="font-mono text-blue-600 bg-blue-50"
              />
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-2">How it works:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Set up email forwarding in your email client</li>
                    <li>Our AI parses the email content and detects status changes</li>
                    <li>Applications are automatically updated when confidence is ≥80%</li>
                    <li>You'll receive a notification for each update</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to set up automatic email forwarding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="gmail">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Gmail</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        1
                      </div>
                      <p className="text-gray-700">
                        Open Gmail and click the gear icon → See all settings
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        2
                      </div>
                      <p className="text-gray-700">
                        Go to "Filters and Blocked Addresses" tab → Create a new filter
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        3
                      </div>
                      <p className="text-gray-700">
                        In "From" field, enter university email addresses (e.g., @university.edu)
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        4
                      </div>
                      <p className="text-gray-700">
                        Click "Create filter" → Check "Forward it to" → Add:{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded">{forwardingEmail}</code>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        5
                      </div>
                      <p className="text-gray-700">Click "Create filter" to save</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="outlook">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Outlook / Hotmail</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        1
                      </div>
                      <p className="text-gray-700">
                        Click the gear icon → View all Outlook settings
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        2
                      </div>
                      <p className="text-gray-700">Go to "Mail" → "Rules"</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        3
                      </div>
                      <p className="text-gray-700">
                        Click "Add new rule" → Name it "Forward University Emails"
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        4
                      </div>
                      <p className="text-gray-700">
                        Add condition: "From" contains university email domain
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        5
                      </div>
                      <p className="text-gray-700">
                        Add action: "Forward to" →{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded">{forwardingEmail}</code>
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="apple">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Apple Mail</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        1
                      </div>
                      <p className="text-gray-700">
                        Open Mail → Preferences → Rules
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        2
                      </div>
                      <p className="text-gray-700">Click "Add Rule"</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        3
                      </div>
                      <p className="text-gray-700">
                        Set condition: "From" contains university email
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        4
                      </div>
                      <p className="text-gray-700">
                        Set action: "Redirect Message" to{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded">{forwardingEmail}</code>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        5
                      </div>
                      <p className="text-gray-700">Click OK to save the rule</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Test Email Parser */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test Email Parser
            </CardTitle>
            <CardDescription>
              Test how our AI will parse a sample email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-from">From Address</Label>
                <Input
                  id="test-from"
                  placeholder="admissions@university.edu"
                  value={testEmail.from}
                  onChange={(e) => setTestEmail({ ...testEmail, from: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="test-subject">Subject</Label>
                <Input
                  id="test-subject"
                  placeholder="Application Status Update"
                  value={testEmail.subject}
                  onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="test-body">Email Body</Label>
                <Textarea
                  id="test-body"
                  placeholder="Dear Applicant, We are pleased to inform you that you have been accepted..."
                  rows={6}
                  value={testEmail.body}
                  onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
                />
              </div>

              <Button onClick={handleTestEmail} disabled={testing}>
                {testing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Test Parser
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Parsed Emails */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Parsed Emails</CardTitle>
                <CardDescription>
                  Emails that have been automatically processed
                </CardDescription>
              </div>
              <Badge variant="outline">{parsedEmails.length} Total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {parsedEmails.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No parsed emails yet</p>
                <p className="text-sm mt-1">Set up forwarding and emails will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {parsedEmails.map((email) => (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{email.subject}</p>
                          {email.applied ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Applied
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Applied
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">From: {email.from}</p>
                        {email.universityName && (
                          <p className="text-sm text-gray-600">University: {email.universityName}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {email.detectedStatus}
                        </Badge>
                        <br />
                        {getConfidenceBadge(email.confidence)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatInUserTimezone(email.receivedAt, 'PPp')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
