import type { Resume } from '@/types/resume';

// CV is stored separately from Resume (separate collection/model),
// but shares the same core structure for now.
export type CV = Resume;
