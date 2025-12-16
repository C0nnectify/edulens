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
  }>;
  skills?: Array<{ name: string; category?: string }>;
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
      })),
    skills: skillsRaw
      .map((s) => (typeof s === 'string' ? ({ name: s } as Record<string, unknown>) : coerceObject(s)))
      .filter((s): s is Record<string, unknown> => Boolean(s))
      .map((s) => ({
        name: typeof (s as any).name === 'string' ? ((s as any).name as string) : '',
        category: typeof (s as any).category === 'string' ? ((s as any).category as string) : undefined,
      }))
      .filter((s) => Boolean(s.name)),
  };

  return draft;
}
