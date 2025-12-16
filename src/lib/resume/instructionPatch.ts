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
  const instruction = normalizeText(instructionRaw);
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
