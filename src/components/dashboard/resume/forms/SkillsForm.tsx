'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Resume, Skill, SkillCategory, ProficiencyLevel } from '@/types/resume';
import { cn } from '@/lib/utils';

interface SkillsFormProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
  onComplete?: () => void;
}

const SKILL_CATEGORIES = [
  { value: SkillCategory.TECHNICAL, label: 'Technical', color: 'bg-blue-500' },
  { value: SkillCategory.SOFT, label: 'Soft Skills', color: 'bg-green-500' },
  { value: SkillCategory.LANGUAGE, label: 'Languages', color: 'bg-purple-500' },
  { value: SkillCategory.TOOL, label: 'Tools', color: 'bg-orange-500' },
  { value: SkillCategory.FRAMEWORK, label: 'Frameworks', color: 'bg-pink-500' },
  { value: SkillCategory.OTHER, label: 'Other', color: 'bg-slate-500' },
];

const PROFICIENCY_LEVELS = [
  { value: ProficiencyLevel.BEGINNER, label: 'Beginner', color: 'bg-red-100 text-red-800' },
  { value: ProficiencyLevel.INTERMEDIATE, label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: ProficiencyLevel.ADVANCED, label: 'Advanced', color: 'bg-blue-100 text-blue-800' },
  { value: ProficiencyLevel.EXPERT, label: 'Expert', color: 'bg-green-100 text-green-800' },
];

const SUGGESTED_SKILLS = {
  [SkillCategory.TECHNICAL]: [
    'JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'SQL', 'HTML', 'CSS',
    'React', 'Node.js', 'Git', 'Docker', 'AWS', 'Machine Learning', 'Data Analysis',
  ],
  [SkillCategory.SOFT]: [
    'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management',
    'Critical Thinking', 'Adaptability', 'Creativity', 'Project Management',
  ],
  [SkillCategory.LANGUAGE]: [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic',
    'Portuguese', 'Russian', 'Italian',
  ],
  [SkillCategory.TOOL]: [
    'VS Code', 'IntelliJ IDEA', 'Figma', 'Adobe Creative Suite', 'Jira',
    'Slack', 'Trello', 'Postman', 'Jenkins', 'GitHub',
  ],
  [SkillCategory.FRAMEWORK]: [
    'React', 'Angular', 'Vue.js', 'Next.js', 'Django', 'Flask', 'Spring Boot',
    'Express.js', 'TailwindCSS', 'Bootstrap',
  ],
};

export default function SkillsForm({ resume, onUpdate, onComplete }: SkillsFormProps) {
  const [skills, setSkills] = useState<Skill[]>(resume.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>(SkillCategory.TECHNICAL);
  const [newSkillProficiency, setNewSkillProficiency] = useState<ProficiencyLevel>(ProficiencyLevel.INTERMEDIATE);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Keep local list in sync when resume loads/changes.
  useEffect(() => {
    setSkills(resume.skills || []);
  }, [resume.skills]);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      category: newSkillCategory,
      proficiency: newSkillProficiency,
      level: newSkillProficiency,
    };

    const updatedSkills = [...skills, newSkill];
    setSkills(updatedSkills);
    onUpdate({ skills: updatedSkills });

    setNewSkillName('');
    setNewSkillCategory(SkillCategory.TECHNICAL);
    setNewSkillProficiency(ProficiencyLevel.INTERMEDIATE);
  };

  const handleRemoveSkill = (id: string) => {
    const updatedSkills = skills.filter((s) => s.id !== id);
    setSkills(updatedSkills);
    onUpdate({ skills: updatedSkills });
  };

  const handleAddSuggestedSkill = (skillName: string) => {
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: skillName,
      category: newSkillCategory,
      proficiency: ProficiencyLevel.INTERMEDIATE,
      level: ProficiencyLevel.INTERMEDIATE,
    };

    const updatedSkills = [...skills, newSkill];
    setSkills(updatedSkills);
    onUpdate({ skills: updatedSkills });
  };

  const handleUpdateProficiency = (id: string, proficiency: ProficiencyLevel) => {
    const updatedSkills = skills.map((skill) =>
      skill.id === id ? { ...skill, proficiency, level: proficiency } : skill
    );
    setSkills(updatedSkills);
    onUpdate({ skills: updatedSkills });
  };

  const getCategoryColor = (category: string) => {
    return SKILL_CATEGORIES.find((c) => c.value === category)?.color || 'bg-slate-500';
  };

  const getProficiencyColor = (proficiency?: string) => {
    return PROFICIENCY_LEVELS.find((p) => p.value === proficiency)?.color || 'bg-slate-100 text-slate-800';
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || SkillCategory.OTHER;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const filteredSuggestions = SUGGESTED_SKILLS[newSkillCategory]?.filter(
    (suggestion) => !skills.some((skill) => skill.name.toLowerCase() === suggestion.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Skills
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add your technical and soft skills to showcase your abilities
          </p>
        </div>

        {/* Add Skill Form */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                placeholder="e.g., React, Leadership"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="skill-category">Category</Label>
              <Select
                value={newSkillCategory}
                onValueChange={(value) => setNewSkillCategory(value as SkillCategory)}
              >
                <SelectTrigger id="skill-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', cat.color)} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="skill-proficiency">Proficiency</Label>
              <Select
                value={newSkillProficiency}
                onValueChange={(value) => setNewSkillProficiency(value as ProficiencyLevel)}
              >
                <SelectTrigger id="skill-proficiency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1 flex items-end">
              <Button onClick={handleAddSkill} className="w-full">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <Card className="p-4 bg-muted">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Suggested {SKILL_CATEGORIES.find(c => c.value === newSkillCategory)?.label} Skills
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(false)}
                >
                  Hide
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredSuggestions.slice(0, 10).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddSuggestedSkill(suggestion)}
                    className="px-3 py-1 text-sm rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-colors border"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Skills Display */}
        {skills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No skills added yet</p>
            <p className="text-sm mt-1">Start adding your skills to showcase your expertise</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => {
              const categoryInfo = SKILL_CATEGORIES.find((c) => c.value === category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-3 h-3 rounded-full', categoryInfo?.color)} />
                    <h4 className="font-medium">{categoryInfo?.label || category}</h4>
                    <span className="text-xs text-muted-foreground">
                      ({categorySkills.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {categorySkills.map((skill) => (
                        <motion.div
                          key={skill.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="group relative">
                            <div className="flex items-center gap-2 px-3 py-2">
                              <span className="font-medium">{skill.name}</span>
                              {skill.proficiency && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'text-xs',
                                    getProficiencyColor(skill.proficiency)
                                  )}
                                >
                                  {PROFICIENCY_LEVELS.find(
                                    (p) => p.value === skill.proficiency
                                  )?.label}
                                </Badge>
                              )}
                              <button
                                onClick={() => handleRemoveSkill(skill.id!)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              >
                                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Pro Tip
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Include 10-15 relevant skills. Prioritize skills mentioned in job descriptions
              you're targeting. Use specific technical skills over generic ones.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
