'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Language } from '@/types/resume';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface LanguageSectionProps {
  data: Language[];
  onChange: (languages: Language[]) => void;
}

const proficiencyLevels: Array<{
  value: Language['proficiency'];
  label: string;
  description: string;
  level: number;
}> = [
  { value: 'native', label: 'Native', description: 'Native or bilingual', level: 100 },
  { value: 'fluent', label: 'Fluent', description: 'Full professional proficiency', level: 90 },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Professional working proficiency',
    level: 75,
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Limited working proficiency',
    level: 50,
  },
  { value: 'basic', label: 'Basic', description: 'Elementary proficiency', level: 25 },
];

const proficiencyColors = {
  native: 'bg-green-500',
  fluent: 'bg-blue-500',
  professional: 'bg-purple-500',
  intermediate: 'bg-orange-500',
  basic: 'bg-gray-500',
};

export function LanguageSection({ data, onChange }: LanguageSectionProps) {
  const addLanguage = () => {
    const newLanguage: Language = {
      id: crypto.randomUUID(),
      name: '',
      proficiency: 'intermediate',
    };
    onChange([...data, newLanguage]);
  };

  const updateLanguage = (id: string, updates: Partial<Language>) => {
    onChange(data.map((lang) => (lang.id === id ? { ...lang, ...updates } : lang)));
  };

  const removeLanguage = (id: string) => {
    onChange(data.filter((lang) => lang.id !== id));
  };

  const getProficiencyLevel = (proficiency: Language['proficiency']) => {
    return proficiencyLevels.find((p) => p.value === proficiency)?.level || 50;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Languages</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Add languages you speak and your proficiency level
        </p>
      </div>

      {/* Language List */}
      <div className="space-y-3">
        {data.map((language) => (
          <Card key={language.id} className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-2" />

              <div className="flex-1 space-y-3">
                {/* Language Name */}
                <div className="space-y-2">
                  <Label htmlFor={`lang-name-${language.id}`}>Language</Label>
                  <Input
                    id={`lang-name-${language.id}`}
                    value={language.name}
                    onChange={(e) => updateLanguage(language.id!, { name: e.target.value })}
                    placeholder="e.g., English, Spanish, Mandarin"
                  />
                </div>

                {/* Proficiency Level */}
                <div className="space-y-2">
                  <Label htmlFor={`lang-prof-${language.id}`}>Proficiency Level</Label>
                  <Select
                    value={language.proficiency}
                    onValueChange={(value) =>
                      updateLanguage(language.id!, {
                        proficiency: value as Language['proficiency'],
                      })
                    }
                  >
                    <SelectTrigger id={`lang-prof-${language.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {proficiencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{level.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {level.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Visual Proficiency Indicator */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Proficiency</span>
                    <Badge
                      variant="secondary"
                      className={`${proficiencyColors[language.proficiency]} text-white text-xs`}
                    >
                      {proficiencyLevels.find((p) => p.value === language.proficiency)?.label}
                    </Badge>
                  </div>
                  <Progress
                    value={getProficiencyLevel(language.proficiency)}
                    className="h-2"
                  />
                </div>
              </div>

              {/* Delete Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLanguage(language.id!)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {data.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">No languages added yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click the button below to add your first language
            </p>
          </div>
        )}
      </div>

      {/* Add Language Button */}
      <Button type="button" onClick={addLanguage} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Language
      </Button>

      {/* Info Box */}
      {data.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900 mb-1">Pro Tip:</p>
          <p className="text-xs text-blue-800">
            Being multilingual is a valuable skill! Be honest about your proficiency level - it
            shows self-awareness and credibility.
          </p>
        </div>
      )}
    </div>
  );
}
