import { Resume, ResumeTemplate, SkillCategory } from '@/types/resume';

export type DraftStoragePayload = {
  documentType?: 'resume' | 'cv' | string | null;
  documentDraft?: unknown;
};

export type ResumeDraftV1 = {
  version: 1;
  title?: string;
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: { city?: string; state?: string; country?: string };
    linkedin?: string;
    github?: string;
    portfolio?: string;
    website?: string;
  };
  summary?: string;
  experience?: Array<{
    company?: string;
    position?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    bullets?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    gpa?: string;
    coursework?: string[];
    honors?: string[];
  }>;
  skills?: Array<{ name: string; category?: string }>;
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    bullets?: string[];
    url?: string;
    github?: string;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    expiryDate?: string;
    credentialId?: string;
    url?: string;
  }>;
  languages?: Array<{
    name?: string;
    proficiency?: string;
  }>;
};

export type CVDraftV1 = ResumeDraftV1 & {
  // Keep the same shape for now (separate model/collection is handled server-side).
};

function splitFullName(fullName?: string): { firstName: string; lastName: string } {
  const cleaned = (fullName || '').trim();
  if (!cleaned) return { firstName: '', lastName: '' };
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function resumeFromDraft(draft: ResumeDraftV1, overrides?: Partial<Resume>): Resume {
  const fullName = draft.personalInfo?.fullName || '';
  const { firstName, lastName } = splitFullName(fullName);

  const draftLocation = draft.personalInfo?.location;
  const location = {
    city: draftLocation?.city,
    state: draftLocation?.state,
    country: draftLocation?.country ?? '',
  };

  const resume: Resume = {
    userId: '',
    title: draft.title || 'Untitled Resume',
    createdAt: new Date(),
    updatedAt: new Date(),
    template: ResumeTemplate.MODERN,
    personalInfo: {
      fullName,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: draft.personalInfo?.email || '',
      phone: draft.personalInfo?.phone,
      location,
      linkedin: draft.personalInfo?.linkedin,
      github: draft.personalInfo?.github,
      portfolio: draft.personalInfo?.portfolio,
      website: draft.personalInfo?.website,
    },
    summary: draft.summary || '',
    experience:
      (draft.experience || []).map((e, idx) => ({
        id: `exp-${Date.now()}-${idx}`,
        company: e.company || '',
        position: e.position || '',
        location: e.location || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        current: Boolean(e.current),
        achievements: [],
        bullets: e.bullets || [],
      })) || [],
    education:
      (draft.education || []).map((e, idx) => ({
        id: `edu-${Date.now()}-${idx}`,
        institution: e.institution || '',
        degree: e.degree || '',
        field: e.field || '',
        location: e.location || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        current: Boolean(e.current),
      })) || [],
    skills:
      (draft.skills || []).map((s, idx) => ({
        id: `skill-${Date.now()}-${idx}`,
        name: s.name,
        category: s.category || SkillCategory.TECHNICAL,
      })) || [],
    projects:
      (draft.projects || [])
        .filter((p) => Boolean((p?.name || '').trim() || (p?.description || '').trim()))
        .map((p, idx) => ({
          id: `proj-${Date.now()}-${idx}`,
          name: p.name || '',
          description: p.description || '',
          technologies: Array.isArray(p.technologies) ? p.technologies.filter(Boolean) : [],
          bullets: Array.isArray(p.bullets) ? p.bullets.filter(Boolean) : [],
          url: p.url,
          github: p.github,
        })),
    certifications:
      (draft.certifications || [])
        .filter((c) => Boolean((c?.name || '').trim() || (c?.issuer || '').trim()))
        .map((c, idx) => ({
          id: `cert-${Date.now()}-${idx}`,
          name: c.name || '',
          issuer: c.issuer || '',
          date: c.date || '',
          expiryDate: c.expiryDate || undefined,
          credentialId: c.credentialId || undefined,
          url: c.url || undefined,
        })),
    languages:
      (draft.languages || [])
        .filter((l) => Boolean((l?.name || '').trim()))
        .map((l, idx) => ({
          id: `lang-${Date.now()}-${idx}`,
          name: l.name || '',
          // Coerce to allowed enum values if possible; otherwise default to intermediate.
          proficiency:
            (l.proficiency as any) === 'native' ||
            (l.proficiency as any) === 'fluent' ||
            (l.proficiency as any) === 'professional' ||
            (l.proficiency as any) === 'intermediate' ||
            (l.proficiency as any) === 'basic'
              ? (l.proficiency as any)
              : 'intermediate',
        })),
  };

  return { ...resume, ...(overrides || {}) };
}

function coerceObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function coerceArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function coerceLocation(value: unknown): { city?: string; state?: string; country?: string } | undefined {
  const obj = coerceObject(value);
  if (!obj) return undefined;
  const city = typeof obj.city === 'string' ? obj.city : undefined;
  const state = typeof obj.state === 'string' ? obj.state : undefined;
  const country = typeof obj.country === 'string' ? obj.country : undefined;
  return { city, state, country };
}

/**
 * Best-effort: extract a ResumeDraftV1 from a localStorage payload produced by `/new-dashboard`.
 * Supports either a direct draft shape or a nested `{ resume: {...} }` shape.
 */
export function resumeDraftFromStoragePayload(payload: DraftStoragePayload): ResumeDraftV1 | null {
  const rawDraft = payload.documentDraft;
  const asObj = coerceObject(rawDraft);
  if (!asObj) return null;

  const nestedResume = coerceObject(asObj.resume);
  const candidate = nestedResume || asObj;

  const candidateTitle = typeof candidate.title === 'string' ? candidate.title : undefined;
  const candidateSummary = typeof candidate.summary === 'string' ? candidate.summary : undefined;

  const personalInfoRaw = coerceObject(candidate.personalInfo) || coerceObject((candidate as any).personal_info);
  const fullName =
    (typeof (personalInfoRaw as any)?.fullName === 'string' ? ((personalInfoRaw as any).fullName as string) : undefined) ||
    (typeof (personalInfoRaw as any)?.full_name === 'string' ? ((personalInfoRaw as any).full_name as string) : undefined);
  const email =
    (typeof (personalInfoRaw as any)?.email === 'string' ? ((personalInfoRaw as any).email as string) : undefined) ||
    (typeof (personalInfoRaw as any)?.e_mail === 'string' ? ((personalInfoRaw as any).e_mail as string) : undefined);

  const experienceRaw = coerceArray((candidate as any).experience || (candidate as any).workExperience || (candidate as any).work_experience);
  const educationRaw = coerceArray((candidate as any).education || (candidate as any).educations);
  const skillsRaw = coerceArray((candidate as any).skills || (candidate as any).skillset || (candidate as any).skill_set);
  const projectsRaw = coerceArray((candidate as any).projects || (candidate as any).project || (candidate as any).portfolio);
  const certificationsRaw = coerceArray((candidate as any).certifications || (candidate as any).certs || (candidate as any).certifications_list);
  const languagesRaw = coerceArray((candidate as any).languages || (candidate as any).languageSkills || (candidate as any).language_skills);

  const draft: ResumeDraftV1 = {
    version: 1,
    title: candidateTitle,
    summary: candidateSummary,
    personalInfo: {
      fullName,
      email,
      phone: typeof personalInfoRaw?.phone === 'string' ? (personalInfoRaw.phone as string) : undefined,
      location: coerceLocation(personalInfoRaw?.location),
      linkedin: typeof personalInfoRaw?.linkedin === 'string' ? (personalInfoRaw.linkedin as string) : undefined,
      github: typeof personalInfoRaw?.github === 'string' ? (personalInfoRaw.github as string) : undefined,
      portfolio: typeof personalInfoRaw?.portfolio === 'string' ? (personalInfoRaw.portfolio as string) : undefined,
      website: typeof (personalInfoRaw as any)?.website === 'string' ? ((personalInfoRaw as any).website as string) : undefined,
    },
    experience: experienceRaw
      .map((e) => coerceObject(e))
      .filter((e): e is Record<string, unknown> => Boolean(e))
      .map((e) => ({
        company: typeof (e as any).company === 'string' ? ((e as any).company as string) : undefined,
        position: typeof (e as any).position === 'string' ? ((e as any).position as string) : undefined,
        location: typeof (e as any).location === 'string' ? ((e as any).location as string) : undefined,
        startDate:
          typeof (e as any).startDate === 'string'
            ? ((e as any).startDate as string)
            : typeof (e as any).start_date === 'string'
              ? ((e as any).start_date as string)
              : undefined,
        endDate:
          typeof (e as any).endDate === 'string'
            ? ((e as any).endDate as string)
            : typeof (e as any).end_date === 'string'
              ? ((e as any).end_date as string)
              : undefined,
        current: typeof (e as any).current === 'boolean' ? ((e as any).current as boolean) : undefined,
        bullets: Array.isArray((e as any).bullets) ? ((e as any).bullets as string[]) : undefined,
      })),
    education: educationRaw
      .map((e) => coerceObject(e))
      .filter((e): e is Record<string, unknown> => Boolean(e))
      .map((e) => ({
        institution: typeof (e as any).institution === 'string' ? ((e as any).institution as string) : undefined,
        degree: typeof (e as any).degree === 'string' ? ((e as any).degree as string) : undefined,
        field: typeof (e as any).field === 'string' ? ((e as any).field as string) : undefined,
        location: typeof (e as any).location === 'string' ? ((e as any).location as string) : undefined,
        startDate:
          typeof (e as any).startDate === 'string'
            ? ((e as any).startDate as string)
            : typeof (e as any).start_date === 'string'
              ? ((e as any).start_date as string)
              : undefined,
        endDate:
          typeof (e as any).endDate === 'string'
            ? ((e as any).endDate as string)
            : typeof (e as any).end_date === 'string'
              ? ((e as any).end_date as string)
              : undefined,
        current: typeof (e as any).current === 'boolean' ? ((e as any).current as boolean) : undefined,
        gpa: typeof (e as any).gpa === 'string' ? ((e as any).gpa as string) : undefined,
        coursework: Array.isArray((e as any).coursework) ? ((e as any).coursework as string[]) : undefined,
        honors: Array.isArray((e as any).honors) ? ((e as any).honors as string[]) : undefined,
      })),
    skills: skillsRaw
      .map((s) => (typeof s === 'string' ? ({ name: s } as Record<string, unknown>) : coerceObject(s)))
      .filter((s): s is Record<string, unknown> => Boolean(s))
      .map((s) => ({
        name: typeof (s as any).name === 'string' ? ((s as any).name as string) : '',
        category: typeof (s as any).category === 'string' ? ((s as any).category as string) : undefined,
      }))
      .filter((s) => Boolean(s.name)),

    projects: projectsRaw
      .map((p) => coerceObject(p))
      .filter((p): p is Record<string, unknown> => Boolean(p))
      .map((p) => ({
        name: typeof (p as any).name === 'string' ? ((p as any).name as string) : undefined,
        description: typeof (p as any).description === 'string' ? ((p as any).description as string) : undefined,
        technologies: Array.isArray((p as any).technologies) ? ((p as any).technologies as string[]) : undefined,
        bullets: Array.isArray((p as any).bullets) ? ((p as any).bullets as string[]) : undefined,
        url: typeof (p as any).url === 'string' ? ((p as any).url as string) : undefined,
        github: typeof (p as any).github === 'string' ? ((p as any).github as string) : undefined,
      })),
    certifications: certificationsRaw
      .map((c) => coerceObject(c))
      .filter((c): c is Record<string, unknown> => Boolean(c))
      .map((c) => ({
        name: typeof (c as any).name === 'string' ? ((c as any).name as string) : undefined,
        issuer: typeof (c as any).issuer === 'string' ? ((c as any).issuer as string) : undefined,
        date: typeof (c as any).date === 'string' ? ((c as any).date as string) : undefined,
        expiryDate: typeof (c as any).expiryDate === 'string' ? ((c as any).expiryDate as string) : undefined,
        credentialId: typeof (c as any).credentialId === 'string' ? ((c as any).credentialId as string) : undefined,
        url: typeof (c as any).url === 'string' ? ((c as any).url as string) : undefined,
      })),
    languages: languagesRaw
      .map((l) => (typeof l === 'string' ? ({ name: l } as Record<string, unknown>) : coerceObject(l)))
      .filter((l): l is Record<string, unknown> => Boolean(l))
      .map((l) => ({
        name: typeof (l as any).name === 'string' ? ((l as any).name as string) : '',
        proficiency: typeof (l as any).proficiency === 'string' ? ((l as any).proficiency as string) : undefined,
      }))
      .filter((l) => Boolean(l.name)),
  };

  return draft;
}
