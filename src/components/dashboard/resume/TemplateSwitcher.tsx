'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Resume, ResumeTemplate } from '@/types/resume';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Layout,
  Check,
  Sparkles,
  FileText,
  Briefcase,
  Palette,
  Minimize2,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplateSwitcherProps {
  currentTemplate: ResumeTemplate | string;
  onTemplateChange: (template: ResumeTemplate) => void;
  className?: string;
}

interface TemplateOption {
  id: ResumeTemplate;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
  atsScore: number;
  isPremium?: boolean;
  features: string[];
  colorScheme: string;
}

const templates: TemplateOption[] = [
  {
    id: ResumeTemplate.MODERN,
    name: 'Modern',
    description: 'Clean and contemporary design with subtle accents',
    icon: <Sparkles className="h-4 w-4" />,
    preview: 'bg-gradient-to-br from-blue-50 to-purple-50',
    atsScore: 85,
    features: ['Two-column layout', 'Icon support', 'Color accents'],
    colorScheme: 'Blue & Purple',
  },
  {
    id: ResumeTemplate.CLASSIC,
    name: 'Classic',
    description: 'Traditional and professional single-column format',
    icon: <FileText className="h-4 w-4" />,
    preview: 'bg-gradient-to-br from-gray-50 to-gray-100',
    atsScore: 95,
    features: ['Single column', 'Traditional fonts', 'Maximum compatibility'],
    colorScheme: 'Black & White',
  },
  {
    id: ResumeTemplate.ATS_FRIENDLY,
    name: 'ATS-Friendly',
    description: 'Optimized for applicant tracking systems',
    icon: <Briefcase className="h-4 w-4" />,
    preview: 'bg-gradient-to-br from-green-50 to-emerald-50',
    atsScore: 98,
    features: ['Plain text optimized', 'No graphics', 'Machine readable'],
    colorScheme: 'Simple & Clean',
  },
  {
    id: ResumeTemplate.CREATIVE,
    name: 'Creative',
    description: 'Bold and artistic design for creative professionals',
    icon: <Palette className="h-4 w-4" />,
    preview: 'bg-gradient-to-br from-pink-50 to-orange-50',
    atsScore: 70,
    isPremium: true,
    features: ['Unique layout', 'Custom graphics', 'Stand out design'],
    colorScheme: 'Vibrant Colors',
  },
  {
    id: ResumeTemplate.MINIMALIST,
    name: 'Minimalist',
    description: 'Simple and elegant with focus on content',
    icon: <Minimize2 className="h-4 w-4" />,
    preview: 'bg-gradient-to-br from-slate-50 to-zinc-50',
    atsScore: 90,
    features: ['Minimal design', 'Lots of whitespace', 'Easy to read'],
    colorScheme: 'Monochrome',
  },
  {
    id: ResumeTemplate.PROFESSIONAL,
    name: 'Professional',
    description: 'Sophisticated design for senior positions',
    icon: <Star className="h-4 w-4" />,
    preview: 'bg-gradient-to-br from-indigo-50 to-blue-50',
    atsScore: 92,
    isPremium: true,
    features: ['Executive style', 'Premium look', 'Leadership focused'],
    colorScheme: 'Navy & Gold',
  },
];

export function TemplateSwitcher({
  currentTemplate,
  onTemplateChange,
  className,
}: TemplateSwitcherProps) {
  const [open, setOpen] = useState(false);

  const currentTemplateData = templates.find((t) => t.id === currentTemplate);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'gap-2 border-2 hover:border-primary transition-all',
            className
          )}
        >
          <Layout className="h-4 w-4" />
          <span className="hidden sm:inline">Template:</span>
          <span className="font-semibold">{currentTemplateData?.name || 'Modern'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="end">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Choose Template
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Switch templates instantly without losing your data
          </p>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
            {templates.map((template, index) => {
              const isSelected = template.id === currentTemplate;

              return (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onTemplateChange(template.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full text-left rounded-lg border-2 p-4 transition-all hover:shadow-lg',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Preview Box */}
                    <div
                      className={cn(
                        'w-20 h-24 rounded-md shadow-sm border-2 flex items-center justify-center',
                        template.preview,
                        isSelected ? 'border-primary' : 'border-gray-300'
                      )}
                    >
                      <div className="text-2xl">{template.icon}</div>
                    </div>

                    {/* Template Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base">{template.name}</h4>
                          {template.isPremium && (
                            <Badge variant="secondary" className="text-xs">
                              Premium
                            </Badge>
                          )}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="p-1 rounded-full bg-primary text-primary-foreground"
                            >
                              <Check className="h-3 w-3" />
                            </motion.div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              'text-xs font-bold px-2 py-1 rounded',
                              template.atsScore >= 90
                                ? 'bg-green-100 text-green-700'
                                : template.atsScore >= 80
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            )}
                          >
                            ATS: {template.atsScore}%
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {template.features.map((feature) => (
                          <Badge
                            key={feature}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Palette className="h-3 w-3" />
                        {template.colorScheme}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-muted-foreground text-center">
            All templates are fully customizable and your data remains intact when switching
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
