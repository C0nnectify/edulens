'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PersonalInfoSection } from './PersonalInfoSection';
import { ExperienceSection } from './ExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';
import { ProjectsSection } from './ProjectsSection';
import { CertificationsSection } from './CertificationsSection';
import type { Resume } from '@/types/resume';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ResumeEditorProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
}

export function ResumeEditor({ resume, onUpdate }: ResumeEditorProps) {
  // Calculate completion percentage
  const calculateCompletion = (): number => {
    let completed = 0;
    let total = 8;

    if (resume.personalInfo?.fullName && resume.personalInfo?.email) completed++;
    if (resume.summary) completed++;
    if (resume.experience?.length > 0) completed++;
    if (resume.education?.length > 0) completed++;
    if (resume.skills?.length > 0) completed++;
    if (resume.projects && resume.projects.length > 0) completed++;
    if (resume.certifications && resume.certifications.length > 0) completed++;
    if (resume.personalInfo?.linkedin || resume.personalInfo?.github) completed++;

    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Resume Completion</CardTitle>
              <CardDescription>Complete all sections for best results</CardDescription>
            </div>
            <div className="text-2xl font-bold text-primary">{completion}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completion} className="h-2" />
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-6 pr-4">
          {/* Personal Info */}
          <PersonalInfoSection
            data={resume.personalInfo}
            onChange={(updates) =>
              onUpdate({
                personalInfo: { ...resume.personalInfo, ...updates },
              })
            }
          />

          {/* Professional Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Professional Summary
              </CardTitle>
              <CardDescription>
                A brief overview of your professional background and goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={resume.summary || ''}
                onChange={(e) => onUpdate({ summary: e.target.value })}
                placeholder="Write a compelling professional summary that highlights your key strengths and career objectives..."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {resume.summary?.length || 0} / 500 characters (recommended: 150-300)
              </p>
            </CardContent>
          </Card>

          <Separator />

          {/* Experience */}
          <ExperienceSection
            data={resume.experience || []}
            onChange={(experience) => onUpdate({ experience })}
          />

          <Separator />

          {/* Education */}
          <EducationSection
            data={resume.education || []}
            onChange={(education) => onUpdate({ education })}
          />

          <Separator />

          {/* Skills */}
          <SkillsSection
            data={resume.skills || []}
            onChange={(skills) => onUpdate({ skills })}
          />

          <Separator />

          {/* Projects */}
          <ProjectsSection
            data={resume.projects || []}
            onChange={(projects) => onUpdate({ projects })}
          />

          <Separator />

          {/* Certifications */}
          <CertificationsSection
            data={resume.certifications || []}
            onChange={(certifications) => onUpdate({ certifications })}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
