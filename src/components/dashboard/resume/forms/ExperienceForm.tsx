'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Briefcase,
  Calendar,
  MapPin,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Resume, Experience } from '@/types/resume';
import { format } from 'date-fns';

const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.string(),
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
  onComplete?: () => void;
}

export default function ExperienceForm({
  resume,
  onUpdate,
  onComplete,
}: ExperienceFormProps) {
  const [experiences, setExperiences] = useState<Experience[]>(
    resume.experience || []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: '',
    },
  });

  const isCurrent = form.watch('current');

  const handleAddExperience = () => {
    form.reset();
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleEditExperience = (index: number) => {
    const exp = experiences[index];
    form.reset({
      company: exp.company,
      position: exp.position,
      location: typeof exp.location === 'string' ? exp.location : exp.location?.city || '',
      startDate: exp.startDate instanceof Date
        ? format(exp.startDate, 'yyyy-MM-dd')
        : exp.startDate,
      endDate: exp.endDate
        ? exp.endDate instanceof Date
          ? format(exp.endDate, 'yyyy-MM-dd')
          : exp.endDate
        : '',
      current: exp.current,
      description: exp.description || '',
      achievements: exp.achievements?.join('\n') || '',
    });
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDeleteExperience = (index: number) => {
    const newExperiences = experiences.filter((_, i) => i !== index);
    setExperiences(newExperiences);
    onUpdate({ experience: newExperiences });
  };

  const onSubmit = (data: ExperienceFormData) => {
    const newExperience: Experience = {
      id: editingIndex !== null ? experiences[editingIndex].id : `exp-${Date.now()}`,
      company: data.company,
      position: data.position,
      location: data.location,
      startDate: data.startDate,
      endDate: data.current ? undefined : data.endDate,
      current: data.current,
      description: data.description,
      achievements: data.achievements.split('\n').filter(a => a.trim()),
      bullets: data.achievements.split('\n').filter(a => a.trim()),
    };

    let newExperiences: Experience[];
    if (editingIndex !== null) {
      newExperiences = experiences.map((exp, i) =>
        i === editingIndex ? newExperience : exp
      );
    } else {
      newExperiences = [...experiences, newExperience];
    }

    setExperiences(newExperiences);
    onUpdate({ experience: newExperiences });
    setIsDialogOpen(false);
    form.reset();
  };

  const generateAISuggestions = (position: string) => {
    // Mock AI suggestions - in production, this would call an AI API
    const suggestions = [
      `Led cross-functional team of 5 engineers to deliver ${position} solutions`,
      `Increased system efficiency by 40% through optimized ${position} practices`,
      `Implemented automated testing framework reducing bugs by 60%`,
      `Collaborated with stakeholders to define requirements for ${position} projects`,
      `Mentored junior team members on best practices and technical skills`,
    ];
    return suggestions;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your professional experience, starting with the most recent
            </p>
          </div>
          <Button onClick={handleAddExperience}>
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>

        <AnimatePresence>
          {experiences.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No experience added yet</p>
              <p className="text-sm mt-1">Click "Add Experience" to get started</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp, index) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{exp.position}</h4>
                        <p className="text-muted-foreground font-medium">
                          {exp.company}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {exp.startDate instanceof Date
                              ? format(exp.startDate, 'MMM yyyy')
                              : exp.startDate}{' '}
                            -{' '}
                            {exp.current
                              ? 'Present'
                              : exp.endDate instanceof Date
                              ? format(exp.endDate, 'MMM yyyy')
                              : exp.endDate}
                          </span>
                          {exp.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {typeof exp.location === 'string'
                                ? exp.location
                                : exp.location.city}
                            </span>
                          )}
                        </div>
                        {exp.achievements && exp.achievements.length > 0 && (
                          <ul className="mt-3 space-y-1 text-sm">
                            {exp.achievements.slice(0, 3).map((achievement, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>{achievement}</span>
                              </li>
                            ))}
                            {exp.achievements.length > 3 && (
                              <li className="text-muted-foreground text-xs">
                                +{exp.achievements.length - 3} more
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExperience(index)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExperience(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Experience' : 'Add Experience'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="month" {...field} disabled={isCurrent} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">
                      I currently work here
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="achievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Key Achievements & Responsibilities *</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAISuggestions(!showAISuggestions)}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        AI Suggestions
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="• Led development of feature that increased user engagement by 30%&#10;• Collaborated with cross-functional teams to deliver projects on time&#10;• Implemented best practices reducing technical debt by 25%"
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter one achievement per line. Start with action verbs and include metrics.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showAISuggestions && (
                <Card className="p-4 bg-muted">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    AI-Powered Suggestions
                  </h4>
                  <div className="space-y-2">
                    {generateAISuggestions(form.watch('position') || 'your role').map(
                      (suggestion, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-full text-left p-2 rounded hover:bg-background transition-colors text-sm"
                          onClick={() => {
                            const current = form.getValues('achievements');
                            form.setValue(
                              'achievements',
                              current ? `${current}\n${suggestion}` : suggestion
                            );
                          }}
                        >
                          • {suggestion}
                        </button>
                      )
                    )}
                  </div>
                </Card>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIndex !== null ? 'Update' : 'Add'} Experience
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
