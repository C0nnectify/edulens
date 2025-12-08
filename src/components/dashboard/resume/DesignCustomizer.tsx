'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Type,
  Layout,
  Sparkles,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Resume, ResumeTemplate, TemplateConfig } from '@/types/resume';
import { cn } from '@/lib/utils';

const TEMPLATE_PRESETS: TemplateConfig[] = [
  {
    id: 'modern',
    name: 'Modern',
    category: ResumeTemplate.MODERN,
    description: 'Clean and contemporary design with subtle accents',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      text: '#1f2937',
      heading: '#111827',
      background: '#ffffff',
      border: '#e5e7eb',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      size: {
        heading: 24,
        subheading: 18,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 1,
      spacing: 'normal',
      sectionOrder: [],
      showIcons: false,
      showDividers: true,
      headerStyle: 'centered',
    },
    atsScore: 95,
  },
  {
    id: 'classic',
    name: 'Classic',
    category: ResumeTemplate.CLASSIC,
    description: 'Traditional format with timeless elegance',
    colors: {
      primary: '#1f2937',
      secondary: '#4b5563',
      text: '#374151',
      heading: '#111827',
      background: '#ffffff',
      border: '#d1d5db',
    },
    fonts: {
      heading: 'Georgia',
      body: 'Georgia',
      size: {
        heading: 22,
        subheading: 16,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 1,
      spacing: 'normal',
      sectionOrder: [],
      showIcons: false,
      showDividers: false,
      headerStyle: 'left',
    },
    atsScore: 100,
  },
  {
    id: 'creative',
    name: 'Creative',
    category: ResumeTemplate.CREATIVE,
    description: 'Bold and expressive for creative professionals',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      text: '#1f2937',
      heading: '#111827',
      background: '#ffffff',
      border: '#e5e7eb',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Poppins',
      size: {
        heading: 26,
        subheading: 18,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 2,
      spacing: 'spacious',
      sectionOrder: [],
      showIcons: true,
      showDividers: true,
      headerStyle: 'split',
    },
    atsScore: 75,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    category: ResumeTemplate.MINIMALIST,
    description: 'Simple and refined with maximum whitespace',
    colors: {
      primary: '#000000',
      secondary: '#6b7280',
      text: '#374151',
      heading: '#000000',
      background: '#ffffff',
      border: '#e5e7eb',
    },
    fonts: {
      heading: 'Helvetica',
      body: 'Helvetica',
      size: {
        heading: 24,
        subheading: 16,
        body: 10,
        small: 8,
      },
    },
    layout: {
      columns: 1,
      spacing: 'spacious',
      sectionOrder: [],
      showIcons: false,
      showDividers: false,
      headerStyle: 'left',
    },
    atsScore: 90,
  },
  {
    id: 'professional',
    name: 'Professional',
    category: ResumeTemplate.PROFESSIONAL,
    description: 'Corporate-friendly and highly readable',
    colors: {
      primary: '#0f172a',
      secondary: '#334155',
      text: '#475569',
      heading: '#0f172a',
      background: '#ffffff',
      border: '#cbd5e1',
    },
    fonts: {
      heading: 'Arial',
      body: 'Arial',
      size: {
        heading: 22,
        subheading: 16,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 1,
      spacing: 'compact',
      sectionOrder: [],
      showIcons: false,
      showDividers: true,
      headerStyle: 'left',
    },
    atsScore: 98,
  },
  {
    id: 'ats-friendly',
    name: 'ATS-Friendly',
    category: ResumeTemplate.ATS_FRIENDLY,
    description: 'Optimized for Applicant Tracking Systems',
    colors: {
      primary: '#000000',
      secondary: '#374151',
      text: '#1f2937',
      heading: '#000000',
      background: '#ffffff',
      border: '#e5e7eb',
    },
    fonts: {
      heading: 'Arial',
      body: 'Arial',
      size: {
        heading: 20,
        subheading: 14,
        body: 11,
        small: 9,
      },
    },
    layout: {
      columns: 1,
      spacing: 'normal',
      sectionOrder: [],
      showIcons: false,
      showDividers: false,
      headerStyle: 'left',
    },
    atsScore: 100,
  },
];

const COLOR_PRESETS = [
  { name: 'Blue', primary: '#3b82f6', secondary: '#8b5cf6' },
  { name: 'Green', primary: '#10b981', secondary: '#06b6d4' },
  { name: 'Purple', primary: '#8b5cf6', secondary: '#ec4899' },
  { name: 'Red', primary: '#ef4444', secondary: '#f97316' },
  { name: 'Slate', primary: '#475569', secondary: '#64748b' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#06b6d4' },
  { name: 'Indigo', primary: '#6366f1', secondary: '#8b5cf6' },
  { name: 'Black', primary: '#000000', secondary: '#374151' },
];

const FONT_OPTIONS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Playfair Display',
  'Montserrat',
  'Open Sans',
];

interface DesignCustomizerProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
}

export default function DesignCustomizer({ resume, onUpdate }: DesignCustomizerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(
    TEMPLATE_PRESETS.find((t) => t.id === resume.template) || TEMPLATE_PRESETS[0]
  );

  const [customColors, setCustomColors] = useState({
    primary: selectedTemplate.colors.primary,
    secondary: selectedTemplate.colors.secondary,
  });

  const [selectedFont, setSelectedFont] = useState(selectedTemplate.fonts.heading);
  const [layoutColumns, setLayoutColumns] = useState<1 | 2>(selectedTemplate.layout.columns);
  const [spacing, setSpacing] = useState(selectedTemplate.layout.spacing);

  const handleTemplateChange = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    setCustomColors({
      primary: template.colors.primary,
      secondary: template.colors.secondary,
    });
    setSelectedFont(template.fonts.heading);
    setLayoutColumns(template.layout.columns);
    setSpacing(template.layout.spacing);

    onUpdate({
      template: template.category,
    });
  };

  const handleColorChange = (colorPreset: typeof COLOR_PRESETS[0]) => {
    setCustomColors({
      primary: colorPreset.primary,
      secondary: colorPreset.secondary,
    });
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Design Customization</h3>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your resume
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">
            <Layout className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="w-4 h-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="w-4 h-4 mr-2" />
            Typography
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid gap-4">
              {TEMPLATE_PRESETS.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      'p-4 cursor-pointer transition-all border-2',
                      selectedTemplate.id === template.id
                        ? 'border-primary shadow-lg'
                        : 'border-transparent hover:border-muted-foreground/20'
                    )}
                    onClick={() => handleTemplateChange(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{template.name}</h4>
                          {selectedTemplate.id === template.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">
                              ATS Score: {template.atsScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: template.colors.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: template.colors.secondary }}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Color Presets</Label>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleColorChange(preset)}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all',
                      customColors.primary === preset.primary
                        ? 'border-primary shadow-md'
                        : 'border-muted hover:border-muted-foreground/20'
                    )}
                  >
                    <div className="flex gap-1 mb-2">
                      <div
                        className="h-8 flex-1 rounded"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="h-8 flex-1 rounded"
                        style={{ backgroundColor: preset.secondary }}
                      />
                    </div>
                    <span className="text-xs font-medium">{preset.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    id="primary-color"
                    type="color"
                    value={customColors.primary}
                    onChange={(e) =>
                      setCustomColors({ ...customColors, primary: e.target.value })
                    }
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <div className="flex-1 px-3 py-2 border rounded bg-muted font-mono text-sm">
                    {customColors.primary}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    id="secondary-color"
                    type="color"
                    value={customColors.secondary}
                    onChange={(e) =>
                      setCustomColors({ ...customColors, secondary: e.target.value })
                    }
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <div className="flex-1 px-3 py-2 border rounded bg-muted font-mono text-sm">
                    {customColors.secondary}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="font-select">Font Family</Label>
              <Select value={selectedFont} onValueChange={handleFontChange}>
                <SelectTrigger id="font-select" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block">Layout</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={layoutColumns === 1 ? 'default' : 'outline'}
                  onClick={() => setLayoutColumns(1)}
                  className="h-auto p-4"
                >
                  <div className="text-center">
                    <Layout className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-medium">Single Column</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Best for ATS
                    </div>
                  </div>
                </Button>
                <Button
                  variant={layoutColumns === 2 ? 'default' : 'outline'}
                  onClick={() => setLayoutColumns(2)}
                  className="h-auto p-4"
                >
                  <div className="text-center">
                    <Layout className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-medium">Two Columns</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Modern look
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="spacing-select">Spacing</Label>
              <Select value={spacing} onValueChange={(val) => setSpacing(val as any)}>
                <SelectTrigger id="spacing-select" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact (fit more content)</SelectItem>
                  <SelectItem value="normal">Normal (balanced)</SelectItem>
                  <SelectItem value="spacious">Spacious (airy layout)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium mb-1">ATS Optimization</h4>
            <p className="text-sm text-muted-foreground">
              {selectedTemplate.name} template has an ATS score of{' '}
              <strong>{selectedTemplate.atsScore}%</strong>. Choose templates with
              higher scores for better compatibility with Applicant Tracking Systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
