'use client';

import React, { useState } from 'react';
import { Upload, FileText, FileJson, FileUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTemplateCategories } from '@/lib/templates/registry';
import { IndustryCategory } from '@/types/resume';
import { useRouter } from 'next/navigation';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

type ImportType = 'json' | 'linkedin' | 'pdf' | 'docx';
type ImportStatus = 'idle' | 'uploading' | 'success' | 'error';

export function ImportDialog({ open, onOpenChange, userId = 'demo-user' }: ImportDialogProps) {
  const router = useRouter();
  const [importType, setImportType] = useState<ImportType>('json');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('generic-ats-simple');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const templateCategories = getTemplateCategories();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes: Record<ImportType, string[]> = {
      json: ['.json', 'application/json'],
      linkedin: ['.zip', 'application/zip', 'application/x-zip-compressed'],
      pdf: ['.pdf', 'application/pdf'],
      docx: ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };

    const extension = file.name.toLowerCase().split('.').pop();
    const isValid = validTypes[importType].some(type =>
      type.startsWith('.') ? extension === type.slice(1) : file.type === type
    );

    if (!isValid) {
      setErrorMessage(`Invalid file type. Expected ${validTypes[importType].join(', ')}`);
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file');
      return;
    }

    setStatus('uploading');
    setErrorMessage('');
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', importType);
      formData.append('userId', userId);
      formData.append('template', selectedTemplate);

      const response = await fetch('/api/resume/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        if (data.warnings && data.warnings.length > 0) {
          setWarnings(data.warnings);
        }

        // Redirect to editor after 2 seconds
        setTimeout(() => {
          router.push(`/dashboard/document-builder/resume/editor-v2?id=${data.resume._id}`);
          onOpenChange(false);
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Import failed');
        if (data.warnings) {
          setWarnings(data.warnings);
        }
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to upload file. Please try again.');
      console.error('Import error:', error);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setStatus('idle');
    setErrorMessage('');
    setWarnings([]);
  };

  const getAcceptedFiles = () => {
    const accepts: Record<ImportType, string> = {
      json: '.json',
      linkedin: '.zip',
      pdf: '.pdf',
      docx: '.docx',
    };
    return accepts[importType];
  };

  const getImportInstructions = () => {
    const instructions: Record<ImportType, { title: string; steps: string[] }> = {
      json: {
        title: 'JSON Resume Format',
        steps: [
          'Use the standard JSON Resume format (jsonresume.org)',
          'Include all sections: basics, work, education, skills',
          'File will be parsed and imported automatically',
        ],
      },
      linkedin: {
        title: 'LinkedIn Data Export',
        steps: [
          'Go to LinkedIn Settings & Privacy',
          'Click "Get a copy of your data"',
          'Request "Download larger data archive"',
          'Download the ZIP file when ready',
          'Upload the entire ZIP file here',
        ],
      },
      pdf: {
        title: 'PDF Resume',
        steps: [
          'Upload your existing resume in PDF format',
          'Basic text will be extracted automatically',
          'Review and verify all imported data',
          'Manual adjustments may be needed',
        ],
      },
      docx: {
        title: 'Word Document',
        steps: [
          'Upload your resume in DOCX format',
          'Text and structure will be extracted',
          'Review all imported sections',
          'Coming soon - full support',
        ],
      },
    };
    return instructions[importType];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Resume</DialogTitle>
          <DialogDescription>
            Import your existing resume from various formats
          </DialogDescription>
        </DialogHeader>

        <Tabs value={importType} onValueChange={(v) => { setImportType(v as ImportType); resetDialog(); }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="json">
              <FileJson className="w-4 h-4 mr-2" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="linkedin">
              <FileUp className="w-4 h-4 mr-2" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="docx">
              <FileText className="w-4 h-4 mr-2" />
              DOCX
            </TabsTrigger>
          </TabsList>

          <TabsContent value={importType} className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{getImportInstructions().title}</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                {getImportInstructions().steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Select Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templateCategories.map((category) => (
                    <React.Fragment key={category.category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {category.category.toUpperCase()}
                      </div>
                      {category.templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} - ATS: {template.atsScore}%
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose a template to format your imported resume
              </p>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {status === 'idle' ? (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">
                        Drag and drop your file here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse
                      </p>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept={getAcceptedFiles()}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Select File
                      </Button>
                    </>
                  )}
                </>
              ) : status === 'uploading' ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                  <p className="font-medium">Importing resume...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your file
                  </p>
                </div>
              ) : status === 'success' ? (
                <div className="space-y-4">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
                  <p className="font-medium">Import successful!</p>
                  <p className="text-sm text-muted-foreground">
                    Redirecting to editor...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                  <p className="font-medium">Import failed</p>
                  <Button variant="outline" onClick={resetDialog}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            {status === 'idle' && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile}
                >
                  Import Resume
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
