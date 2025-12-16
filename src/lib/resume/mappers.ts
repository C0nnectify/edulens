import { Resume, ResumeTemplate, SkillCategory } from '@/types/resume';

export type ResumeApiShape = unknown;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function fullNameFromApi(personalInfo: unknown): string {
  const pi = asRecord(personalInfo);
  const first = typeof pi.firstName === 'string' ? pi.firstName : '';
  const last = typeof pi.lastName === 'string' ? pi.lastName : '';
  const combined = `${first} ${last}`.trim();
  return combined;
}

export function resumeApiToUi(api: ResumeApiShape): Resume {
  const a = asRecord(api);
  const personalInfo = asRecord(a.personalInfo);
  const fullName = fullNameFromApi(personalInfo);

  const design = asRecord(a.design);
  const designColors = asRecord(design.colors);
  const designLayout = asRecord(design.layout);

  const firstName = typeof personalInfo.firstName === 'string' ? personalInfo.firstName : undefined;
  const lastName = typeof personalInfo.lastName === 'string' ? personalInfo.lastName : undefined;
  const email = typeof personalInfo.email === 'string' ? personalInfo.email : '';
  const phone = typeof personalInfo.phone === 'string' ? personalInfo.phone : undefined;
  const linkedin =
    typeof personalInfo.linkedin === 'string'
      ? personalInfo.linkedin
      : typeof personalInfo.linkedIn === 'string'
      ? personalInfo.linkedIn
      : undefined;
  const github = typeof personalInfo.github === 'string' ? personalInfo.github : undefined;
  const portfolio = typeof personalInfo.portfolio === 'string' ? personalInfo.portfolio : undefined;

  const location = asRecord(personalInfo.location);
  const locationUi = {
    city: typeof location.city === 'string' ? location.city : undefined,
    state: typeof location.state === 'string' ? location.state : undefined,
    country: typeof location.country === 'string' ? location.country : '',
  };

  return {
    userId: typeof a.userId === 'string' ? a.userId : '',
    title: typeof a.title === 'string' ? a.title : 'Untitled Resume',
    createdAt: a.createdAt ? new Date(String(a.createdAt)) : new Date(),
    updatedAt: a.updatedAt ? new Date(String(a.updatedAt)) : new Date(),
    template: (a.template as ResumeTemplate) || ResumeTemplate.MODERN,
    design:
      Object.keys(design).length > 0
        ? {
            colors:
              Object.keys(designColors).length > 0
                ? {
                    primary:
                      typeof designColors.primary === 'string'
                        ? designColors.primary
                        : undefined,
                    secondary:
                      typeof designColors.secondary === 'string'
                        ? designColors.secondary
                        : undefined,
                  }
                : undefined,
            font: typeof design.font === 'string' ? design.font : undefined,
            layout:
              Object.keys(designLayout).length > 0
                ? {
                    columns:
                      designLayout.columns === 1 || designLayout.columns === 2
                        ? (designLayout.columns as 1 | 2)
                        : undefined,
                    spacing:
                      typeof designLayout.spacing === 'string'
                        ? (designLayout.spacing as any)
                        : undefined,
                  }
                : undefined,
          }
        : undefined,
    personalInfo: {
      fullName,
      firstName,
      lastName,
      email,
      phone,
      location: locationUi,
      linkedin,
      github,
      portfolio,
    },
    summary: (a.summary as string) || '',
    experience: Array.isArray(a.experience)
      ? (a.experience as Array<unknown>).map((raw, idx: number) => {
          const e = asRecord(raw);
          const bullets = Array.isArray(e.bullets) ? (e.bullets as string[]) : [];
          const achievements = Array.isArray(e.achievements)
            ? (e.achievements as string[])
            : bullets;
          const description = typeof e.description === 'string' ? e.description : undefined;
          const keywords = Array.isArray(e.keywords) ? (e.keywords as string[]) : undefined;
          return {
            id: (e.id as string) || `exp-${idx}`,
            company: (e.company as string) || '',
            position: (e.position as string) || '',
            location: (e.location as string) || '',
            startDate: (e.startDate as string) || '',
            endDate: (e.endDate as string) || '',
            current: Boolean(e.current),
            description,
            bullets,
            achievements,
            keywords,
          };
        })
      : [],
    education: Array.isArray(a.education)
      ? (a.education as Array<unknown>).map((raw, idx: number) => {
          const ed = asRecord(raw);
          const coursework = Array.isArray(ed.coursework) ? (ed.coursework as string[]) : undefined;
          const honors = Array.isArray(ed.honors) ? (ed.honors as string[]) : undefined;
          return {
            id: (ed.id as string) || `edu-${idx}`,
            institution: (ed.institution as string) || '',
            degree: (ed.degree as string) || '',
            field: (ed.field as string) || '',
            location: (ed.location as string) || '',
            startDate: (ed.startDate as string) || '',
            endDate: (ed.endDate as string) || '',
            current: Boolean(ed.current),
            gpa: typeof ed.gpa === 'string' ? ed.gpa : undefined,
            coursework,
            honors,
          };
        })
      : [],
    skills: Array.isArray(a.skills)
      ? (a.skills as Array<unknown>).map((raw, idx: number) => {
          const s = asRecord(raw);
          const level = typeof s.level === 'string' ? s.level : undefined;
          const years = typeof s.years === 'number' ? s.years : undefined;
          return {
            id: (s.id as string) || `skill-${idx}`,
            name: (s.name as string) || '',
            category: (s.category as string) || SkillCategory.TECHNICAL,
            level,
            years,
          };
        })
      : [],
    projects: Array.isArray(a.projects)
      ? (a.projects as Array<unknown>).map((raw, idx: number) => {
          const p = asRecord(raw);
          const url = typeof p.url === 'string' ? p.url : undefined;
          const githubUrl = typeof p.github === 'string' ? p.github : undefined;
          const bullets = Array.isArray(p.bullets) ? (p.bullets as string[]) : undefined;
          return {
            id: (p.id as string) || `proj-${idx}`,
            name: (p.name as string) || '',
            description: (p.description as string) || '',
            technologies: Array.isArray(p.technologies) ? (p.technologies as string[]) : [],
            url,
            github: githubUrl,
            bullets,
          };
        })
      : undefined,
  } as Resume;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = (fullName || '').trim();
  if (!cleaned) return { firstName: '', lastName: '' };
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function dateToApiString(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return String(value);
}

function nonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function hasAnyMeaningfulText(values: Array<unknown>): boolean {
  return values.some((v) => nonEmptyString(v).length > 0);
}

function normalizeUrl(value: unknown): string {
  const raw = nonEmptyString(value);
  if (!raw) return '';

  // If user typed a bare domain (e.g. linkedin.com/in/x), coerce to https://...
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withScheme);
    // Basic sanity: require a hostname like example.com
    if (!parsed.hostname || !parsed.hostname.includes('.')) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Convert UI Resume shape (uses `fullName`) into API input shape (requires `firstName` + `lastName`).
 */
export function resumeUiToApiInput(ui: Resume) {
  const fullName = ui.personalInfo?.fullName || '';
  const split = splitFullName(fullName);

  const design = ui.design;
  const designHasAny =
    Boolean(design?.font) ||
    Boolean(design?.colors?.primary) ||
    Boolean(design?.colors?.secondary) ||
    Boolean(design?.layout?.columns) ||
    Boolean(design?.layout?.spacing);

  return {
    title: ui.title || 'Untitled Resume',
    personalInfo: {
      firstName: ui.personalInfo?.firstName || split.firstName || 'Your',
      lastName: ui.personalInfo?.lastName || split.lastName || 'Name',
      email: ui.personalInfo?.email || 'your.email@example.com',
      phone: ui.personalInfo?.phone || '',
      location: ui.personalInfo?.location,
      linkedin: normalizeUrl(ui.personalInfo?.linkedin || ui.personalInfo?.linkedIn || ''),
      github: normalizeUrl(ui.personalInfo?.github || ''),
      portfolio: normalizeUrl(ui.personalInfo?.portfolio || ''),
      customLinks: Array.isArray(ui.personalInfo?.customLinks)
        ? ui.personalInfo.customLinks
            .map((l: any) => ({
              label: nonEmptyString(l?.label),
              url: normalizeUrl(l?.url),
            }))
            .filter((l: any) => l.label.length > 0 && l.url.length > 0)
        : undefined,
    },
    summary: ui.summary || '',
    experience: (ui.experience || [])
      .map((e) => {
        const company = nonEmptyString(e.company);
        const position = nonEmptyString(e.position);
        const startDate = dateToApiString(e.startDate);
        const bullets =
          Array.isArray(e.bullets) && e.bullets.length > 0
            ? e.bullets
            : Array.isArray(e.achievements) && e.achievements.length > 0
            ? e.achievements
            : [''];

        return {
          company,
          position,
          location: typeof e.location === 'string' ? e.location : '',
          startDate,
          endDate: e.endDate ? dateToApiString(e.endDate) : '',
          current: Boolean(e.current),
          description: e.description || '',
          bullets,
          keywords: e.keywords,
          __meta: { company, position, startDate },
        };
      })
      // Only keep entries with required fields to satisfy API validation.
      .filter((e: any) => hasAnyMeaningfulText([e.__meta?.company, e.__meta?.position, e.__meta?.startDate]))
      .filter((e: any) => e.__meta?.company && e.__meta?.position && e.__meta?.startDate)
      .map(({ __meta, ...rest }: any) => rest),
    education: (ui.education || [])
      .map((ed) => {
        const institution = nonEmptyString(ed.institution);
        const degree = nonEmptyString(ed.degree);
        return {
          institution,
          degree,
          field: ed.field || '',
          location: typeof ed.location === 'string' ? ed.location : '',
          startDate: ed.startDate ? dateToApiString(ed.startDate) : '',
          endDate: ed.endDate ? dateToApiString(ed.endDate) : '',
          current: Boolean(ed.current),
          gpa: typeof ed.gpa === 'string' ? ed.gpa : ed.gpa ? String(ed.gpa) : '',
          honors: ed.honors,
          coursework: ed.coursework,
          __meta: { institution, degree },
        };
      })
      .filter((ed: any) => hasAnyMeaningfulText([ed.__meta?.institution, ed.__meta?.degree]))
      .filter((ed: any) => ed.__meta?.institution && ed.__meta?.degree)
      .map(({ __meta, ...rest }: any) => rest),
    skills: (ui.skills || [])
      .map((s) => ({
        name: nonEmptyString(s.name),
        category: typeof s.category === 'string' ? s.category : String(s.category || ''),
        level: s.level,
        years: s.years,
      }))
      .filter((s) => s.name.length > 0),
    projects: (ui.projects || [])
      .map((p: any) => {
        const name = nonEmptyString(p?.name);
        const description = nonEmptyString(p?.description);
        const technologies = Array.isArray(p?.technologies) ? p.technologies : [];
        return {
          id: p?.id,
          name,
          description,
          technologies,
          url: p?.url || '',
          github: p?.github || p?.githubUrl || '',
          startDate: p?.startDate ? dateToApiString(p.startDate) : '',
          endDate: p?.endDate ? dateToApiString(p.endDate) : '',
          bullets: Array.isArray(p?.bullets) ? p.bullets : undefined,
          __meta: { name, description, technologiesCount: technologies.length },
        };
      })
      .filter((p: any) => hasAnyMeaningfulText([p.__meta?.name, p.__meta?.description]))
      .filter((p: any) => p.__meta?.name && p.__meta?.description && (p.__meta?.technologiesCount ?? 0) > 0)
      .map(({ __meta, ...rest }: any) => rest),
    certifications: (ui.certifications || [])
      .map((c: any) => {
        const name = nonEmptyString(c?.name);
        const issuer = nonEmptyString(c?.issuer);
        const date = nonEmptyString(dateToApiString(c?.date));
        return {
          id: c?.id,
          name,
          issuer,
          date,
          expiryDate: c?.expiryDate ? dateToApiString(c.expiryDate) : '',
          credentialId: c?.credentialId || '',
          url: c?.url || '',
          __meta: { name, issuer, date },
        };
      })
      .filter((c: any) => hasAnyMeaningfulText([c.__meta?.name, c.__meta?.issuer, c.__meta?.date]))
      .filter((c: any) => c.__meta?.name && c.__meta?.issuer && c.__meta?.date)
      .map(({ __meta, ...rest }: any) => rest),
    languages: (ui.languages || [])
      // Keep only entries that look like the API schema shape.
      .filter((l: any) => nonEmptyString(l?.name).length > 0 && nonEmptyString(l?.proficiency).length > 0),
    customSections: (ui.customSections || [])
      .map((s: any) => {
        const title = nonEmptyString(s?.title);
        const items = Array.isArray(s?.items)
          ? s.items
              .map((it: any) => ({
                title: it?.title,
                subtitle: it?.subtitle,
                description: it?.description,
                date: it?.date ? dateToApiString(it.date) : undefined,
                bullets: Array.isArray(it?.bullets) ? it.bullets : undefined,
              }))
              // drop empty items
              .filter((it: any) => hasAnyMeaningfulText([it?.title, it?.subtitle, it?.description, it?.date]))
          : [];
        return { id: s?.id, title, items, __meta: { title, itemsCount: items.length } };
      })
      .filter((s: any) => hasAnyMeaningfulText([s.__meta?.title]))
      .filter((s: any) => s.__meta?.title && (s.__meta?.itemsCount ?? 0) > 0)
      .map(({ __meta, ...rest }: any) => rest),
    template: ui.template,
    design: designHasAny ? design : undefined,
  };
}
