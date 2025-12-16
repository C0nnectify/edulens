'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Resume } from '@/types/resume';

interface ProfessionalSummaryFormProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
}

export default function ProfessionalSummaryForm({ resume, onUpdate }: ProfessionalSummaryFormProps) {
  const form = useForm({
    defaultValues: {
      summary: resume.summary || '',
    },
  });

  useEffect(() => {
    form.reset({ summary: resume.summary || '' });
  }, [form, resume.summary]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      onUpdate({ summary: value.summary });
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Professional Summary
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Write a compelling summary of your professional background
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summary</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Experienced software engineer with 5+ years of expertise in full-stack development..."
                    rows={8}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  3-5 sentences highlighting your experience, skills, and career goals
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Card className="p-4 bg-muted">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Writing Tips
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Start with your years of experience and area of expertise</li>
              <li>• Highlight 2-3 key achievements or specializations</li>
              <li>• Mention what you're looking for in your next role</li>
              <li>• Keep it concise: 3-5 sentences maximum</li>
            </ul>
          </Card>
        </form>
      </Form>
    </Card>
  );
}
