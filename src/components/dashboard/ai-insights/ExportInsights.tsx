'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AIInsights, ExportOptions } from '@/types/insights';
import { Download, Mail, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportInsightsProps {
  insights: AIInsights;
  userId: string;
  onClose: () => void;
}

export function ExportInsights({ insights, userId, onClose }: ExportInsightsProps) {
  const [format, setFormat] = useState<'pdf' | 'json'>('pdf');
  const [email, setEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [sections, setSections] = useState({
    overview: true,
    strengths: true,
    weaknesses: true,
    recommendations: true,
    facultyMatches: true,
    timeline: true,
    charts: true,
  });

  const handleToggleSection = (section: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExport = async () => {
    setIsExporting(true);

    const exportOptions: ExportOptions = {
      format,
      includeSections: sections,
      emailTo: sendEmail ? email : undefined,
    };

    try {
      const response = await fetch('/api/insights/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportOptions),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'pdf') {
        // Download PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-insights-${userId}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Insights exported successfully!');
      } else {
        // Download JSON
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-insights-${userId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Insights exported successfully!');
      }

      if (sendEmail && email) {
        toast.success('Report will be sent to your email shortly');
      }

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export insights. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Export AI Insights
          </DialogTitle>
          <DialogDescription>
            Choose what to include in your insights report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="flex gap-3">
              <Button
                variant={format === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFormat('pdf')}
                className="flex-1 gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF Report
              </Button>
              <Button
                variant={format === 'json' ? 'default' : 'outline'}
                onClick={() => setFormat('json')}
                className="flex-1 gap-2"
              >
                <FileText className="h-4 w-4" />
                JSON Data
              </Button>
            </div>
          </div>

          {/* Sections to Include */}
          <div className="space-y-3">
            <Label>Sections to Include</Label>
            <div className="space-y-2">
              {Object.entries(sections).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={() => handleToggleSection(key as keyof typeof sections)}
                  />
                  <label
                    htmlFor={key}
                    className="text-sm text-gray-700 dark:text-gray-300 capitalize cursor-pointer"
                  >
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Email Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <label
                htmlFor="sendEmail"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Email me a copy
              </label>
            </div>

            {sendEmail && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
