'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Education } from '@/types/resume';
import { GraduationCap, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useDragDrop } from '@/hooks/useDragDrop';
import { Textarea } from '@/components/ui/textarea';

interface EducationSectionProps {
  data: Education[];
  onChange: (education: Education[]) => void;
}

export function EducationSection({ data, onChange }: EducationSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set([data[0]?.id]));
  const { draggedIndex, handleDragStart, handleDragOver, handleDragEnd } = useDragDrop(data, onChange);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
    };
    onChange([...data, newEdu]);
    setOpenItems(prev => new Set([...prev, newEdu.id]));
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    onChange(data.map(edu => (edu.id === id ? { ...edu, ...updates } : edu)));
  };

  const removeEducation = (id: string) => {
    onChange(data.filter(edu => edu.id !== id));
    setOpenItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Education
        </CardTitle>
        <CardDescription>
          Add your educational background and qualifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((edu, index) => {
          const isOpen = openItems.has(edu.id);

          return (
            <div
              key={edu.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`border rounded-lg transition-all ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2 p-3 bg-muted/50">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <button
                  type="button"
                  onClick={() => toggleItem(edu.id)}
                  className="flex-1 flex items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {edu.degree || 'New Degree'} {edu.field && `in ${edu.field}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {edu.institution || 'Institution'}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEducation(edu.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {isOpen && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Institution *</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                        placeholder="University of Example"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Degree *</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                        placeholder="Bachelor of Science"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field of Study *</Label>
                      <Input
                        value={edu.field}
                        onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                        placeholder="Computer Science"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={typeof edu.location === 'string' ? edu.location : edu.location?.city || ''}
                        onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                        placeholder="Boston, MA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="month"
                        value={edu.startDate as string || ''}
                        onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={edu.endDate as string || ''}
                        onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                        disabled={edu.current}
                      />
                    </div>

                    <div className="space-y-2 flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`current-${edu.id}`}
                          checked={edu.current}
                          onCheckedChange={(checked) =>
                            updateEducation(edu.id, { current: checked as boolean })
                          }
                        />
                        <Label htmlFor={`current-${edu.id}`}>Currently studying</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GPA</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(edu.id, { gpa: parseFloat(e.target.value) || '' })}
                        placeholder="3.85"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max GPA</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={edu.maxGpa || ''}
                        onChange={(e) => updateEducation(edu.id, { maxGpa: parseFloat(e.target.value) })}
                        placeholder="4.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Honors & Awards</Label>
                    <Textarea
                      value={edu.honors?.join(', ') || ''}
                      onChange={(e) =>
                        updateEducation(edu.id, {
                          honors: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Summa Cum Laude, Dean's List"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Relevant Coursework</Label>
                    <Textarea
                      value={edu.coursework?.join(', ') || ''}
                      onChange={(e) =>
                        updateEducation(edu.id, {
                          coursework: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Data Structures, Algorithms, Machine Learning"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Button type="button" onClick={addEducation} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </CardContent>
    </Card>
  );
}
