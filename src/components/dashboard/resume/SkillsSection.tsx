'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Skill, SkillCategory, ProficiencyLevel } from '@/types/resume';
import { Zap, Plus, X, GripVertical } from 'lucide-react';
import { useDragDrop } from '@/hooks/useDragDrop';
import { Progress } from '@/components/ui/progress';

interface SkillsSectionProps {
  data: Skill[];
  onChange: (skills: Skill[]) => void;
}

const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: 'technical' as SkillCategory, label: 'Technical' },
  { value: 'soft' as SkillCategory, label: 'Soft Skills' },
  { value: 'language' as SkillCategory, label: 'Languages' },
  { value: 'tool' as SkillCategory, label: 'Tools & Software' },
  { value: 'framework' as SkillCategory, label: 'Frameworks' },
  { value: 'other' as SkillCategory, label: 'Other' },
];

const PROFICIENCY_LEVELS: { value: ProficiencyLevel; label: string; value_num: number }[] = [
  { value: 'beginner' as ProficiencyLevel, label: 'Beginner', value_num: 25 },
  { value: 'intermediate' as ProficiencyLevel, label: 'Intermediate', value_num: 50 },
  { value: 'advanced' as ProficiencyLevel, label: 'Advanced', value_num: 75 },
  { value: 'expert' as ProficiencyLevel, label: 'Expert', value_num: 100 },
];

export function SkillsSection({ data, onChange }: SkillsSectionProps) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('technical' as SkillCategory);
  const { draggedIndex, handleDragStart, handleDragOver, handleDragEnd } = useDragDrop(data, onChange);

  const addSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: newSkillName.trim(),
      category: newSkillCategory,
      proficiency: 'intermediate' as ProficiencyLevel,
    };

    onChange([...data, newSkill]);
    setNewSkillName('');
  };

  const updateSkill = (id: string, updates: Partial<Skill>) => {
    onChange(data.map(skill => (skill.id === id ? { ...skill, ...updates } : skill)));
  };

  const removeSkill = (id: string) => {
    onChange(data.filter(skill => skill.id !== id));
  };

  const groupedSkills = data.reduce((acc, skill) => {
    const category = skill.category as string;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getProficiencyValue = (proficiency?: ProficiencyLevel | string) => {
    const level = PROFICIENCY_LEVELS.find(l => l.value === proficiency);
    return level?.value_num || 50;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Skills
        </CardTitle>
        <CardDescription>
          Add and categorize your professional skills with proficiency levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Skill */}
        <div className="flex gap-2">
          <Input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            placeholder="Enter skill name"
            className="flex-1"
          />
          <Select value={newSkillCategory} onValueChange={(v) => setNewSkillCategory(v as SkillCategory)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKILL_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addSkill}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Grouped Skills Display */}
        {SKILL_CATEGORIES.map(({ value: category, label }) => {
          const categorySkills = groupedSkills[category] || [];
          if (categorySkills.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">{label}</h4>
              <div className="space-y-2">
                {categorySkills.map((skill, index) => (
                  <div
                    key={skill.id}
                    draggable
                    onDragStart={() => handleDragStart(data.indexOf(skill))}
                    onDragOver={(e) => handleDragOver(e, data.indexOf(skill))}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 border rounded-lg bg-card transition-all ${
                      draggedIndex === data.indexOf(skill) ? 'opacity-50' : ''
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <Select
                            value={skill.proficiency as string || 'intermediate'}
                            onValueChange={(v) => updateSkill(skill.id!, { proficiency: v as ProficiencyLevel })}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROFICIENCY_LEVELS.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeSkill(skill.id!)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={getProficiencyValue(skill.proficiency)} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No skills added yet. Add your first skill above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
