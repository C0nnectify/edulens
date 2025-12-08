/**
 * Hook for managing resume data state
 */

import { useState, useCallback } from 'react';
import type { Resume, Experience, Education, Skill, Project, Certification } from '@/types/resume';

export function useResumeData(initialResume: Resume) {
  const [resume, setResume] = useState<Resume>(initialResume);

  const updatePersonalInfo = useCallback((updates: Partial<Resume['personalInfo']>) => {
    setResume(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...updates },
      updatedAt: new Date(),
    }));
  }, []);

  const updateSummary = useCallback((summary: string) => {
    setResume(prev => ({
      ...prev,
      summary,
      updatedAt: new Date(),
    }));
  }, []);

  const updateExperience = useCallback((experiences: Experience[]) => {
    setResume(prev => ({
      ...prev,
      experience: experiences,
      updatedAt: new Date(),
    }));
  }, []);

  const addExperience = useCallback((experience: Experience) => {
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, experience],
      updatedAt: new Date(),
    }));
  }, []);

  const updateEducation = useCallback((education: Education[]) => {
    setResume(prev => ({
      ...prev,
      education,
      updatedAt: new Date(),
    }));
  }, []);

  const addEducation = useCallback((edu: Education) => {
    setResume(prev => ({
      ...prev,
      education: [...prev.education, edu],
      updatedAt: new Date(),
    }));
  }, []);

  const updateSkills = useCallback((skills: Skill[]) => {
    setResume(prev => ({
      ...prev,
      skills,
      updatedAt: new Date(),
    }));
  }, []);

  const addSkill = useCallback((skill: Skill) => {
    setResume(prev => ({
      ...prev,
      skills: [...prev.skills, skill],
      updatedAt: new Date(),
    }));
  }, []);

  const updateProjects = useCallback((projects: Project[]) => {
    setResume(prev => ({
      ...prev,
      projects,
      updatedAt: new Date(),
    }));
  }, []);

  const addProject = useCallback((project: Project) => {
    setResume(prev => ({
      ...prev,
      projects: [...(prev.projects || []), project],
      updatedAt: new Date(),
    }));
  }, []);

  const updateCertifications = useCallback((certifications: Certification[]) => {
    setResume(prev => ({
      ...prev,
      certifications,
      updatedAt: new Date(),
    }));
  }, []);

  const addCertification = useCallback((certification: Certification) => {
    setResume(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), certification],
      updatedAt: new Date(),
    }));
  }, []);

  const updateTemplate = useCallback((template: Resume['template']) => {
    setResume(prev => ({
      ...prev,
      template,
      updatedAt: new Date(),
    }));
  }, []);

  const updateMetadata = useCallback((metadata: Partial<Resume['metadata']>) => {
    setResume(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...metadata } as Resume['metadata'],
      updatedAt: new Date(),
    }));
  }, []);

  return {
    resume,
    setResume,
    updatePersonalInfo,
    updateSummary,
    updateExperience,
    addExperience,
    updateEducation,
    addEducation,
    updateSkills,
    addSkill,
    updateProjects,
    addProject,
    updateCertifications,
    addCertification,
    updateTemplate,
    updateMetadata,
  };
}
