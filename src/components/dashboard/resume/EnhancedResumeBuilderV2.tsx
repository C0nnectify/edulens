'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Lightbulb,
  FolderOpen,
  Languages,
  Palette,
  Download,
  Save,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Resume, ResumeTemplate } from '@/types/resume';
import { ResumePatchOpsSchema, applyResumePatchOps, generateResumePatchOpsFromInstruction } from '@/lib/resume/instructionPatch';
import PersonalInfoForm from './forms/PersonalInfoForm';
import ExperienceForm from './forms/ExperienceForm';
import EducationForm from './forms/EducationForm';
import SkillsForm from './forms/SkillsForm';
import ProjectsForm from './forms/ProjectsForm';
import CertificationsForm from './forms/CertificationsForm';
import ProfessionalSummaryForm from './forms/ProfessionalSummaryForm';
import LanguagesForm from './forms/LanguagesForm';
import SectionManager from './SectionManager';
import DesignCustomizer from './DesignCustomizer';
import ImprovedResumePreview from './ImprovedResumePreview';
import { TemplateSwitcher } from './TemplateSwitcher';
import { getTemplatePresetById } from '@/lib/resume/designPresets';

interface ResumeStep {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType<any>;
  required?: boolean;
}

const RESUME_STEPS: ResumeStep[] = [
  {
    id: 'personal',
    title: 'Personal Info',
    icon: User,
    description: 'Basic contact information',
    component: PersonalInfoForm,
    required: true,
  },
  {
    id: 'summary',
    title: 'Summary',
    icon: FileText,
    description: 'Professional summary',
    component: ProfessionalSummaryForm,
  },
  {
    id: 'experience',
    title: 'Experience',
    icon: Briefcase,
    description: 'Work history',
    component: ExperienceForm,
    required: true,
  },
  {
    id: 'education',
    title: 'Education',
    icon: GraduationCap,
    description: 'Educational background',
    component: EducationForm,
    required: true,
  },
  {
    id: 'skills',
    title: 'Skills',
    icon: Lightbulb,
    description: 'Technical & soft skills',
    component: SkillsForm,
    required: true,
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: FolderOpen,
    description: 'Portfolio projects',
    component: ProjectsForm,
  },
  {
    id: 'certifications',
    title: 'Certifications',
    icon: Award,
    description: 'Professional certifications',
    component: CertificationsForm,
  },
  {
    id: 'languages',
    title: 'Languages',
    icon: Languages,
    description: 'Language proficiencies',
    component: LanguagesForm,
  },
  {
    id: 'sections',
    title: 'Manage Sections',
    icon: FileText,
    description: 'Reorder and customize',
    component: SectionManager,
  },
  {
    id: 'design',
    title: 'Design',
    icon: Palette,
    description: 'Customize appearance',
    component: DesignCustomizer,
  },
];

interface EnhancedResumeBuilderV2Props {
  initialResume?: Resume;
  initialTemplate?: string;
  documentLabel?: string;
  onSave?: (resume: Resume) => void;
  onExport?: () => void;
}

