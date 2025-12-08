'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Linkedin,
  Briefcase,
  GraduationCap,
  Award,
  Lightbulb,
  X,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseLinkedInPDF, cleanLinkedInData } from '@/lib/linkedin-parser';
import { Resume } from '@/types/resume';
import toast from 'react-hot-toast';

interface LinkedInImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: Partial<Resume>, mode: 'merge' | 'replace') => void;
}

type ImportStep = 'upload' | 'parsing' | 'preview' | 'complete';

export function LinkedInImport({
  open,
  onOpenChange,
  onImport,
}: LinkedInImportProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleParse = async () => {
    if (!file) return;

    setStep('parsing');
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Parse PDF
      const data = await parseLinkedInPDF(file);
      const cleanedData = cleanLinkedInData(data);

      clearInterval(progressInterval);
      setProgress(100);

      // Wait a bit to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      setParsedData(cleanedData);
      setStep('preview');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to parse PDF. Please try again.'
      );
      setStep('upload');
      toast.error('Failed to parse LinkedIn PDF');
    }
  };

  const handleImport = () => {
    if (!parsedData) return;

    // Convert parsed data to Resume format
    const resumeData: Partial<Resume> = {
      summary: parsedData.summary,
      experience: parsedData.experience.map((exp: any) => ({
        ...exp,
        id: exp.id || `exp-${Date.now()}-${Math.random()}`,
        current: exp.current || false,
        achievements: exp.achievements || [],
      })),
      education: parsedData.education.map((edu: any) => ({
        ...edu,
        id: edu.id || `edu-${Date.now()}-${Math.random()}`,
      })),
      skills: parsedData.skills.map((skill: any) => ({
        ...skill,
        id: skill.id || `skill-${Date.now()}-${Math.random()}`,
      })),
      certifications: parsedData.certifications.map((cert: any) => ({
        ...cert,
        id: cert.id || `cert-${Date.now()}-${Math.random()}`,
      })),
    };

    onImport(resumeData, importMode);
    setStep('complete');

    // Show success message
    toast.success(
      importMode === 'merge'
        ? 'LinkedIn data merged successfully!'
        : 'Resume replaced with LinkedIn data!'
    );

    // Close after a delay
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setParsedData(null);
    setProgress(0);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Linkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Import from LinkedIn</DialogTitle>
              <DialogDescription>
                Upload your LinkedIn PDF export to automatically populate your resume
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <>
            <div className="space-y-4 py-4">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  How to export your LinkedIn profile:
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Go to LinkedIn Settings & Privacy</li>
                  <li>Click on &quot;Data Privacy&quot;</li>
                  <li>Select &quot;Get a copy of your data&quot;</li>
                  <li>Choose &quot;Profile&quot; and download as PDF</li>
                </ol>
                <a
                  href="https://www.linkedin.com/help/linkedin/answer/a566336"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Learn more
                </a>
              </div>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary',
                  error && 'border-red-500'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  {file ? (
                    <>
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                        <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setError(null);
                        }}
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-full bg-primary/10">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-sm font-medium">
                        {isDragActive
                          ? 'Drop your LinkedIn PDF here'
                          : 'Drag & drop your LinkedIn PDF'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse (max 10MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleParse} disabled={!file}>
                Parse PDF
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Parsing Step */}
        {step === 'parsing' && (
          <div className="space-y-4 py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10 animate-pulse">
                <Linkedin className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Parsing LinkedIn Data...
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Extracting your professional information
                </p>
                <Progress value={progress} className="w-64 mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && parsedData && (
          <>
            <ScrollArea className="max-h-[50vh]">
              <Tabs defaultValue="experience" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="experience" className="gap-1">
                    <Briefcase className="h-4 w-4" />
                    Experience
                    <Badge variant="secondary" className="ml-1">
                      {parsedData.experience?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="education" className="gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Education
                    <Badge variant="secondary" className="ml-1">
                      {parsedData.education?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="gap-1">
                    <Lightbulb className="h-4 w-4" />
                    Skills
                    <Badge variant="secondary" className="ml-1">
                      {parsedData.skills?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="certifications" className="gap-1">
                    <Award className="h-4 w-4" />
                    Certs
                    <Badge variant="secondary" className="ml-1">
                      {parsedData.certifications?.length || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="experience" className="space-y-3 mt-4">
                  {parsedData.experience?.map((exp: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{exp.position}</h4>
                          <p className="text-sm text-muted-foreground">
                            {exp.company}
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        {exp.location && ` • ${exp.location}`}
                      </div>
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs">
                          {exp.achievements.slice(0, 2).map((achievement: string, i: number) => (
                            <li key={i} className="text-muted-foreground">
                              • {achievement}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="education" className="space-y-3 mt-4">
                  {parsedData.education?.map((edu: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{edu.degree}</h4>
                          <p className="text-sm text-muted-foreground">
                            {edu.institution}
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {edu.field && `${edu.field} • `}
                        {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="skills" className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills?.map((skill: any, index: number) => (
                      <Badge key={index} variant="secondary">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="certifications" className="space-y-3 mt-4">
                  {parsedData.certifications?.map((cert: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-card"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold">{cert.name}</h4>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cert.issuer} • {cert.date}
                      </p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </ScrollArea>

            {/* Import Mode Selection */}
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-3 block">
                Import Mode
              </Label>
              <RadioGroup value={importMode} onValueChange={(v: any) => setImportMode(v)}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge" className="font-normal cursor-pointer">
                    <span className="font-semibold">Merge</span> - Add LinkedIn data to existing resume
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="font-normal cursor-pointer">
                    <span className="font-semibold">Replace</span> - Replace current resume with LinkedIn data
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleImport}>
                Import to Resume
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Your LinkedIn data has been successfully imported
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
