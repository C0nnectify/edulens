import { z } from 'zod';
import { Resume, SkillCategory } from '@/types/resume';

export const ResumePatchOpSchema = z.object({
  op: z.enum(['set', 'add', 'remove']),
  path: z.string().min(1),
  value: z.unknown().optional(),
});

export const ResumePatchOpsSchema = z.array(ResumePatchOpSchema).min(1);
export type ResumePatchOp = z.infer<typeof ResumePatchOpSchema>;

function normalizeText(text: string) {
  return text.trim();
}

function toTitleCaseish(value: string) {
  const v = value.trim();
  return v.length === 0 ? v : v[0].toUpperCase() + v.slice(1);
}

export function generateResumePatchOpsFromInstruction(instructionRaw: string): ResumePatchOp[] {
  const normalized = normalizeText(instructionRaw);
  if (!normalized) return [];

  // Allow multiple commands separated by newlines or semicolons.
  const parts = normalized
    .split(/\n|;/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const ops: ResumePatchOp[] = [];

  for (const instruction of parts) {
    const next = _generateSingleInstructionOps(instruction);
    ops.push(...next);
  }

  return ops;
}

function _generateSingleInstructionOps(instruction: string): ResumePatchOp[] {
  if (!instruction) return [];

  const ops: ResumePatchOp[] = [];

  // Title
  {
    const m = instruction.match(/^(?:set|change)\s+title\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'title', value: toTitleCaseish(m[1]) });
      return ops;
    }
  }

  // Summary
  {
    const m = instruction.match(/^(?:set|update|replace)\s+summary\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'summary', value: m[1].trim() });
      return ops;
    }
  }

  // Name
  {
    const m = instruction.match(/^(?:set|change|update)\s+(?:my\s+)?name\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'personalInfo.fullName', value: m[1].trim() });
      return ops;
    }
  }

  // Email
  {
    const m = instruction.match(/^(?:set|change|update)\s+email\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'personalInfo.email', value: m[1].trim() });
      return ops;
    }
  }

  // Phone
  {
    const m = instruction.match(/^(?:set|change|update)\s+phone\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'personalInfo.phone', value: m[1].trim() });
      return ops;
    }
  }

  // Location (best-effort: city, state, country)
  {
    const m = instruction.match(/^(?:set|change|update)\s+location\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'personalInfo.location', value: m[1].trim() });
      return ops;
    }
  }

  // Links
  {
    const m = instruction.match(/^(?:set|change|update)\s+linkedin\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'personalInfo.linkedin', value: m[1].trim() });
      return ops;
    }
  }
  {
    const m = instruction.match(/^(?:set|change|update)\s+github\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'personalInfo.github', value: m[1].trim() });
      return ops;
    }
  }
  {
    const m = instruction.match(/^(?:set|change|update)\s+portfolio\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'personalInfo.portfolio', value: m[1].trim() });
      return ops;
    }
  }
  {
    const m = instruction.match(/^(?:set|change|update)\s+website\s+to\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'set', path: 'personalInfo.website', value: m[1].trim() });
      return ops;
    }
  }

  // Add skill
  {
    const m = instruction.match(/^(?:add|include)\s+skill\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({
        op: 'add',
        path: 'skills',
        value: { name: m[1].trim(), category: SkillCategory.TECHNICAL },
      });
      return ops;
    }
  }

  // Add experience
  {
    // add experience Software Engineer at Acme (2023 - 2025): did x; did y
    const m = instruction.match(
      /^(?:add|include)\s+experience\s+(.+?)\s+at\s+(.+?)(?:\s*\(([^)]+)\))?(?:\s*:\s*(.+))?$/i
    );
    if (m?.[1] && m?.[2]) {
      const position = m[1].trim();
      const company = m[2].trim();
      const dates = (m[3] || '').trim();
      const bulletsRaw = (m[4] || '').trim();
      ops.push({
        op: 'add',
        path: 'experience',
        value: {
          company,
          position,
          dates,
          bullets: bulletsRaw ? bulletsRaw.split(/\s*;\s*/g).filter(Boolean) : [],
        },
      });
      return ops;
    }
  }

  // Add education
  {
    // add education BSc in CSE at North South University (2019 - 2023)
    const m = instruction.match(
      /^(?:add|include)\s+education\s+(.+?)\s+in\s+(.+?)\s+at\s+(.+?)(?:\s*\(([^)]+)\))?$/i
    );
    if (m?.[1] && m?.[2] && m?.[3]) {
      ops.push({
        op: 'add',
        path: 'education',
        value: {
          degree: m[1].trim(),
          field: m[2].trim(),
          institution: m[3].trim(),
          dates: (m[4] || '').trim(),
        },
      });
      return ops;
    }
  }

  // Add project
  {
    // add project EduLens: built X using Y; tech: React, Next.js; url: ...; github: ...
    const m = instruction.match(/^(?:add|include)\s+project\s+(.+?)(?:\s*[:\-]\s*(.+))?$/i);
    if (m?.[1]) {
      const name = m[1].trim();
      const rest = (m[2] || '').trim();
      ops.push({
        op: 'add',
        path: 'projects',
        value: { name, raw: rest },
      });
      return ops;
    }
  }

  // Add certification
  {
    // add certification AWS SAA by Amazon (2024)
    const m = instruction.match(/^(?:add|include)\s+certification\s+(.+?)(?:\s+by\s+(.+?))?(?:\s*\(([^)]+)\))?$/i);
    if (m?.[1]) {
      ops.push({
        op: 'add',
        path: 'certifications',
        value: {
          name: m[1].trim(),
          issuer: (m[2] || '').trim(),
          date: (m[3] || '').trim(),
        },
      });
      return ops;
    }
  }

  // Add language
  {
    // add language Spanish (fluent)
    const m = instruction.match(/^(?:add|include)\s+language\s+(.+?)(?:\s*\(([^)]+)\))?$/i);
    if (m?.[1]) {
      ops.push({
        op: 'add',
        path: 'languages',
        value: { name: m[1].trim(), proficiency: (m[2] || '').trim() },
      });
      return ops;
    }
  }

  // Remove skill
  {
    const m = instruction.match(/^(?:remove|delete)\s+skill\s+(.+)$/i);
    if (m?.[1]) {
      ops.push({ op: 'remove', path: 'skills.byName', value: m[1].trim() });
      return ops;
    }
  }

  // Fallback: no-ops
  return [];
}

