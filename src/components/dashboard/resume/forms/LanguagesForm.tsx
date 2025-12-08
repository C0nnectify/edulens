'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Languages as LanguagesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Resume, Language } from '@/types/resume';

interface LanguagesFormProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
}

const PROFICIENCY_LEVELS = [
  { value: 'native', label: 'Native', description: 'Mother tongue' },
  { value: 'fluent', label: 'Fluent', description: 'Professional working proficiency' },
  { value: 'professional', label: 'Professional', description: 'Limited working proficiency' },
  { value: 'intermediate', label: 'Intermediate', description: 'Elementary proficiency' },
  { value: 'basic', label: 'Basic', description: 'Limited knowledge' },
];

export default function LanguagesForm({ resume, onUpdate }: LanguagesFormProps) {
  const [languages, setLanguages] = useState<Language[]>(resume.languages || []);
  const [newLanguage, setNewLanguage] = useState('');
  const [newProficiency, setNewProficiency] = useState<Language['proficiency']>('intermediate');

  const handleAddLanguage = () => {
    if (!newLanguage.trim()) return;

    const language: Language = {
      id: `lang-${Date.now()}`,
      name: newLanguage.trim(),
      proficiency: newProficiency,
    };

    const updatedLanguages = [...languages, language];
    setLanguages(updatedLanguages);
    onUpdate({ languages: updatedLanguages });
    setNewLanguage('');
    setNewProficiency('intermediate');
  };

  const handleRemoveLanguage = (id: string) => {
    const updatedLanguages = languages.filter((l) => l.id !== id);
    setLanguages(updatedLanguages);
    onUpdate({ languages: updatedLanguages });
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <LanguagesIcon className="w-5 h-5" />
          Languages
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add languages you speak and your proficiency level
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              placeholder="e.g., English, Spanish"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLanguage();
                }
              }}
            />
          </div>

          <div className="md:col-span-5">
            <Label htmlFor="proficiency">Proficiency</Label>
            <Select
              value={newProficiency}
              onValueChange={(value) => setNewProficiency(value as Language['proficiency'])}
            >
              <SelectTrigger id="proficiency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFICIENCY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <Button onClick={handleAddLanguage} className="w-full">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {languages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <LanguagesIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No languages added yet</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {languages.map((lang) => (
                <motion.div
                  key={lang.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{lang.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {PROFICIENCY_LEVELS.find((p) => p.value === lang.proficiency)?.label}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLanguage(lang.id!)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