export default function EnhancedResumeBuilderV2({
  initialResume,
  initialTemplate,
  documentLabel = 'Resume',
  onSave,
  onExport,
}: EnhancedResumeBuilderV2Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [resume, setResume] = useState<Resume>(
    initialResume || {
      userId: '',
      title: 'Untitled Resume',
      createdAt: new Date(),
      updatedAt: new Date(),
      template: (initialTemplate as ResumeTemplate) || ResumeTemplate.MODERN,
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: { country: '' },
      },
      experience: [],
      education: [],
      skills: [],
    }
  );
  const hasAppliedInitialResumeRef = React.useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const [instruction, setInstruction] = useState('');
  const [lastInstructionError, setLastInstructionError] = useState<string | null>(null);

  useEffect(() => {
    // Apply initialResume when it arrives (async load from id/draftKey).
    if (initialResume && !hasAppliedInitialResumeRef.current) {
      setResume(initialResume);
      hasAppliedInitialResumeRef.current = true;
      return;
    }

    // If the page provides only an initial template, ensure it's applied.
    if (!hasAppliedInitialResumeRef.current && initialTemplate) {
      setResume((prev) => ({
        ...prev,
        template: (initialTemplate as ResumeTemplate) || prev.template,
      }));
    }
  }, [initialResume, initialTemplate]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;

    // Don't auto-save until we have applied initial data (prevents saving an empty default while draft/id loads).
    if (!hasAppliedInitialResumeRef.current && initialResume) return;

    // Avoid creating empty resumes.
    const isTrulyEmpty =
      !(resume.personalInfo?.fullName || '').trim() &&
      !(resume.personalInfo?.email || '').trim() &&
      !(resume.summary || '').trim() &&
      (resume.experience?.length ?? 0) === 0 &&
      (resume.education?.length ?? 0) === 0 &&
      (resume.skills?.length ?? 0) === 0;
    if (isTrulyEmpty) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [resume, autoSaveEnabled, initialResume]);

  const handleSave = async (isAutoSave = false) => {
    setIsSaving(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onSave) {
        await onSave(resume);
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save resume:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyInstruction = () => {
    const ops = generateResumePatchOpsFromInstruction(instruction);
    if (ops.length === 0) {
      setLastInstructionError('Could not understand that instruction. Try: "add skill Python" or "set summary to ..."');
      return;
    }

    const validation = ResumePatchOpsSchema.safeParse(ops);
    if (!validation.success) {
      setLastInstructionError('Invalid edit operations generated.');
      return;
    }

    setResume((prev) => applyResumePatchOps(prev, validation.data));
    setInstruction('');
    setLastInstructionError(null);
  };

  const updateResume = useCallback((updates: Partial<Resume>) => {
    setResume(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  }, []);

  const handleTemplateChange = useCallback(
    (template: ResumeTemplate) => {
      const preset = getTemplatePresetById(String(template));
      updateResume({
        template,
        design: {
          colors: {
            primary: preset.colors.primary,
            secondary: preset.colors.secondary,
          },
          font: preset.fonts.heading,
          layout: {
            columns: preset.layout.columns,
            spacing: preset.layout.spacing,
          },
        },
      });
    },
    [updateResume]
  );

  const markStepComplete = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => new Set(prev).add(stepIndex));
  }, []);

  const handleNext = () => {
    if (currentStep < RESUME_STEPS.length - 1) {
      markStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = (completedSteps.size / RESUME_STEPS.length) * 100;
  const CurrentStepComponent = RESUME_STEPS[currentStep].component;

  return (
    <div className="flex h-screen bg-background">
      {/* Dark Sidebar - Step Navigation */}
      <div className="w-72 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold mb-1">{documentLabel} Builder</h2>
          <Input
            value={resume.title || ''}
            onChange={(e) => updateResume({ title: e.target.value })}
            onBlur={() => {
              const nextTitle = (resume.title || '').trim();
              if (!nextTitle) updateResume({ title: 'Untitled Resume' });
            }}
            placeholder="Untitled Resume"
            className="mt-1 h-9 bg-slate-900 text-slate-200 placeholder:text-slate-500 border-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Progress</span>
              <span>{completedSteps.size}/{RESUME_STEPS.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {RESUME_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : isCompleted
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 mt-0.5" />
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {step.title}
                      {step.required && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {step.description}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : `Save ${documentLabel}`}
          </Button>
          <Button
            onClick={onExport}
            variant="outline"
            disabled={!onExport}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          {lastSaved && (
            <p className="text-xs text-slate-500 text-center">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Main Content - Form Editor */}
      <div className="max-w-100 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {RESUME_STEPS[currentStep].title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {RESUME_STEPS[currentStep].description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TemplateSwitcher
                currentTemplate={resume.template}
                onTemplateChange={handleTemplateChange}
                className="hidden md:inline-flex"
              />
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === RESUME_STEPS.length - 1}
                size="sm"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent
                  resume={resume}
                  onUpdate={updateResume}
                  onComplete={() => markStepComplete(currentStep)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Right Sidebar - Live Preview */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold">Live Preview</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Changes appear instantly
          </p>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="text-sm font-semibold mb-2">Edit by message</div>
          <div className="flex gap-2">
            <Input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder='Try: "add experience Software Engineer at Acme (2023 - 2025): built X; improved Y"'
              className="h-9"
            />
            <Button size="sm" onClick={handleApplyInstruction}>
              Apply
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Examples: set email to ... · set linkedin to ... · add project ... · add certification ... · add language ...
          </div>
          {lastInstructionError && (
            <div className="text-xs text-red-600 mt-2">{lastInstructionError}</div>
          )}
        </div>
        <ImprovedResumePreview resume={resume} onDownload={onExport} />
      </div>
    </div>
  );
}
