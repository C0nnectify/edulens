'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Mail, Phone, Globe, Linkedin, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Resume, PersonalInfo } from '@/types/resume';

const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  // Accept free-form; we normalize to https://... on submit.
  linkedIn: z.string().optional().or(z.literal('')),
  github: z.string().optional().or(z.literal('')),
  portfolio: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  professionalTitle: z.string().optional(),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

function normalizeUrl(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    if (!parsed.hostname || !parsed.hostname.includes('.')) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

interface PersonalInfoFormProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
  onComplete?: () => void;
}

export default function PersonalInfoForm({
  resume,
  onUpdate,
  onComplete,
}: PersonalInfoFormProps) {
  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: resume.personalInfo.fullName || '',
      email: resume.personalInfo.email || '',
      phone: resume.personalInfo.phone || '',
      city: resume.personalInfo.location?.city || '',
      state: resume.personalInfo.location?.state || '',
      country: resume.personalInfo.location?.country || '',
      linkedIn: resume.personalInfo.linkedIn || resume.personalInfo.linkedin || '',
      github: resume.personalInfo.github || '',
      portfolio: resume.personalInfo.portfolio || '',
      website: resume.personalInfo.website || '',
      professionalTitle: resume.personalInfo.professionalTitle || '',
    },
  });

  const onSubmit = (data: PersonalInfoFormData) => {
    const linkedIn = normalizeUrl(data.linkedIn);
    const github = normalizeUrl(data.github);
    const portfolio = normalizeUrl(data.portfolio);
    const website = normalizeUrl(data.website);

    const personalInfo: PersonalInfo = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      location: {
        city: data.city,
        state: data.state,
        country: data.country,
      },
      linkedIn,
      linkedin: linkedIn,
      github,
      portfolio,
      website,
      professionalTitle: data.professionalTitle,
    };

    onUpdate({ personalInfo });
    if (onComplete) onComplete();
  };

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isValid) {
        onSubmit(value as PersonalInfoFormData);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  // Keep form in sync when resume loads/changes.
  useEffect(() => {
    form.reset({
      fullName: resume.personalInfo.fullName || '',
      email: resume.personalInfo.email || '',
      phone: resume.personalInfo.phone || '',
      city: resume.personalInfo.location?.city || '',
      state: resume.personalInfo.location?.state || '',
      country: resume.personalInfo.location?.country || '',
      linkedIn: resume.personalInfo.linkedIn || resume.personalInfo.linkedin || '',
      github: resume.personalInfo.github || '',
      portfolio: resume.personalInfo.portfolio || '',
      website: resume.personalInfo.website || '',
      professionalTitle: resume.personalInfo.professionalTitle || '',
    });
  }, [form, resume.personalInfo]);

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Full Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      className="text-lg font-medium"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="professionalTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Software Engineer, Marketing Manager"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your current role or desired position
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="California" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Online Presence
            </h3>

            <FormField
              control={form.control}
              name="linkedIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://linkedin.com/in/johndoe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="github"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://github.com/johndoe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="portfolio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Portfolio
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://johndoe.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Save Personal Information
          </Button>
        </form>
      </Form>
    </Card>
  );
}
