'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Experience } from '@/types/resume';
import { Briefcase, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useDragDrop } from '@/hooks/useDragDrop';
import { Badge } from '@/components/ui/badge';

interface ExperienceSectionProps {
  data: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export function ExperienceSection({ data, onChange }: ExperienceSectionProps) {
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

  const addExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      achievements: [''],
      bullets: [''],
    };
    onChange([...data, newExp]);
    setOpenItems(prev => new Set([...prev, newExp.id]));
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    onChange(data.map(exp => (exp.id === id ? { ...exp, ...updates } : exp)));
  };

  const removeExperience = (id: string) => {
    onChange(data.filter(exp => exp.id !== id));
    setOpenItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addBullet = (id: string) => {
    updateExperience(id, {
      achievements: [...(data.find(e => e.id === id)?.achievements || []), ''],
    });
  };

  const updateBullet = (expId: string, index: number, value: string) => {
    const exp = data.find(e => e.id === expId);
    if (!exp) return;

    const bullets = [...(exp.achievements || [])];
    bullets[index] = value;
    updateExperience(expId, { achievements: bullets });
  };

  const removeBullet = (expId: string, index: number) => {
    const exp = data.find(e => e.id === expId);
    if (!exp) return;

    const bullets = exp.achievements.filter((_, i) => i !== index);
    updateExperience(expId, { achievements: bullets });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Work Experience
        </CardTitle>
        <CardDescription>
          Add your professional experience and achievements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((exp, index) => {
          const isOpen = openItems.has(exp.id);

          return (
            <div
              key={exp.id}
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
                  onClick={() => toggleItem(exp.id)}
                  className="flex-1 flex items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {exp.position || 'New Position'} {exp.company && `at ${exp.company}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'End Date'}
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
                  onClick={() => removeExperience(exp.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {isOpen && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Position *</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                        placeholder="Software Engineer"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Company *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                        placeholder="Tech Corp"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Input
                        type="month"
                        value={exp.startDate as string}
                        onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={exp.endDate as string || ''}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        disabled={exp.current}
                      />
                    </div>

                    <div className="space-y-2 flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`current-${exp.id}`}
                          checked={exp.current}
                          onCheckedChange={(checked) =>
                            updateExperience(exp.id, { current: checked as boolean })
                          }
                        />
                        <Label htmlFor={`current-${exp.id}`}>Currently working here</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={typeof exp.location === 'string' ? exp.location : exp.location?.city || ''}
                      onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                      placeholder="San Francisco, CA"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Key Achievements & Responsibilities</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBullet(exp.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Bullet
                      </Button>
                    </div>

                    {exp.achievements?.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="flex gap-2">
                        <Textarea
                          value={bullet}
                          onChange={(e) => updateBullet(exp.id, bulletIndex, e.target.value)}
                          placeholder="• Achieved X by doing Y, resulting in Z"
                          className="flex-1 min-h-[60px]"
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBullet(exp.id, bulletIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="AI Enhance"
                          >
                            <Sparkles className="h-4 w-4 text-purple-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Skills Used (comma-separated)</Label>
                    <Input
                      value={exp.skillsUsed?.join(', ') || ''}
                      onChange={(e) =>
                        updateExperience(exp.id, {
                          skillsUsed: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="React, TypeScript, Node.js"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exp.skillsUsed?.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Button type="button" onClick={addExperience} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </CardContent>
    </Card>
  );
}
