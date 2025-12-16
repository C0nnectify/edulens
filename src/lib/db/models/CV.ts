// MongoDB CV Model (separate collection from Resume)

import mongoose from 'mongoose';
import type { CV } from '@/types/cv';

const personalInfoSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  location: {
    city: String,
    state: String,
    country: String,
  },
  linkedin: String,
  github: String,
  portfolio: String,
  customLinks: [{
    label: String,
    url: String,
  }],
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  location: String,
  startDate: { type: String, required: true },
  endDate: String,
  current: Boolean,
  description: String,
  bullets: [String],
  keywords: [String],
});

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: String,
  location: String,
  startDate: String,
  endDate: String,
  current: Boolean,
  gpa: String,
  honors: [String],
  coursework: [String],
});

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
  },
  years: Number,
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  technologies: [String],
  url: String,
  github: String,
  startDate: String,
  endDate: String,
  bullets: [String],
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  date: { type: String, required: true },
  expiryDate: String,
  credentialId: String,
  url: String,
});

const languageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['native', 'fluent', 'professional', 'intermediate', 'basic'],
    required: true,
  },
});

const customSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: [{
    title: String,
    subtitle: String,
    description: String,
    date: String,
    bullets: [String],
  }],
});

const aiScoreSchema = new mongoose.Schema({
  overall: Number,
  sections: {
    personalInfo: Number,
    summary: Number,
    experience: Number,
    education: Number,
    skills: Number,
    formatting: Number,
    keywords: Number,
    impact: Number,
  },
  atsCompatibility: Number,
  strengths: [String],
  weaknesses: [String],
  suggestions: [String],
});

const cvSchema = new mongoose.Schema<CV>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  personalInfo: { type: personalInfoSchema, required: true },
  summary: String,
  experience: [experienceSchema],
  education: [educationSchema],
  skills: [skillSchema],
  projects: [projectSchema],
  certifications: [certificationSchema],
  languages: [languageSchema],
  customSections: [customSectionSchema],
  template: String,
  aiScore: aiScoreSchema,
  lastAnalyzedAt: Date,
}, {
  timestamps: true,
});

cvSchema.index({ userId: 1, createdAt: -1 });
cvSchema.index({ userId: 1, title: 'text' });

export const CVModel = mongoose.models.CV || mongoose.model<CV>('CV', cvSchema);
