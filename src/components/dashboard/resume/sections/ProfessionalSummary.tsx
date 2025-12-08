'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProfessionalSummaryProps {
  data: string;
  onChange: (summary: string) => void;
}

export function ProfessionalSummary({ data, onChange }: ProfessionalSummaryProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const characterCount = data.length;
  const wordCount = data.trim().split(/\s+/).filter(Boolean).length;
  const minChars = 150;
  const maxChars = 300;
  const isOptimal = characterCount >= minChars && characterCount <= maxChars;

  const handleEnhance = async () => {
    setIsEnhancing(true);
    // Simulate AI enhancement - in production, call your AI API
    setTimeout(() => {
      // Placeholder enhancement logic
      const enhanced = `${data}\n\n[AI-enhanced version would appear here]`;
      onChange(enhanced);
      setIsEnhancing(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <Label htmlFor="summary" className="text-base font-semibold">
            Professional Summary
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            A compelling overview of your professional experience and career goals
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                <strong>Pro Tips:</strong>
              </p>
              <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
                <li>Focus on your unique value proposition</li>
                <li>Include years of experience and key expertise</li>
                <li>Mention notable achievements or certifications</li>
                <li>Tailor to your target role</li>
                <li>Keep it between 150-300 characters</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        <Textarea
          id="summary"
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Results-driven Software Engineer with 5+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud architecture. Led development of products serving 1M+ users with 99.9% uptime."
          className="min-h-[120px] resize-y"
          rows={5}
        />

        {/* Character Count and Status */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={characterCount < minChars ? 'text-orange-500' : 'text-muted-foreground'}>
              {characterCount} characters ({wordCount} words)
            </span>
            {isOptimal ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Optimal Length
              </Badge>
            ) : characterCount < minChars ? (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                Too Short
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                Too Long
              </Badge>
            )}
          </div>
          <span className="text-muted-foreground">
            Recommended: {minChars}-{maxChars} chars
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              characterCount < minChars
                ? 'bg-orange-500'
                : characterCount <= maxChars
                ? 'bg-green-500'
                : 'bg-red-500'
            }`}
            style={{
              width: `${Math.min((characterCount / maxChars) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* AI Enhance Button */}
      <Button
        onClick={handleEnhance}
        disabled={isEnhancing || !data}
        variant="outline"
        className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300"
      >
        <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
        {isEnhancing ? 'Enhancing with AI...' : 'Enhance with AI'}
      </Button>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-900 mb-2">Writing Tips:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Start with your job title and years of experience</li>
          <li>• Highlight 2-3 core competencies</li>
          <li>• Include quantifiable achievements</li>
          <li>• End with your career objective or unique value</li>
        </ul>
      </div>
    </div>
  );
}
