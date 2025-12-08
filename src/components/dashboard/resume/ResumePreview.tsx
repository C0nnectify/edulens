'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import type { Resume } from '@/types/resume';
import { ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ResumePreviewProps {
  resume: Resume;
  template?: string;
}

export function ResumePreview({ resume, template = 'modern' }: ResumePreviewProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  return (
  
      <ScrollArea className="h-[calc(100vh)] border rounded-lg bg-muted/30 p-2">
        <div
          className="mx-auto bg-white shadow-lg"
          style={{
            width: '8.5in',
            minHeight: '11in',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s',
          }}
        >
          <div className="p-12 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">
                {resume.personalInfo?.fullName || 'Your Name'}
              </h1>
              {resume.personalInfo?.professionalTitle && (
                <p className="text-xl text-gray-600">{resume.personalInfo.professionalTitle}</p>
              )}
              <div className="flex items-center justify-center gap-3 text-sm text-gray-600 flex-wrap">
                {resume.personalInfo?.email && (
                  <span>{resume.personalInfo.email}</span>
                )}
                {resume.personalInfo?.phone && (
                  <>
                    <span>•</span>
                    <span>{resume.personalInfo.phone}</span>
                  </>
                )}
                {resume.personalInfo?.location?.city && (
                  <>
                    <span>•</span>
                    <span>
                      {resume.personalInfo.location.city}
                      {resume.personalInfo.location.state && `, ${resume.personalInfo.location.state}`}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-blue-600 flex-wrap">
                {resume.personalInfo?.linkedin && (
                  <a href={resume.personalInfo.linkedin}>LinkedIn</a>
                )}
                {resume.personalInfo?.github && (
                  <a href={resume.personalInfo.github}>GitHub</a>
                )}
                {resume.personalInfo?.portfolio && (
                  <a href={resume.personalInfo.portfolio}>Portfolio</a>
                )}
              </div>
            </div>

            <Separator className="bg-gray-300" />

            {/* Summary */}
            {resume.summary && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">PROFESSIONAL SUMMARY</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{resume.summary}</p>
              </div>
            )}

            {/* Experience */}
            {resume.experience && resume.experience.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">WORK EXPERIENCE</h2>
                <div className="space-y-4">
                  {resume.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900">{exp.position}</h3>
                          <p className="text-sm text-gray-700">{exp.company}</p>
                        </div>
                        <div className="text-sm text-gray-600 text-right">
                          <p>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                          {exp.location && <p className="text-xs">{typeof exp.location === 'string' ? exp.location : exp.location.city}</p>}
                        </div>
                      </div>
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
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
                <h2 className="text-lg font-bold text-gray-900 mb-3">EDUCATION</h2>
                <div className="space-y-3">
                  {resume.education.map((edu, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900">{edu.degree} in {edu.field}</h3>
                          <p className="text-sm text-gray-700">{edu.institution}</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {edu.endDate || (edu.current ? 'Present' : '')}
                        </p>
                      </div>
                      {edu.gpa && (
                        <p className="text-sm text-gray-700">GPA: {edu.gpa}{edu.maxGpa && `/${edu.maxGpa}`}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {resume.skills && resume.skills.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">SKILLS</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resume.projects && resume.projects.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">PROJECTS</h2>
                <div className="space-y-3">
                  {resume.projects.map((project, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-gray-900">{project.name}</h3>
                        {project.url && (
                          <a href={project.url} className="text-sm text-blue-600">Link</a>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{project.description}</p>
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.map((tech, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {resume.certifications && resume.certifications.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">CERTIFICATIONS</h2>
                <div className="space-y-2">
                  {resume.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                        <p className="text-sm text-gray-700">{cert.issuer}</p>
                      </div>
                      <p className="text-sm text-gray-600">{cert.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
  );
}