export function applyResumePatchOps(current: Resume, ops: ResumePatchOp[]): Resume {
  let next: Resume = { ...current, updatedAt: new Date() };

  for (const op of ops) {
    if (op.op === 'set') {
      if (op.path === 'title' && typeof op.value === 'string') {
        next = { ...next, title: op.value, updatedAt: new Date() };
        continue;
      }
      if (op.path === 'summary' && typeof op.value === 'string') {
        next = { ...next, summary: op.value, updatedAt: new Date() };
        continue;
      }
      if (op.path === 'personalInfo.fullName' && typeof op.value === 'string') {
        next = {
          ...next,
          personalInfo: { ...next.personalInfo, fullName: op.value },
          updatedAt: new Date(),
        };
        continue;
      }
      if (op.path === 'personalInfo.email' && typeof op.value === 'string') {
        next = {
          ...next,
          personalInfo: { ...next.personalInfo, email: op.value },
          updatedAt: new Date(),
        };
        continue;
      }

      if (op.path === 'personalInfo.phone' && typeof op.value === 'string') {
        next = {
          ...next,
          personalInfo: { ...next.personalInfo, phone: op.value },
          updatedAt: new Date(),
        };
        continue;
      }

      if (op.path === 'personalInfo.linkedin' && typeof op.value === 'string') {
        next = {
          ...next,
          personalInfo: { ...next.personalInfo, linkedin: op.value },
          updatedAt: new Date(),
        };
        continue;
      }

      if (op.path === 'personalInfo.github' && typeof op.value === 'string') {
        next = {
          ...next,
          personalInfo: { ...next.personalInfo, github: op.value },
          updatedAt: new Date(),
        };
        continue;
      }

      if (op.path === 'personalInfo.portfolio' && typeof op.value === 'string') {
        next = {
          ...next,
          personalInfo: { ...next.personalInfo, portfolio: op.value },
          updatedAt: new Date(),
        };
        continue;
      }

      if (op.path === 'personalInfo.website' && typeof op.value === 'string') {
        next = {
          ...next,
          personalInfo: { ...next.personalInfo, website: op.value },
          updatedAt: new Date(),
        };
        continue;
      }

      if (op.path === 'personalInfo.location' && typeof op.value === 'string') {
        const raw = op.value.trim();
        const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
        const city = parts.length >= 3 ? parts[0] : parts.length === 2 ? parts[0] : '';
        const state = parts.length >= 3 ? parts[1] : '';
        const country = parts.length >= 3 ? parts[2] : parts.length === 2 ? parts[1] : parts[0] || '';
        next = {
          ...next,
          personalInfo: {
            ...next.personalInfo,
            location: { ...(next.personalInfo.location || { country: '' }), city, state, country },
          },
          updatedAt: new Date(),
        };
        continue;
      }
    }

    if (op.op === 'add') {
      if (op.path === 'skills' && op.value && typeof op.value === 'object') {
        const obj = op.value as Record<string, unknown>;
        const name = obj.name;
        if (typeof name === 'string' && name.trim().length > 0) {
          const category = typeof obj.category === 'string' ? obj.category : SkillCategory.TECHNICAL;
          const skill = {
            id: `skill-${Date.now()}`,
            name: name.trim(),
            category,
          };
          next = {
            ...next,
            skills: [...(next.skills || []), skill],
            updatedAt: new Date(),
          };
        }
        continue;
      }

      if (op.path === 'experience' && op.value && typeof op.value === 'object') {
        const obj = op.value as Record<string, unknown>;
        const company = typeof obj.company === 'string' ? obj.company.trim() : '';
        const position = typeof obj.position === 'string' ? obj.position.trim() : '';
        const dates = typeof obj.dates === 'string' ? obj.dates.trim() : '';
        const bullets = Array.isArray(obj.bullets) ? (obj.bullets as string[]).filter(Boolean) : [];
        const [startDateRaw, endDateRaw] = dates.split(/\s*[-–—]\s*/g);
        const startDate = (startDateRaw || '').trim();
        const endDate = (endDateRaw || '').trim();
        const current = /present|current/i.test(endDate);

        if (company || position) {
          next = {
            ...next,
            experience: [
              ...(next.experience || []),
              {
                id: `exp-${Date.now()}`,
                company,
                position,
                location: '',
                startDate,
                endDate: endDate || '',
                current,
                achievements: [],
                bullets,
              },
            ],
            updatedAt: new Date(),
          };
        }
        continue;
      }

      if (op.path === 'education' && op.value && typeof op.value === 'object') {
        const obj = op.value as Record<string, unknown>;
        const institution = typeof obj.institution === 'string' ? obj.institution.trim() : '';
        const degree = typeof obj.degree === 'string' ? obj.degree.trim() : '';
        const field = typeof obj.field === 'string' ? obj.field.trim() : '';
        const dates = typeof obj.dates === 'string' ? obj.dates.trim() : '';
        const [startDateRaw, endDateRaw] = dates.split(/\s*[-–—]\s*/g);
        const startDate = (startDateRaw || '').trim();
        const endDate = (endDateRaw || '').trim();
        const current = /present|current/i.test(endDate);

        if (institution || degree || field) {
          next = {
            ...next,
            education: [
              ...(next.education || []),
              {
                id: `edu-${Date.now()}`,
                institution,
                degree,
                field,
                location: '',
                startDate,
                endDate: endDate || '',
                current,
              },
            ],
            updatedAt: new Date(),
          };
        }
        continue;
      }

      if (op.path === 'projects' && op.value && typeof op.value === 'object') {
        const obj = op.value as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name.trim() : '';
        const raw = typeof obj.raw === 'string' ? obj.raw.trim() : '';
        if (name) {
          next = {
            ...next,
            projects: [
              ...((next.projects || []) as any[]),
              {
                id: `proj-${Date.now()}`,
                name,
                description: raw,
                technologies: [],
              },
            ],
            updatedAt: new Date(),
          };
        }
        continue;
      }

      if (op.path === 'certifications' && op.value && typeof op.value === 'object') {
        const obj = op.value as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name.trim() : '';
        const issuer = typeof obj.issuer === 'string' ? obj.issuer.trim() : '';
        const date = typeof obj.date === 'string' ? obj.date.trim() : '';
        if (name || issuer) {
          next = {
            ...next,
            certifications: [
              ...((next.certifications || []) as any[]),
              {
                id: `cert-${Date.now()}`,
                name,
                issuer,
                date,
              },
            ],
            updatedAt: new Date(),
          };
        }
        continue;
      }

      if (op.path === 'languages' && op.value && typeof op.value === 'object') {
        const obj = op.value as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name.trim() : '';
        const proficiency = typeof obj.proficiency === 'string' ? obj.proficiency.trim() : '';
        if (name) {
          next = {
            ...next,
            languages: [
              ...((next.languages || []) as any[]),
              {
                id: `lang-${Date.now()}`,
                name,
                proficiency: (proficiency || 'intermediate') as any,
              },
            ],
            updatedAt: new Date(),
          };
        }
        continue;
      }
    }

    if (op.op === 'remove') {
      if (op.path === 'skills.byName' && typeof op.value === 'string') {
        const target = op.value.trim().toLowerCase();
        next = {
          ...next,
          skills: (next.skills || []).filter((s) => s.name.toLowerCase() !== target),
          updatedAt: new Date(),
        };
        continue;
      }
    }
  }

  return next;
}
