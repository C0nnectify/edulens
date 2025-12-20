'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Resume } from '@/types/resume';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getTemplatePresetById } from '@/lib/resume/designPresets';

interface ImprovedResumePreviewProps {
  resume: Resume;
  zoom?: number;
  onDownload?: () => void;
}

export default function ImprovedResumePreview({
  resume,
  zoom: initialZoom = 100,
  onDownload,
}: ImprovedResumePreviewProps) {
  const [zoom, setZoom] = useState(initialZoom);

  const preset = getTemplatePresetById(String(resume.template || ''));
  const spacing = resume.design?.layout?.spacing ?? preset.layout.spacing;
  const columns = resume.design?.layout?.columns ?? preset.layout.columns;
  const fontFamily = resume.design?.font ?? preset.fonts.body;

  const colors = {
    primary: resume.design?.colors?.primary ?? preset.colors.primary,
    secondary: resume.design?.colors?.secondary ?? preset.colors.secondary ?? preset.colors.primary,
    text: preset.colors.text,
    heading: preset.colors.heading,
    background: preset.colors.background,
    border: preset.colors.border ?? '#e5e7eb',
  };

  const contentClassName = cn(
    spacing === 'compact' ? 'p-10 space-y-4' : spacing === 'spacious' ? 'p-14 space-y-8' : 'p-12 space-y-6'
  );

  const contentColumnsStyle: React.CSSProperties | undefined =
    columns === 2
      ? {
          columnCount: 2,
          columnGap: '2rem',
        }
      : undefined;

  const sectionStyle: React.CSSProperties = { breakInside: 'avoid' };

  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return `rgba(0,0,0,${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  const formatDate = (date?: Date | string) => {
    if (!date) return '';
    if (date instanceof Date) {
      return format(date, 'MMM yyyy');
    }
    try {
      return format(new Date(date), 'MMM yyyy');
    } catch {
      return date;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDownload} disabled={!onDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <ScrollArea className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-950">
        <div className="p-6 flex justify-center">
          <motion.div
            data-resume-preview
            className="bg-white shadow-lg"
            style={{
              width: '8.5in',
              minHeight: '11in',
              // Use CSS zoom so the scroll height matches the visual size.
              // (transform: scale(...) does not affect layout/scroll height.)
              zoom: zoom / 100,
              backgroundColor: colors.background,
              color: colors.text,
              fontFamily,
            } as React.CSSProperties}
          >
            <div className={contentClassName}>
              {/* Header */}
              <div
                className="text-center border-b-2 pb-4"
                style={{ borderColor: colors.primary }}
              >
                <h1 className="text-3xl font-bold mb-1" style={{ color: colors.heading }}>
                  {resume.personalInfo.fullName || 'Your Name'}
                </h1>
                {resume.personalInfo.professionalTitle && (
                  <p className="text-lg mb-2" style={{ color: colors.text }}>
                    {resume.personalInfo.professionalTitle}
                  </p>
                )}
                <div className="flex flex-wrap justify-center gap-3 text-sm" style={{ color: colors.text }}>
                  {resume.personalInfo.email && (
                    <span>{resume.personalInfo.email}</span>
                  )}
                  {resume.personalInfo.phone && (
                    <span>•</span>
                  )}
                  {resume.personalInfo.phone && (
                    <span>{resume.personalInfo.phone}</span>
                  )}
                  {resume.personalInfo.location?.city && (
                    <>
                      <span>•</span>
                      <span>
                        {resume.personalInfo.location.city}
                        {resume.personalInfo.location.state &&
                          `, ${resume.personalInfo.location.state}`}
                      </span>
                    </>
                  )}
                </div>
                {(resume.personalInfo.linkedIn ||
                  resume.personalInfo.github ||
                  resume.personalInfo.portfolio) && (
                  <div
                    className="flex flex-wrap justify-center gap-3 text-sm mt-2"
                    style={{ color: colors.primary }}
                  >
                    {resume.personalInfo.linkedIn && (
                      <span>LinkedIn</span>
                    )}
                    {resume.personalInfo.github && (
                      <>
                        {resume.personalInfo.linkedIn && <span>•</span>}
                        <span>GitHub</span>
                      </>
                    )}
                    {resume.personalInfo.portfolio && (
                      <>
                        {(resume.personalInfo.linkedIn || resume.personalInfo.github) && (
                          <span>•</span>
                        )}
                        <span>Portfolio</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={contentColumnsStyle}>
                {/* Professional Summary */}
                {resume.summary && (
                  <div style={sectionStyle}>
                    <h2
                      className="text-xl font-bold mb-2 uppercase tracking-wide"
                      style={{ color: colors.heading }}
                    >
                      Professional Summary
                    </h2>
                    <Separator className="mb-3" style={{ backgroundColor: colors.primary }} />
                    <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                      {resume.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {resume.experience && resume.experience.length > 0 && (
                  <div style={sectionStyle}>
                    <h2
                      className="text-xl font-bold mb-2 uppercase tracking-wide"
                      style={{ color: colors.heading }}
                    >
                      Professional Experience
                    </h2>
                    <Separator className="mb-3" style={{ backgroundColor: colors.primary }} />
                    <div className="space-y-4">
                      {resume.experience.map((exp) => (
                        <div key={exp.id}>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="font-bold" style={{ color: colors.heading }}>
                                {exp.position}
                              </h3>
                              <p style={{ color: colors.text }}>{exp.company}</p>
                            </div>
                            <div className="text-right text-sm" style={{ color: colors.text }}>
                              <p>
                                {formatDate(exp.startDate)} -{' '}
                                {exp.current ? 'Present' : formatDate(exp.endDate)}
                              </p>
                              {exp.location && (
                                <p>
                                  {typeof exp.location === 'string'
                                    ? exp.location
                                    : exp.location.city}
                                </p>
                              )}
                            </div>
                          </div>
                          {exp.achievements && exp.achievements.length > 0 && (
                            <ul className="list-disc list-inside space-y-1 text-sm ml-2" style={{ color: colors.text }}>
                              {exp.achievements.map((achievement, i) => (
                                <li key={i}>{achievement}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resume.education && resume.education.length > 0 && (
                  <div style={sectionStyle}>
                    <h2
                      className="text-xl font-bold mb-2 uppercase tracking-wide"
                      style={{ color: colors.heading }}
                    >
                      Education
                    </h2>
                    <Separator className="mb-3" style={{ backgroundColor: colors.primary }} />
                    <div className="space-y-3">
                      {resume.education.map((edu) => (
                        <div key={edu.id}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold" style={{ color: colors.heading }}>
                                {edu.degree} in {edu.field}
                              </h3>
                              <p style={{ color: colors.text }}>{edu.institution}</p>
                              {edu.gpa && (
                                <p className="text-sm" style={{ color: colors.text }}>
                                  GPA: {edu.gpa}/{edu.maxGpa || 4.0}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm" style={{ color: colors.text }}>
                              <p>
                                {formatDate(edu.startDate)} -{' '}
                                {edu.current ? 'Present' : formatDate(edu.endDate)}
                              </p>
                              {edu.location && (
                                <p>
                                  {typeof edu.location === 'string'
                                    ? edu.location
                                    : edu.location.city}
                                </p>
                              )}
                            </div>
                          </div>
                          {edu.honors && edu.honors.length > 0 && (
                            <p className="text-sm mt-1" style={{ color: colors.text }}>
                              <span className="font-semibold">Honors:</span>{' '}
                              {edu.honors.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {resume.skills && resume.skills.length > 0 && (
                  <div style={sectionStyle}>
                    <h2
                      className="text-xl font-bold mb-2 uppercase tracking-wide"
                      style={{ color: colors.heading }}
                    >
                      Skills
                    </h2>
                    <Separator className="mb-3" style={{ backgroundColor: colors.primary }} />
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((skill, i) => (
                        <span
                          key={skill.id || i}
                          className="px-3 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: hexToRgba(colors.secondary, 0.12),
                            color: colors.heading,
                          }}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {resume.projects && resume.projects.length > 0 && (
                  <div style={sectionStyle}>
                    <h2
                      className="text-xl font-bold mb-2 uppercase tracking-wide"
                      style={{ color: colors.heading }}
                    >
                      Projects
                    </h2>
                    <Separator className="mb-3" style={{ backgroundColor: colors.primary }} />
                    <div className="space-y-3">
                      {resume.projects.map((project) => (
                        <div key={project.id}>
                          <h3 className="font-bold" style={{ color: colors.heading }}>
                            {project.name}
                          </h3>
                          {project.role && (
                            <p className="text-sm" style={{ color: colors.text }}>
                              {project.role}
                            </p>
                          )}
                          <p className="text-sm mt-1" style={{ color: colors.text }}>
                            {project.description}
                          </p>
                          <p className="text-sm mt-1" style={{ color: colors.text }}>
                            <span className="font-semibold">Technologies:</span>{' '}
                            {project.technologies.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {resume.certifications && resume.certifications.length > 0 && (
                  <div style={sectionStyle}>
                    <h2
                      className="text-xl font-bold mb-2 uppercase tracking-wide"
                      style={{ color: colors.heading }}
                    >
                      Certifications
                    </h2>
                    <Separator className="mb-3" style={{ backgroundColor: colors.primary }} />
                    <div className="space-y-2">
                      {resume.certifications.map((cert) => (
                        <div key={cert.id} className="flex justify-between">
                          <div>
                            <h3 className="font-bold" style={{ color: colors.heading }}>
                              {cert.name}
                            </h3>
                            <p className="text-sm" style={{ color: colors.text }}>
                              {cert.issuer}
                            </p>
                          </div>
                          <p className="text-sm" style={{ color: colors.text }}>
                            {formatDate(cert.date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {resume.languages && resume.languages.length > 0 && (
                  <div style={sectionStyle}>
                    <h2
                      className="text-xl font-bold mb-2 uppercase tracking-wide"
                      style={{ color: colors.heading }}
                    >
                      Languages
                    </h2>
                    <Separator className="mb-3" style={{ backgroundColor: colors.primary }} />
                    <div className="flex flex-wrap gap-4">
                      {resume.languages.map((lang, i) => (
                        <span key={lang.id || i} className="text-sm" style={{ color: colors.text }}>
                          <span className="font-semibold">{lang.name}:</span>{' '}
                          {lang.proficiency.charAt(0).toUpperCase() +
                            lang.proficiency.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}
