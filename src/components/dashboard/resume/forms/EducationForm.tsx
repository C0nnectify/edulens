'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  GraduationCap,
  Calendar,
  MapPin,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Resume, Education } from '@/types/resume';
import { format } from 'date-fns';

const educationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().min(1, 'Field of study is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  gpa: z.string().optional(),
  maxGpa: z.string().optional(),
  achievements: z.string().optional(),
  coursework: z.string().optional(),
  honors: z.string().optional(),
});

type EducationFormData = z.infer<typeof educationSchema>;

interface EducationFormProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
  onComplete?: () => void;
}

export default function EducationForm({
  resume,
  onUpdate,
  onComplete,
}: EducationFormProps) {
  const [educationList, setEducationList] = useState<Education[]>(
    resume.education || []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      gpa: '',
      maxGpa: '4.0',
      achievements: '',
      coursework: '',
      honors: '',
    },
  });

  const isCurrent = form.watch('current');

  const handleAddEducation = () => {
    form.reset();
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleEditEducation = (index: number) => {
    const edu = educationList[index];
    form.reset({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      location: typeof edu.location === 'string' ? edu.location : edu.location?.city || '',
      startDate: edu.startDate instanceof Date
        ? format(edu.startDate, 'yyyy-MM-dd')
        : edu.startDate,
      endDate: edu.endDate
        ? edu.endDate instanceof Date
          ? format(edu.endDate, 'yyyy-MM-dd')
          : edu.endDate
        : '',
      current: edu.current || false,
      gpa: edu.gpa?.toString() || '',
      maxGpa: edu.maxGpa?.toString() || '4.0',
      achievements: edu.achievements?.join('\n') || '',
      coursework: edu.coursework?.join(', ') || '',
      honors: edu.honors?.join(', ') || '',
    });
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDeleteEducation = (index: number) => {
    const newEducation = educationList.filter((_, i) => i !== index);
    setEducationList(newEducation);
    onUpdate({ education: newEducation });
  };

  const onSubmit = (data: EducationFormData) => {
    const newEducation: Education = {
      id: editingIndex !== null ? educationList[editingIndex].id : `edu-${Date.now()}`,
      institution: data.institution,
      degree: data.degree,
      field: data.field,
      location: data.location,
      startDate: data.startDate,
      endDate: data.current ? undefined : data.endDate,
      current: data.current,
      gpa: data.gpa ? parseFloat(data.gpa) : undefined,
      maxGpa: data.maxGpa ? parseFloat(data.maxGpa) : undefined,
      achievements: data.achievements ? data.achievements.split('\n').filter(a => a.trim()) : undefined,
      coursework: data.coursework ? data.coursework.split(',').map(c => c.trim()).filter(c => c) : undefined,
      honors: data.honors ? data.honors.split(',').map(h => h.trim()).filter(h => h) : undefined,
    };

    let newEducationList: Education[];
    if (editingIndex !== null) {
      newEducationList = educationList.map((edu, i) =>
        i === editingIndex ? newEducation : edu
      );
    } else {
      newEducationList = [...educationList, newEducation];
    }

    setEducationList(newEducationList);
    onUpdate({ education: newEducationList });
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Education
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your educational background, starting with the most recent
            </p>
          </div>
          <Button onClick={handleAddEducation}>
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </div>

        <AnimatePresence>
          {educationList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No education added yet</p>
              <p className="text-sm mt-1">Click "Add Education" to get started</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {educationList.map((edu, index) => (
                <motion.div
                  key={edu.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">
                          {edu.degree} in {edu.field}
                        </h4>
                        <p className="text-muted-foreground font-medium">
                          {edu.institution}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {edu.startDate instanceof Date
                              ? format(edu.startDate, 'MMM yyyy')
                              : edu.startDate}{' '}
                            -{' '}
                            {edu.current
                              ? 'Present'
                              : edu.endDate instanceof Date
                              ? format(edu.endDate, 'MMM yyyy')
                              : edu.endDate}
                          </span>
                          {edu.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {typeof edu.location === 'string'
                                ? edu.location
                                : edu.location.city}
                            </span>
                          )}
                          {edu.gpa && (
                            <span>GPA: {edu.gpa}/{edu.maxGpa || 4.0}</span>
                          )}
                        </div>
                        {edu.honors && edu.honors.length > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Honors:</span>{' '}
                            {edu.honors.join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEducation(index)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEducation(index)}
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
              {editingIndex !== null ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="University of California" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree *</FormLabel>
                      <FormControl>
                        <Input placeholder="Bachelor of Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field of Study *</FormLabel>
                      <FormControl>
                        <Input placeholder="Computer Science" {...field} />
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
                      <Input placeholder="Berkeley, CA" {...field} />
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
                      I currently study here
                    </FormLabel>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="3.8"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxGpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max GPA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="4.0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="honors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Honors & Awards</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cum Laude, Dean's List"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Separate multiple items with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coursework"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relevant Coursework</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Data Structures, Algorithms, Machine Learning"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Separate courses with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="achievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Achievements & Activities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="• President of Computer Science Club&#10;• Research assistant in AI lab&#10;• Published paper on machine learning"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      One achievement per line
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIndex !== null ? 'Update' : 'Add'} Education
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
