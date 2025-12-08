'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { TemplateConfig, ResumeTemplate } from '@/types/resume';
import { templateApi } from '@/lib/api/resume-api';
import { Check, Palette } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplateSelectorProps {
  currentTemplate: string;
  onSelectTemplate: (template: ResumeTemplate) => void;
}

// Mock templates for now (will be fetched from API)
const MOCK_TEMPLATES: TemplateConfig[] = [
  {
    id: 'modern',
    name: 'Modern',
    category: 'modern' as ResumeTemplate,
    description: 'Clean and contemporary design with bold headers',
    atsScore: 95,
    colors: { primary: '#3b82f6', text: '#1f2937', heading: '#111827', background: '#ffffff' },
    fonts: { heading: 'Inter', body: 'Inter', size: { heading: 24, subheading: 18, body: 11, small: 9 } },
    layout: { columns: 1, spacing: 'normal', sectionOrder: [] },
    features: ['ATS-Friendly', 'Clean Layout', 'Professional'],
  },
  {
    id: 'classic',
    name: 'Classic',
    category: 'classic' as ResumeTemplate,
    description: 'Traditional resume format preferred by recruiters',
    atsScore: 98,
    colors: { primary: '#000000', text: '#333333', heading: '#000000', background: '#ffffff' },
    fonts: { heading: 'Times New Roman', body: 'Times New Roman', size: { heading: 22, subheading: 16, body: 11, small: 9 } },
    layout: { columns: 1, spacing: 'normal', sectionOrder: [] },
    features: ['ATS-Friendly', 'Traditional', 'Conservative'],
  },
  {
    id: 'ats-friendly',
    name: 'ATS-Optimized',
    category: 'ats-friendly' as ResumeTemplate,
    description: 'Maximized for Applicant Tracking Systems',
    atsScore: 100,
    colors: { primary: '#000000', text: '#000000', heading: '#000000', background: '#ffffff' },
    fonts: { heading: 'Arial', body: 'Arial', size: { heading: 20, subheading: 16, body: 11, small: 9 } },
    layout: { columns: 1, spacing: 'normal', sectionOrder: [] },
    features: ['Perfect ATS Score', 'Simple Format', 'Maximum Compatibility'],
  },
  {
    id: 'creative',
    name: 'Creative',
    category: 'creative' as ResumeTemplate,
    description: 'Stand out with a unique, colorful design',
    atsScore: 75,
    colors: { primary: '#8b5cf6', text: '#374151', heading: '#1f2937', background: '#ffffff' },
    fonts: { heading: 'Poppins', body: 'Inter', size: { heading: 26, subheading: 18, body: 11, small: 9 } },
    layout: { columns: 2, spacing: 'spacious', sectionOrder: [] },
    features: ['Eye-Catching', 'Two-Column', 'Modern Fonts'],
    isPremium: true,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    category: 'minimalist' as ResumeTemplate,
    description: 'Less is more - clean and simple design',
    atsScore: 92,
    colors: { primary: '#6b7280', text: '#374151', heading: '#111827', background: '#ffffff' },
    fonts: { heading: 'Inter', body: 'Inter', size: { heading: 22, subheading: 16, body: 10, small: 8 } },
    layout: { columns: 1, spacing: 'compact', sectionOrder: [] },
    features: ['Clean', 'Elegant', 'Space-Efficient'],
  },
  {
    id: 'professional',
    name: 'Professional',
    category: 'professional' as ResumeTemplate,
    description: 'Balanced design for corporate roles',
    atsScore: 96,
    colors: { primary: '#0f172a', text: '#334155', heading: '#0f172a', background: '#ffffff' },
    fonts: { heading: 'Inter', body: 'Inter', size: { heading: 24, subheading: 18, body: 11, small: 9 } },
    layout: { columns: 1, spacing: 'normal', sectionOrder: [] },
    features: ['Professional', 'Balanced', 'Corporate-Ready'],
  },
];

export function TemplateSelector({ currentTemplate, onSelectTemplate }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setTemplates(MOCK_TEMPLATES);
      setLoading(false);
    }, 500);
  }, []);

  const handleSelectTemplate = (template: TemplateConfig) => {
    onSelectTemplate(template.category as ResumeTemplate);
    toast.success(`Template changed to ${template.name}`);
  };

  const getATSColor = (score: number = 0) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Resume Templates
        </CardTitle>
        <CardDescription>
          Choose a template that matches your style and industry
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))
            ) : (
              templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    currentTemplate === template.category ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {template.name}
                          {template.isPremium && (
                            <Badge variant="secondary" className="text-xs">Premium</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                      {currentTemplate === template.category && (
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ATS Score</span>
                      <span className={`font-bold ${getATSColor(template.atsScore)}`}>
                        {template.atsScore}/100
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.features?.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="h-20 border rounded flex items-center justify-center text-xs text-muted-foreground bg-muted/30">
                      Preview
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
