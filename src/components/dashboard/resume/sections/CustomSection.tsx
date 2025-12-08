'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomSection as CustomSectionType } from '@/types/resume';

interface CustomSectionProps {
  data: CustomSectionType[];
  onChange: (sections: CustomSectionType[]) => void;
}

export function CustomSection({ data, onChange }: CustomSectionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const addSection = () => {
    const newSection: CustomSectionType = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      type: 'text',
      order: data.length,
    };
    onChange([...data, newSection]);
    setExpandedSections(new Set([...expandedSections, newSection.id!]));
  };

  const updateSection = (id: string, updates: Partial<CustomSectionType>) => {
    onChange(data.map((section) => (section.id === id ? { ...section, ...updates } : section)));
  };

  const removeSection = (id: string) => {
    onChange(data.filter((section) => section.id !== id));
    const newExpanded = new Set(expandedSections);
    newExpanded.delete(id);
    setExpandedSections(newExpanded);
  };

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const addBulletPoint = (sectionId: string) => {
    const section = data.find((s) => s.id === sectionId);
    if (!section) return;

    const bullets = Array.isArray(section.content) ? section.content : [];
    updateSection(sectionId, { content: [...bullets, ''] });
  };

  const updateBulletPoint = (sectionId: string, index: number, value: string) => {
    const section = data.find((s) => s.id === sectionId);
    if (!section || !Array.isArray(section.content)) return;

    const bullets = [...section.content];
    bullets[index] = value;
    updateSection(sectionId, { content: bullets });
  };

  const removeBulletPoint = (sectionId: string, index: number) => {
    const section = data.find((s) => s.id === sectionId);
    if (!section || !Array.isArray(section.content)) return;

    const bullets = section.content.filter((_, i) => i !== index);
    updateSection(sectionId, { content: bullets });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Custom Sections</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Add custom sections like Volunteer Work, Publications, Awards, Hobbies, etc.
        </p>
      </div>

      {/* Section List */}
      <div className="space-y-3">
        {data.map((section) => {
          const isExpanded = expandedSections.has(section.id!);

          return (
            <Card key={section.id} className="overflow-hidden">
              {/* Section Header */}
              <div
                className="flex items-center gap-2 p-3 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleSection(section.id!)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">
                    {section.title || 'Untitled Section'}
                  </h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {section.type} content
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(section.id!);
                  }}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Section Title */}
                  <div className="space-y-2">
                    <Label htmlFor={`section-title-${section.id}`}>Section Title *</Label>
                    <Input
                      id={`section-title-${section.id}`}
                      value={section.title}
                      onChange={(e) => updateSection(section.id!, { title: e.target.value })}
                      placeholder="e.g., Volunteer Experience, Publications, Awards"
                    />
                  </div>

                  {/* Content Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`section-type-${section.id}`}>Content Type</Label>
                    <Select
                      value={section.type || 'text'}
                      onValueChange={(value) =>
                        updateSection(section.id!, {
                          type: value as 'text' | 'list' | 'table',
                          content: value === 'list' ? [] : '',
                        })
                      }
                    >
                      <SelectTrigger id={`section-type-${section.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Paragraph Text</SelectItem>
                        <SelectItem value="list">Bullet List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Input */}
                  {section.type === 'text' ? (
                    <div className="space-y-2">
                      <Label htmlFor={`section-content-${section.id}`}>Content</Label>
                      <Textarea
                        id={`section-content-${section.id}`}
                        value={typeof section.content === 'string' ? section.content : ''}
                        onChange={(e) =>
                          updateSection(section.id!, { content: e.target.value })
                        }
                        placeholder="Enter the content for this section..."
                        className="min-h-[100px]"
                        rows={4}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Bullet Points</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addBulletPoint(section.id!)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Bullet
                        </Button>
                      </div>

                      {Array.isArray(section.content) &&
                        section.content.map((bullet, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={bullet}
                              onChange={(e) =>
                                updateBulletPoint(section.id!, index, e.target.value)
                              }
                              placeholder="• Enter bullet point..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBulletPoint(section.id!, index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                      {(!section.content || (Array.isArray(section.content) && section.content.length === 0)) && (
                        <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded">
                          No bullet points yet. Click "Add Bullet" to get started.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">No custom sections added yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add sections for volunteer work, publications, awards, etc.
            </p>
          </div>
        )}
      </div>

      {/* Add Section Button */}
      <Button type="button" onClick={addSection} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Section
      </Button>

      {/* Examples */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-purple-900 mb-2">Popular Custom Sections:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Volunteer Experience',
            'Publications',
            'Awards & Honors',
            'Patents',
            'Conferences',
            'Hobbies & Interests',
            'References',
          ].map((example) => (
            <Button
              key={example}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 bg-white"
              onClick={() => {
                const newSection: CustomSectionType = {
                  id: crypto.randomUUID(),
                  title: example,
                  content: '',
                  type: 'text',
                  order: data.length,
                };
                onChange([...data, newSection]);
                setExpandedSections(new Set([...expandedSections, newSection.id!]));
              }}
            >
              + {example}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
