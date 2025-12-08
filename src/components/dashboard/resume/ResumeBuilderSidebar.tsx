'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Resume } from '@/types/resume';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Code,
  Lightbulb,
  Award,
  Languages,
  Layout,
  CheckCircle2,
  Eye,
  EyeOff,
  GripVertical,
  AlertCircle,
} from 'lucide-react';
import { PersonalInfoSection } from './PersonalInfoSection';
import { ProfessionalSummary } from './sections/ProfessionalSummary';
import { ExperienceSection } from './ExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';
import { ProjectsSection } from './ProjectsSection';
import { CertificationsSection } from './CertificationsSection';
import { LanguageSection } from './sections/LanguageSection';
import { CustomSection } from './sections/CustomSection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import toast from 'react-hot-toast';

interface ResumeBuilderSidebarProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
  currentSection: string;
  onSectionChange: (section: string) => void;
}

interface SectionConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  isComplete: (resume: Resume) => boolean;
  isRequired?: boolean;
  visible: boolean;
  order: number;
}

function SortableSection({
  section,
  resume,
  currentSection,
  onSectionClick,
  onToggleVisibility,
  isActive,
}: {
  section: SectionConfig;
  resume: Resume;
  currentSection: string;
  onSectionClick: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  isActive: boolean;
}) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const isComplete = section.isComplete(resume);
  const isHidden = !section.visible;

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <AccordionItem
        value={section.id}
        className={cn(
          'border rounded-lg overflow-hidden transition-all',
          isDragging ? 'shadow-2xl ring-2 ring-primary' : 'hover:shadow-md',
          isHidden && 'opacity-50 bg-gray-50'
        )}
      >
        <AccordionTrigger
          onClick={() => onSectionClick(section.id)}
          className={cn(
            'px-4 py-3 hover:no-underline transition-colors',
            currentSection === section.id
              ? 'bg-blue-50 border-l-4 border-l-blue-600'
              : 'bg-white'
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            {/* Section Icon */}
            <div
              className={cn(
                'p-2 rounded-lg transition-colors',
                isComplete && !isHidden
                  ? 'bg-green-100 text-green-600'
                  : isHidden
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {section.icon}
            </div>

            {/* Section Title */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h3 className={cn('font-semibold text-sm', isHidden && 'text-gray-400')}>
                  {section.title}
                </h3>
                {section.isRequired && (
                  <span className="text-xs text-red-500">*</span>
                )}
                {isHidden && (
                  <span className="text-xs text-gray-500">(Hidden)</span>
                )}
              </div>
              {isComplete && !isHidden && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </p>
              )}
              {section.isRequired && !isComplete && (
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Required
                </p>
              )}
            </div>

            {/* Visibility Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(section.id);
                    }}
                    disabled={section.isRequired}
                  >
                    {isHidden ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {section.isRequired
                    ? 'Required section'
                    : isHidden
                    ? 'Show in resume'
                    : 'Hide from resume'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </AccordionTrigger>

        {!isHidden && (
          <AccordionContent className="px-4 pb-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {section.id === 'personalInfo' && (
                <PersonalInfoSection
                  data={resume.personalInfo}
                  onChange={(updates) =>
                    onSectionClick(section.id)
                  }
                />
              )}
              {section.id === 'summary' && (
                <ProfessionalSummary
                  data={resume.summary || ''}
                  onChange={() => onSectionClick(section.id)}
                />
              )}
              {section.id === 'experience' && (
                <ExperienceSection
                  data={resume.experience}
                  onChange={() => onSectionClick(section.id)}
                />
              )}
              {section.id === 'education' && (
                <EducationSection
                  data={resume.education}
                  onChange={() => onSectionClick(section.id)}
                />
              )}
              {section.id === 'skills' && (
                <SkillsSection
                  data={resume.skills}
                  onChange={() => onSectionClick(section.id)}
                />
              )}
              {section.id === 'projects' && (
                <ProjectsSection
                  data={resume.projects || []}
                  onChange={() => onSectionClick(section.id)}
                />
              )}
              {section.id === 'certifications' && (
                <CertificationsSection
                  data={resume.certifications || []}
                  onChange={() => onSectionClick(section.id)}
                />
              )}
              {section.id === 'languages' && (
                <LanguageSection
                  data={resume.languages || []}
                  onChange={() => onSectionClick(section.id)}
                />
              )}
              {section.id === 'custom' && (
                <CustomSection
                  data={resume.customSections || []}
                  onChange={() => onSectionClick(section.id)}
                />
              )}
            </motion.div>
          </AccordionContent>
        )}
      </AccordionItem>
    </div>
  );
}

export function ResumeBuilderSidebar({
  resume,
  onUpdate,
  currentSection,
  onSectionChange,
}: ResumeBuilderSidebarProps) {
  const [openSections, setOpenSections] = useState<string[]>(['personalInfo']);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize section configurations
  const defaultSections: SectionConfig[] = [
    {
      id: 'personalInfo',
      title: 'Personal Information',
      icon: <User className="h-4 w-4" />,
      component: PersonalInfoSection,
      isComplete: (r) => !!(r.personalInfo.fullName && r.personalInfo.email),
      isRequired: true,
      visible: true,
      order: 0,
    },
    {
      id: 'summary',
      title: 'Professional Summary',
      icon: <FileText className="h-4 w-4" />,
      component: ProfessionalSummary,
      isComplete: (r) => !!r.summary && r.summary.length >= 100,
      visible: true,
      order: 1,
    },
    {
      id: 'experience',
      title: 'Work Experience',
      icon: <Briefcase className="h-4 w-4" />,
      component: ExperienceSection,
      isComplete: (r) => r.experience.length > 0,
      visible: true,
      order: 2,
    },
    {
      id: 'education',
      title: 'Education',
      icon: <GraduationCap className="h-4 w-4" />,
      component: EducationSection,
      isComplete: (r) => r.education.length > 0,
      visible: true,
      order: 3,
    },
    {
      id: 'skills',
      title: 'Skills',
      icon: <Code className="h-4 w-4" />,
      component: SkillsSection,
      isComplete: (r) => r.skills.length >= 3,
      visible: true,
      order: 4,
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: <Lightbulb className="h-4 w-4" />,
      component: ProjectsSection,
      isComplete: (r) => (r.projects?.length || 0) > 0,
      visible: true,
      order: 5,
    },
    {
      id: 'certifications',
      title: 'Certifications',
      icon: <Award className="h-4 w-4" />,
      component: CertificationsSection,
      isComplete: (r) => (r.certifications?.length || 0) > 0,
      visible: true,
      order: 6,
    },
    {
      id: 'languages',
      title: 'Languages',
      icon: <Languages className="h-4 w-4" />,
      component: LanguageSection,
      isComplete: (r) => (r.languages?.length || 0) > 0,
      visible: true,
      order: 7,
    },
    {
      id: 'custom',
      title: 'Custom Sections',
      icon: <Layout className="h-4 w-4" />,
      component: CustomSection,
      isComplete: (r) => (r.customSections?.length || 0) > 0,
      visible: true,
      order: 8,
    },
  ];

  // Get section order and visibility from resume metadata
  const [sections, setSections] = useState<SectionConfig[]>(() => {
    const savedConfigs = resume.metadata?.sectionConfigs;
    if (savedConfigs && savedConfigs.length > 0) {
      return defaultSections
        .map((section) => {
          const saved = savedConfigs.find((s) => s.id === section.id);
          return saved
            ? { ...section, visible: saved.visible, order: saved.order }
            : section;
        })
        .sort((a, b) => a.order - b.order);
    }
    return defaultSections;
  });

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const visibleSections = sections.filter((s) => s.visible);
    const completedSections = visibleSections.filter((section) =>
      section.isComplete(resume)
    ).length;
    return Math.round((completedSections / visibleSections.length) * 100);
  }, [resume, sections]);

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    if (!openSections.includes(sectionId)) {
      setOpenSections([...openSections, sectionId]);
    }
  };

  const handleToggleVisibility = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section?.isRequired) {
      toast.error('Cannot hide required sections');
      return;
    }

    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    setSections(updatedSections);

    // Save to resume metadata
    const sectionConfigs = updatedSections.map((s) => ({
      id: s.id,
      visible: s.visible,
      order: s.order,
    }));

    onUpdate({
      metadata: {
        ...resume.metadata,
        sectionConfigs,
      } as Resume['metadata'],
    });

    toast.success(
      section?.visible
        ? `${section.title} hidden from resume`
        : `${section?.title} shown in resume`
    );
  };

  const handleToggleAll = (visible: boolean) => {
    const updatedSections = sections.map((s) =>
      s.isRequired ? s : { ...s, visible }
    );
    setSections(updatedSections);

    const sectionConfigs = updatedSections.map((s) => ({
      id: s.id,
      visible: s.visible,
      order: s.order,
    }));

    onUpdate({
      metadata: {
        ...resume.metadata,
        sectionConfigs,
      } as Resume['metadata'],
    });

    toast.success(visible ? 'All sections shown' : 'Optional sections hidden');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          order: index,
        })
      );

      setSections(reorderedSections);

      // Save to resume metadata
      const sectionConfigs = reorderedSections.map((s) => ({
        id: s.id,
        visible: s.visible,
        order: s.order,
      }));

      onUpdate({
        metadata: {
          ...resume.metadata,
          sectionConfigs,
        } as Resume['metadata'],
      });

      toast.success('Section order updated');
    }

    setActiveId(null);
  };

  const activeSection = sections.find((s) => s.id === activeId);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Progress */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Resume Builder</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Completion</span>
            <span className="font-bold text-blue-600">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-gray-500">
            {sections.filter((s) => s.visible && s.isComplete(resume)).length} of{' '}
            {sections.filter((s) => s.visible).length} visible sections completed
          </p>
        </div>

        {/* Toggle All Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(true)}
            className="flex-1 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Show All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(false)}
            className="flex-1 text-xs"
          >
            <EyeOff className="h-3 w-3 mr-1" />
            Hide Optional
          </Button>
        </div>
      </div>

      {/* Sections List with Drag & Drop */}
      <ScrollArea className="flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="px-4 py-4"
            >
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  resume={resume}
                  currentSection={currentSection}
                  onSectionClick={handleSectionClick}
                  onToggleVisibility={handleToggleVisibility}
                  isActive={section.id === activeId}
                />
              ))}
            </Accordion>
          </SortableContext>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeSection && (
              <div className="bg-white border-2 border-primary rounded-lg p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    {activeSection.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{activeSection.title}</h3>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </ScrollArea>
    </div>
  );
}
