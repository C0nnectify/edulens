'use client';

import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  GripVertical,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Lightbulb,
  FolderOpen,
  Languages,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Resume, SectionConfig, CustomSection } from '@/types/resume';
import { cn } from '@/lib/utils';

const SECTION_ICONS = {
  personalInfo: User,
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Lightbulb,
  projects: FolderOpen,
  certifications: Award,
  languages: Languages,
  custom: FileText,
};

interface SectionItem extends SectionConfig {
  name: string;
  type: string;
  required?: boolean;
}

interface SortableSectionProps {
  section: SectionItem;
  onToggleVisibility: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

function SortableSection({
  section,
  onToggleVisibility,
  onDelete,
  onEdit,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = SECTION_ICONS[section.type as keyof typeof SECTION_ICONS] || FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group',
        isDragging && 'opacity-50'
      )}
    >
      <Card className={cn(
        'p-4 transition-all',
        !section.visible && 'opacity-60 bg-muted'
      )}>
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-2 flex-1">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <h4 className="font-medium">{section.name}</h4>
              {section.required && (
                <span className="text-xs text-muted-foreground">Required section</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && !section.required && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(section.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}

            <Switch
              checked={section.visible}
              onCheckedChange={() => onToggleVisibility(section.id)}
              disabled={section.required}
            />

            {section.visible ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}

            {onDelete && !section.required && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(section.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

interface SectionManagerProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
}

export default function SectionManager({ resume, onUpdate }: SectionManagerProps) {
  const buildSections = (r: Resume): SectionItem[] => {
    const defaultSections: SectionItem[] = [
      { id: 'personalInfo', name: 'Personal Information', type: 'personalInfo', visible: true, order: 0, required: true },
      { id: 'summary', name: 'Professional Summary', type: 'summary', visible: !!r.summary, order: 1 },
      { id: 'experience', name: 'Work Experience', type: 'experience', visible: true, order: 2, required: true },
      { id: 'education', name: 'Education', type: 'education', visible: true, order: 3, required: true },
      { id: 'skills', name: 'Skills', type: 'skills', visible: true, order: 4, required: true },
      { id: 'projects', name: 'Projects', type: 'projects', visible: (r.projects?.length || 0) > 0, order: 5 },
      { id: 'certifications', name: 'Certifications', type: 'certifications', visible: (r.certifications?.length || 0) > 0, order: 6 },
      { id: 'languages', name: 'Languages', type: 'languages', visible: (r.languages?.length || 0) > 0, order: 7 },
    ];

    if (r.customSections) {
      r.customSections.forEach((customSection) => {
        defaultSections.push({
          id: customSection.id || `custom-${Date.now()}`,
          name: customSection.title,
          type: 'custom',
          visible: true,
          order: customSection.order || 100,
        });
      });
    }

    return defaultSections.sort((a, b) => a.order - b.order);
  };

  const [sections, setSections] = useState<SectionItem[]>(() => buildSections(resume));

  useEffect(() => {
    setSections(buildSections(resume));
  }, [resume.summary, resume.projects, resume.certifications, resume.languages, resume.customSections]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState<'text' | 'list'>('list');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update orders
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index,
        }));

        // Update resume metadata
        const sectionConfigs = updatedItems.map(({ id, visible, order }) => ({
          id,
          visible,
          order,
        }));

        onUpdate({
          metadata: {
            ...resume.metadata,
            sectionConfigs,
            sectionVisibility: updatedItems.reduce((acc, item) => ({
              ...acc,
              [item.id]: item.visible,
            }), {}),
          },
        });

        return updatedItems;
      });
    }
  };

  const handleToggleVisibility = (id: string) => {
    setSections((items) => {
      const newItems = items.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      );

      // Update resume metadata
      onUpdate({
        metadata: {
          ...resume.metadata,
          sectionVisibility: newItems.reduce((acc, item) => ({
            ...acc,
            [item.id]: item.visible,
          }), {}),
        },
      });

      return newItems;
    });
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;

    const newSection: SectionItem = {
      id: `custom-${Date.now()}`,
      name: newSectionName,
      type: 'custom',
      visible: true,
      order: sections.length,
    };

    setSections([...sections, newSection]);

    // Add to resume custom sections
    const customSection: CustomSection = {
      id: newSection.id,
      title: newSectionName,
      content: '',
      items: [],
      order: newSection.order,
      type: newSectionType,
    };

    onUpdate({
      customSections: [...(resume.customSections || []), customSection],
    });

    setNewSectionName('');
    setNewSectionType('list');
    setIsAddDialogOpen(false);
  };

  const handleDeleteSection = (id: string) => {
    setSections((items) => items.filter((item) => item.id !== id));

    // Remove from resume custom sections
    onUpdate({
      customSections: resume.customSections?.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Manage Resume Sections</h3>
        <p className="text-sm text-muted-foreground">
          Drag and drop to reorder sections. Toggle visibility to show or hide sections in your resume.
        </p>
      </div>

      <Button
        onClick={() => setIsAddDialogOpen(true)}
        className="w-full"
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Custom Section
      </Button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SortableSection
                  section={section}
                  onToggleVisibility={handleToggleVisibility}
                  onDelete={section.type === 'custom' ? handleDeleteSection : undefined}
                />
              </motion.div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                placeholder="e.g., Publications, Volunteer Work"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-type">Section Type</Label>
              <Select
                value={newSectionType}
                onValueChange={(value) => setNewSectionType(value as 'text' | 'list')}
              >
                <SelectTrigger id="section-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List (with bullets)</SelectItem>
                  <SelectItem value="text">Text (paragraph)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSection}>Add Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
