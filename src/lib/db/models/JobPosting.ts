// MongoDB JobPosting Model

import mongoose from 'mongoose';
import { JobPosting } from '@/types/resume';

const jobPostingSchema = new mongoose.Schema<JobPosting>({
  url: String,
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  description: { type: String, required: true },
  requirements: [String],
  responsibilities: [String],
  qualifications: [String],
  skills: [String],
  keywords: [{
    word: String,
    score: Number,
  }],
  experienceLevel: String,
  employmentType: String,
  salary: {
    min: Number,
    max: Number,
    currency: String,
  },
  benefits: [String],
  scrapedAt: Date,
}, {
  timestamps: true,
});

// Indexes
jobPostingSchema.index({ title: 'text', company: 'text', description: 'text' });
jobPostingSchema.index({ url: 1 }, { unique: true, sparse: true });

export const JobPostingModel = mongoose.models.JobPosting || mongoose.model<JobPosting>('JobPosting', jobPostingSchema);