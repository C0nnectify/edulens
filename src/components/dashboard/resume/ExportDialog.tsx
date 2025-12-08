'use client';

import React, { useState } from 'react';
import { Download, FileText, FileJson, File, Loader2, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Resume } from '@/types/resume';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: Resume;
}

type ExportFormat = 'json' | 'jsonresume' | 'txt' | 'pdf' | 'docx';
type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export function ExportDialog({ open, onOpenChange, resume }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const formatOptions = [
    {
      value: 'json',
      label: 'JSON (Native)',
      description: 'Full resume data in native format',
      icon: FileJson,
      available: true,
    },
    {
      value: 'jsonresume',
      label: 'JSON Resume',
      description: 'Standard jsonresume.org format',
      icon: FileJson,
      available: true,
    },
    {
      value: 'txt',
      label: 'Plain Text',
      description: 'Ultra ATS-safe plain text format',
      icon: File,
      available: true,
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Professional PDF document',
      icon: FileText,
      available: false,
      comingSoon: true,
    },
    {
      value: 'docx',
      label: 'Word Document',
      description: 'Editable DOCX format',
      icon: FileText,
      available: false,
      comingSoon: true,
    },
  ];

  const handleExport = async () => {
    setStatus('exporting');
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/resume/${resume.id || resume._id}/export?format=${format}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `resume.${format}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('success');
      setTimeout(() => {
        onOpenChange(false);
        setStatus('idle');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to export resume');
    }
  };

  const selectedOption = formatOptions.find((opt) => opt.value === format);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Resume</DialogTitle>
          <DialogDescription>Choose a format to export your resume</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <div className="space-y-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`relative flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                      format === option.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    } ${!option.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => option.available && setFormat(option.value as ExportFormat)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} disabled={!option.available} className="mt-1" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <Label htmlFor={option.value} className={`font-semibold ${!option.available ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          {option.label}
                        </Label>
                        {option.comingSoon && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
          {selectedOption && (
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-2">Export Details</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Format:</span><span className="font-medium">{selectedOption.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Resume:</span><span className="font-medium">{resume.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Template:</span><span className="font-medium">{resume.template}</span></div>
                {resume.metadata?.atsScore && (
                  <div className="flex justify-between"><span className="text-muted-foreground">ATS Score:</span><span className="font-medium">{resume.metadata.atsScore}%</span></div>
                )}
              </div>
            </div>
          )}
          {errorMessage && (<Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>)}
          {status === 'exporting' && (<div className="flex items-center justify-center gap-2 p-4"><Loader2 className="w-5 h-5 animate-spin" /><span>Exporting resume...</span></div>)}
          {status === 'success' && (<div className="flex items-center justify-center gap-2 p-4 text-green-600"><CheckCircle className="w-5 h-5" /><span>Export successful!</span></div>)}
          {status === 'idle' && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleExport} disabled={!selectedOption?.available}><Download className="w-4 h-4 mr-2" />Export {selectedOption?.label}</Button>
            </div>
          )}
          {status === 'error' && (<div className="flex justify-end"><Button onClick={() => setStatus('idle')}>Try Again</Button></div>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
