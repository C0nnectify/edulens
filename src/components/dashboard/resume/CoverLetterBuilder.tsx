'use client';

import { useState, useEffect } from 'react';
import { Resume } from '@/types/resume';
import { CoverLetter, CoverLetterTemplate } from '@/types/cover-letter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CoverLetterBuilderProps {
  resume: Resume;
  initialLetter?: Partial<CoverLetter>;
  onSave?: (letter: CoverLetter) => void;
  className?: string;
}

const greetingTemplates = [
  'Dear Hiring Manager,',
  'Dear {CompanyName} Team,',
  'Dear {RecipientName},',
  'To Whom It May Concern,',
  'Hello,',
];

const openingTemplates = [
  'I am writing to express my strong interest in the {JobTitle} position at {CompanyName}. With my background in {Field} and proven track record of {Achievement}, I am confident I would be a valuable addition to your team.',
  'I am excited to apply for the {JobTitle} role at {CompanyName}. As a {ProfessionalTitle} with {Years} years of experience, I am eager to contribute my skills and expertise to your organization.',
  'As a passionate {ProfessionalTitle}, I was thrilled to discover the {JobTitle} opening at {CompanyName}. My experience in {Skills} aligns perfectly with your requirements.',
];

const closingTemplates = [
  'Thank you for considering my application. I look forward to the opportunity to discuss how my experience and skills can contribute to {CompanyName}\'s continued success. I am available for an interview at your convenience.',
  'I appreciate your time and consideration. I am enthusiastic about the possibility of joining {CompanyName} and would welcome the chance to discuss my qualifications further.',
  'I am excited about the opportunity to bring my expertise to {CompanyName}. Thank you for your consideration, and I look forward to hearing from you soon.',
];

const signatureTemplates = [
  'Sincerely,',
  'Best regards,',
  'Respectfully,',
  'Kind regards,',
  'Warm regards,',
];

