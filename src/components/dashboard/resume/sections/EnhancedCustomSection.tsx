'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  BookOpen,
  Globe,
  Heart,
  Briefcase,
} from 'lucide-react';
import { CustomSection as CustomSectionType } from '@/types/resume';

interface EnhancedCustomSectionProps {
  sections: CustomSectionType[];
  onChange: (sections: CustomSectionType[]) => void;
}

const SECTION_TEMPLATES = [
  { id: 'volunteer', name: 'Volunteer Experience', icon: Heart, type: 'list' as const },
  { id: 'awards', name: 'Awards & Honors', icon: Award, type: 'list' as const },
  { id: 'publications', name: 'Publications', icon: BookOpen, type: 'list' as const },
  { id: 'conferences', name: 'Conferences', icon: Users, type: 'list' as const },
  { id: 'languages-extra', name: 'Additional Languages', icon: Globe, type: 'text' as const },
  { id: 'interests', name: 'Interests & Hobbies', icon: Heart, type: 'text' as const },
  { id: 'professional', name: 'Professional Memberships', icon: Briefcase, type: 'list' as const },
];

export function EnhancedCustomSection({ sections, onChange }: EnhancedCustomSectionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showTemplates, setShowTemplates] = useState(false);

  const addSection = (template?: typeof SECTION_TEMPLATES[0]) => {
    const newSection: CustomSectionType = {
      id: crypto.randomUUID(),
      title: template?.name || '',
      content: template?.type === 'list' ? [] : '',
      type: template?.type || 'text',
      order: sections.length,
    };
    onChange([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, newSection.id!]));
    setShowTemplates(false);
  };

  const updateSection = (id: string, updates: Partial<CustomSectionType>) => {
    onChange(sections.map((section) => (section.id === id ? { ...section, ...updates } : section)));
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((section) => section.id !== id));
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
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const bullets = Array.isArray(section.content) ? section.content : [];
    updateSection(sectionId, { content: [...bullets, ''] });
  };

  const updateBulletPoint = (sectionId: string, index: number, value: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !Array.isArray(section.content)) return;

    const bullets = [...section.content];
    bullets[index] = value;
    updateSection(sectionId, { content: bullets });
  };

  const removeBulletPoint = (sectionId: string, index: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !Array.isArray(section.content)) return;

    const bullets = section.content.filter((_, i) => i !== index);
    updateSection(sectionId, { content: bullets });
  };

  const addStructuredItem = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const items = section.items || [];
    const newItem = {
      title: '',
      subtitle: '',
      description: '',
      date: '',
      bullets: [],
    };
    updateSection(sectionId, { items: [...items, newItem] });
  };

  const updateStructuredItem = (
    sectionId: string,
    itemIndex: number,
    updates: Partial<CustomSectionType['items'][0]>
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.items) return;

    const items = [...section.items];
    items[itemIndex] = { ...items[itemIndex], ...updates };
    updateSection(sectionId, { items });
  };

  const removeStructuredItem = (sectionId: string, itemIndex: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.items) return;

    const items = section.items.filter((_, i) => i !== itemIndex);
    updateSection(sectionId, { items });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Custom Sections</h3>
        <p className="text-sm text-slate-600 mt-1">
          Add additional sections to highlight unique qualifications that don't fit into standard resume sections.
        </p>
      </div>

      {/* Section Templates */}
      {showTemplates && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-900">Choose a Section Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SECTION_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="justify-start h-auto py-3 bg-white hover:bg-blue-100 hover:border-blue-400"
                    onClick={() => addSection(template)}
                  >
                    <Icon className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">{template.name}</span>
                  </Button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="ghost"
                className="w-full text-slate-600"
                onClick={() => setShowTemplates(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => addSection()}
              >
                Create Custom Section
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const isExpanded = expandedSections.has(section.id!);

          return (
            <Card key={section.id} className="border-2 border-slate-200 overflow-hidden">
              {/* Section Header */}
              <div
                className="flex items-center gap-3 p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSection(section.id!)}
              >
                <GripVertical className="h-5 w-5 text-slate-400 cursor-move" />
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">
                    {section.title || 'Untitled Section'}
                  </h4>
                  <p className="text-xs text-slate-500 capitalize">
                    {section.type === 'list' ? 'Bullet List' : 'Text Content'}
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
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor={`section-title-${section.id}`} className="text-sm font-medium">
                      Section Title *
                    </Label>
                    <Input
                      id={`section-title-${section.id}`}
                      value={section.title}
                      onChange={(e) => updateSection(section.id!, { title: e.target.value })}
                      placeholder="e.g., Volunteer Experience, Publications, Awards"
                      className="h-12"
                    />
                  </div>

                  {/* Content Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`section-type-${section.id}`} className="text-sm font-medium">
                      Content Type
                    </Label>
                    <Select
                      value={section.type || 'text'}
                      onValueChange={(value) =>
                        updateSection(section.id!, {
                          type: value as 'text' | 'list' | 'table',
                          content: value === 'list' ? [] : '',
                          items: undefined,
                        })
                      }
                    >
                      <SelectTrigger id={`section-type-${section.id}`} className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Paragraph Text</SelectItem>
                        <SelectItem value="list">Simple Bullet List</SelectItem>
                        <SelectItem value="table">Structured Items (Title, Date, Description)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Input - Text */}
                  {section.type === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor={`section-content-${section.id}`} className="text-sm font-medium">
                        Content
                      </Label>
                      <Textarea
                        id={`section-content-${section.id}`}
                        value={typeof section.content === 'string' ? section.content : ''}
                        onChange={(e) => updateSection(section.id!, { content: e.target.value })}
                        placeholder="Enter the content for this section..."
                        className="min-h-[120px] resize-none"
                        rows={5}
                      />
                    </div>
                  )}

                  {/* Content Input - List */}
                  {section.type === 'list' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Bullet Points</Label>
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

                      {Array.isArray(section.content) && section.content.length > 0 ? (
                        <div className="space-y-2">
                          {section.content.map((bullet, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                value={bullet}
                                onChange={(e) =>
                                  updateBulletPoint(section.id!, idx, e.target.value)
                                }
                                placeholder="• Enter bullet point..."
                                className="h-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBulletPoint(section.id!, idx)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-slate-50">
                          <p className="text-sm text-slate-500">No bullet points yet</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Click "Add Bullet" to get started
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content Input - Structured Items */}
                  {section.type === 'table' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Items</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addStructuredItem(section.id!)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {section.items && section.items.length > 0 ? (
                        <div className="space-y-4">
                          {section.items.map((item, itemIdx) => (
                            <Card key={itemIdx} className="p-4 bg-slate-50 border-slate-200">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-slate-600">
                                    Item {itemIdx + 1}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeStructuredItem(section.id!, itemIdx)}
                                    className="h-6 w-6"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <Input
                                    placeholder="Title"
                                    value={item.title}
                                    onChange={(e) =>
                                      updateStructuredItem(section.id!, itemIdx, {
                                        title: e.target.value,
                                      })
                                    }
                                    className="h-10"
                                  />
                                  <Input
                                    placeholder="Date"
                                    value={item.date}
                                    onChange={(e) =>
                                      updateStructuredItem(section.id!, itemIdx, {
                                        date: e.target.value,
                                      })
                                    }
                                    className="h-10"
                                  />
                                </div>
                                <Input
                                  placeholder="Subtitle (e.g., Organization, Location)"
                                  value={item.subtitle}
                                  onChange={(e) =>
                                    updateStructuredItem(section.id!, itemIdx, {
                                      subtitle: e.target.value,
                                    })
                                  }
                                  className="h-10"
                                />
                                <Textarea
                                  placeholder="Description..."
                                  value={item.description}
                                  onChange={(e) =>
                                    updateStructuredItem(section.id!, itemIdx, {
                                      description: e.target.value,
                                    })
                                  }
                                  className="min-h-[80px] resize-none"
                                  rows={3}
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-slate-50">
                          <p className="text-sm text-slate-500">No items yet</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Click "Add Item" to get started
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {sections.length === 0 && !showTemplates && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50">
            <div className="max-w-sm mx-auto">
              <Award className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 mb-2">No custom sections yet</h4>
              <p className="text-sm text-slate-600 mb-4">
                Add sections for volunteer work, publications, awards, or any other achievements that
                make your resume stand out.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Section Button */}
      {!showTemplates && (
        <Button
          type="button"
          onClick={() => setShowTemplates(true)}
          variant="outline"
          className="w-full h-14 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Custom Section
        </Button>
      )}
    </div>
  );
}
