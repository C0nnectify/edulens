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

interface ImprovedResumePreviewProps {
  resume: Resume;
  zoom?: number;
}

export default function ImprovedResumePreview({
  resume,
  zoom: initialZoom = 100,
}: ImprovedResumePreviewProps) {
  const [zoom, setZoom] = useState(initialZoom);

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
    <div className="flex flex-col h-full">
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
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <ScrollArea className="flex-1 bg-slate-100 dark:bg-slate-950">
        <div className="p-6 flex justify-center">
          <motion.div
            className="bg-white shadow-lg"
            style={{
              width: '8.5in',
              minHeight: '11in',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <div className="p-12 space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  {resume.personalInfo.fullName || 'Your Name'}
                </h1>
                {resume.personalInfo.professionalTitle && (
                  <p className="text-lg text-slate-600 mb-2">
                    {resume.personalInfo.professionalTitle}
                  </p>
                )}
                <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-600">
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
                  <div className="flex flex-wrap justify-center gap-3 text-sm text-blue-600 mt-2">
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

              {/* Professional Summary */}
              {resume.summary && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-wide">
                    Professional Summary
                  </h2>
                  <Separator className="mb-3 bg-slate-800" />
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {resume.summary}
                  </p>
                </div>
              )}

              {/* Experience */}
              {resume.experience && resume.experience.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-wide">
                    Professional Experience
                  </h2>
                  <Separator className="mb-3 bg-slate-800" />
                  <div className="space-y-4">
                    {resume.experience.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-bold text-slate-900">{exp.position}</h3>
                            <p className="text-slate-700">{exp.company}</p>
                          </div>
                          <div className="text-right text-sm text-slate-600">
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
                          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 ml-2">
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
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-wide">
                    Education
                  </h2>
                  <Separator className="mb-3 bg-slate-800" />
                  <div className="space-y-3">
                    {resume.education.map((edu) => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {edu.degree} in {edu.field}
                            </h3>
                            <p className="text-slate-700">{edu.institution}</p>
                            {edu.gpa && (
                              <p className="text-sm text-slate-600">
                                GPA: {edu.gpa}/{edu.maxGpa || 4.0}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-slate-600">
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
                          <p className="text-sm text-slate-600 mt-1">
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
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-wide">
                    Skills
                  </h2>
                  <Separator className="mb-3 bg-slate-800" />
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, i) => (
                      <span
                        key={skill.id || i}
                        className="px-3 py-1 bg-slate-100 text-slate-800 rounded text-sm font-medium"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {resume.projects && resume.projects.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-wide">
                    Projects
                  </h2>
                  <Separator className="mb-3 bg-slate-800" />
                  <div className="space-y-3">
                    {resume.projects.map((project) => (
                      <div key={project.id}>
                        <h3 className="font-bold text-slate-900">{project.name}</h3>
                        {project.role && (
                          <p className="text-sm text-slate-600">{project.role}</p>
                        )}
                        <p className="text-sm text-slate-700 mt-1">
                          {project.description}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
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
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-wide">
                    Certifications
                  </h2>
                  <Separator className="mb-3 bg-slate-800" />
                  <div className="space-y-2">
                    {resume.certifications.map((cert) => (
                      <div key={cert.id} className="flex justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">{cert.name}</h3>
                          <p className="text-sm text-slate-700">{cert.issuer}</p>
                        </div>
                        <p className="text-sm text-slate-600">
                          {formatDate(cert.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {resume.languages && resume.languages.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-wide">
                    Languages
                  </h2>
                  <Separator className="mb-3 bg-slate-800" />
                  <div className="flex flex-wrap gap-4">
                    {resume.languages.map((lang, i) => (
                      <span key={lang.id || i} className="text-sm text-slate-700">
                        <span className="font-semibold">{lang.name}:</span>{' '}
                        {lang.proficiency.charAt(0).toUpperCase() +
                          lang.proficiency.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}