export function CoverLetterBuilder({
  resume,
  initialLetter,
  onSave,
  className,
}: CoverLetterBuilderProps) {
  const [letter, setLetter] = useState<Partial<CoverLetter>>(() => ({
    resumeId: resume.id || '',
    userId: resume.userId,
    senderName: resume.personalInfo.fullName,
    senderEmail: resume.personalInfo.email,
    senderPhone: resume.personalInfo.phone,
    companyName: '',
    date: new Date(),
    greeting: 'Dear Hiring Manager,',
    opening: '',
    body: ['', ''],
    closing: '',
    signatureText: 'Sincerely,',
    signatureName: resume.personalInfo.fullName,
    template: CoverLetterTemplate.PROFESSIONAL,
    ...initialLetter,
  }));

  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-fill from resume
  useEffect(() => {
    if (resume) {
      setLetter((prev) => ({
        ...prev,
        senderName: resume.personalInfo.fullName,
        senderEmail: resume.personalInfo.email,
        senderPhone: resume.personalInfo.phone,
        signatureName: resume.personalInfo.fullName,
      }));
    }
  }, [resume]);

  const handleUpdate = (field: string, value: any) => {
    setLetter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBodyUpdate = (index: number, value: string) => {
    setLetter((prev) => {
      const newBody = [...(prev.body || ['', ''])];
      newBody[index] = value;
      return { ...prev, body: newBody };
    });
  };

  const addBodyParagraph = () => {
    setLetter((prev) => ({
      ...prev,
      body: [...(prev.body || []), ''],
    }));
  };

  const removeBodyParagraph = (index: number) => {
    setLetter((prev) => ({
      ...prev,
      body: (prev.body || []).filter((_, i) => i !== index),
    }));
  };

  const applyTemplate = (field: string, template: string) => {
    // Replace placeholders
    let content = template;
    content = content.replace('{CompanyName}', letter.companyName || '[Company Name]');
    content = content.replace('{JobTitle}', letter.jobTitle || '[Job Title]');
    content = content.replace('{RecipientName}', letter.recipientName || '[Recipient Name]');
    content = content.replace('{Field}', resume.experience[0]?.position || '[Your Field]');
    content = content.replace('{Achievement}', resume.experience[0]?.achievements?.[0] || '[Your Achievement]');
    content = content.replace('{ProfessionalTitle}', resume.personalInfo.professionalTitle || '[Your Title]');
    content = content.replace('{Years}', calculateYearsOfExperience().toString());
    content = content.replace('{Skills}', resume.skills.slice(0, 3).map(s => s.name).join(', '));

    handleUpdate(field, content);
  };

  const calculateYearsOfExperience = (): number => {
    if (!resume.experience || resume.experience.length === 0) return 0;

    const firstJob = resume.experience[resume.experience.length - 1];
    const startYear = new Date(firstJob.startDate).getFullYear();
    const currentYear = new Date().getFullYear();

    return currentYear - startYear;
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate content based on resume
    const opening = `I am writing to express my strong interest in the ${letter.jobTitle || 'position'} at ${letter.companyName}. With ${calculateYearsOfExperience()} years of experience in ${resume.experience[0]?.position || 'my field'} and a proven track record of ${resume.experience[0]?.achievements?.[0] || 'delivering results'}, I am confident I would be a valuable addition to your team.`;

    const bodyParagraphs = [
      `In my current role at ${resume.experience[0]?.company || 'my current company'}, I have successfully ${resume.experience[0]?.achievements?.[0]?.toLowerCase() || 'contributed to various projects'}. My expertise in ${resume.skills.slice(0, 3).map(s => s.name).join(', ')} has enabled me to deliver exceptional results and drive innovation.`,
      `I am particularly excited about this opportunity at ${letter.companyName} because of your commitment to excellence and innovation. I believe my background in ${resume.experience[0]?.position || 'the field'} and my passion for ${resume.skills[0]?.name || 'my work'} make me an ideal candidate for this position.`,
    ];

    const closing = `Thank you for considering my application. I look forward to the opportunity to discuss how my experience and skills can contribute to ${letter.companyName}'s continued success. I am available for an interview at your convenience.`;

    setLetter((prev) => ({
      ...prev,
      opening,
      body: bodyParagraphs,
      closing,
    }));

    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    const fullLetter = formatFullLetter();
    navigator.clipboard.writeText(fullLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFullLetter = (): string => {
    const lines: string[] = [];

    // Sender info
    lines.push(letter.senderName || '');
    if (letter.senderEmail) lines.push(letter.senderEmail);
    if (letter.senderPhone) lines.push(letter.senderPhone);
    if (letter.senderAddress) lines.push(letter.senderAddress);
    lines.push('');

    // Date
    lines.push(format(letter.date || new Date(), 'MMMM dd, yyyy'));
    lines.push('');

    // Recipient
    if (letter.recipientName) lines.push(letter.recipientName);
    if (letter.recipientTitle) lines.push(letter.recipientTitle);
    if (letter.companyName) lines.push(letter.companyName);
    if (letter.companyAddress) lines.push(letter.companyAddress);
    lines.push('');

    // Greeting
    lines.push(letter.greeting || '');
    lines.push('');

    // Opening
    lines.push(letter.opening || '');
    lines.push('');

    // Body
    (letter.body || []).forEach((paragraph) => {
      if (paragraph) {
        lines.push(paragraph);
        lines.push('');
      }
    });

    // Closing
    lines.push(letter.closing || '');
    lines.push('');

    // Signature
    lines.push(letter.signatureText || '');
    lines.push(letter.signatureName || '');

    return lines.join('\n');
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...letter,
        id: letter.id || `cl-${Date.now()}`,
        resumeId: resume.id || '',
        userId: resume.userId,
        createdAt: letter.createdAt || new Date(),
        updatedAt: new Date(),
      } as CoverLetter);
    }
  };

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      {/* Editor Panel */}
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Cover Letter Editor
              </CardTitle>
              <CardDescription>
                Create a personalized cover letter
              </CardDescription>
            </div>
            <Button
              onClick={generateWithAI}
              disabled={isGenerating || !letter.companyName || !letter.jobTitle}
              size="sm"
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <Separator />

        <ScrollArea className="h-[calc(100vh-20rem)]">
          <CardContent className="space-y-6 pt-6">
            {/* Job Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Job Information</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      value={letter.companyName}
                      onChange={(e) => handleUpdate('companyName', e.target.value)}
                      placeholder="e.g., Google"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={letter.jobTitle || ''}
                    onChange={(e) => handleUpdate('jobTitle', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      value={letter.recipientName || ''}
                      onChange={(e) => handleUpdate('recipientName', e.target.value)}
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientTitle">Recipient Title</Label>
                    <Input
                      id="recipientTitle"
                      value={letter.recipientTitle || ''}
                      onChange={(e) => handleUpdate('recipientTitle', e.target.value)}
                      placeholder="e.g., Hiring Manager"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Greeting */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Greeting</Label>
                <Select
                  value={letter.greeting}
                  onValueChange={(value) => handleUpdate('greeting', value)}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {greetingTemplates.map((template) => (
                      <SelectItem key={template} value={template}>
                        {template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={letter.greeting}
                onChange={(e) => handleUpdate('greeting', e.target.value)}
              />
            </div>

            {/* Opening Paragraph */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opening Paragraph</Label>
                <Select onValueChange={(value) => applyTemplate('opening', value)}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Use template" />
                  </SelectTrigger>
                  <SelectContent>
                    {openingTemplates.map((template, index) => (
                      <SelectItem key={index} value={template}>
                        Template {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={letter.opening}
                onChange={(e) => handleUpdate('opening', e.target.value)}
                placeholder="Introduce yourself and express your interest in the position..."
                rows={4}
              />
            </div>

            {/* Body Paragraphs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Body Paragraphs</Label>
                <Button
                  onClick={addBodyParagraph}
                  size="sm"
                  variant="outline"
                  disabled={(letter.body?.length || 0) >= 3}
                >
                  Add Paragraph
                </Button>
              </div>
              {(letter.body || []).map((paragraph, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Paragraph {index + 1}
                    </Label>
                    {(letter.body?.length || 0) > 1 && (
                      <Button
                        onClick={() => removeBodyParagraph(index)}
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={paragraph}
                    onChange={(e) => handleBodyUpdate(index, e.target.value)}
                    placeholder={`Body paragraph ${index + 1}...`}
                    rows={4}
                  />
                </div>
              ))}
            </div>

            {/* Closing Paragraph */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Closing Paragraph</Label>
                <Select onValueChange={(value) => applyTemplate('closing', value)}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Use template" />
                  </SelectTrigger>
                  <SelectContent>
                    {closingTemplates.map((template, index) => (
                      <SelectItem key={index} value={template}>
                        Template {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={letter.closing}
                onChange={(e) => handleUpdate('closing', e.target.value)}
                placeholder="Thank the reader and express your enthusiasm..."
                rows={3}
              />
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <Label>Signature</Label>
              <div className="grid gap-2">
                <Select
                  value={letter.signatureText}
                  onValueChange={(value) => handleUpdate('signatureText', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {signatureTemplates.map((template) => (
                      <SelectItem key={template} value={template}>
                        {template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={letter.signatureName}
                  onChange={(e) => handleUpdate('signatureName', e.target.value)}
                  placeholder="Your name"
                />
              </div>
            </div>
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Preview Panel */}
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Preview</CardTitle>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} size="sm" variant="outline">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              {onSave && (
                <Button onClick={handleSave} size="sm">
                  Save
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <ScrollArea className="h-[calc(100vh-20rem)]">
          <CardContent className="pt-6">
            <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-12 space-y-4 text-sm">
              {/* Header */}
              <div className="space-y-1">
                <p className="font-semibold text-base">{letter.senderName}</p>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {letter.senderEmail}
                </p>
                {letter.senderPhone && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {letter.senderPhone}
                  </p>
                )}
              </div>

              {/* Date */}
              <p className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(letter.date || new Date(), 'MMMM dd, yyyy')}
              </p>

              {/* Recipient */}
              {(letter.recipientName || letter.companyName) && (
                <div className="space-y-1 pt-4">
                  {letter.recipientName && <p>{letter.recipientName}</p>}
                  {letter.recipientTitle && (
                    <p className="text-muted-foreground">{letter.recipientTitle}</p>
                  )}
                  {letter.companyName && (
                    <p className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {letter.companyName}
                    </p>
                  )}
                </div>
              )}

              {/* Greeting */}
              <p className="pt-4">{letter.greeting}</p>

              {/* Opening */}
              {letter.opening && <p className="leading-relaxed">{letter.opening}</p>}

              {/* Body */}
              {(letter.body || []).map(
                (paragraph, index) =>
                  paragraph && (
                    <p key={index} className="leading-relaxed">
                      {paragraph}
                    </p>
                  )
              )}

              {/* Closing */}
              {letter.closing && <p className="leading-relaxed">{letter.closing}</p>}

              {/* Signature */}
              <div className="pt-4 space-y-2">
                <p>{letter.signatureText}</p>
                <p className="font-semibold">{letter.signatureName}</p>
              </div>
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
