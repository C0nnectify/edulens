'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PersonalInfo } from '@/types/resume';
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase } from 'lucide-react';

interface PersonalInfoSectionProps {
  data: PersonalInfo;
  onChange: (updates: Partial<PersonalInfo>) => void;
}

export function PersonalInfoSection({ data, onChange }: PersonalInfoSectionProps) {
  const handleInputChange = (field: keyof PersonalInfo) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  const handleLocationChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({
      location: {
        ...data.location,
        [field]: e.target.value,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Basic contact information and professional links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={data.fullName || ''}
              onChange={handleInputChange('fullName')}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalTitle">Professional Title</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="professionalTitle"
                value={data.professionalTitle || ''}
                onChange={handleInputChange('professionalTitle')}
                placeholder="Senior Software Engineer"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={data.email || ''}
                onChange={handleInputChange('email')}
                placeholder="john.doe@example.com"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={data.phone || ''}
                onChange={handleInputChange('phone')}
                placeholder="+1 (555) 123-4567"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="City"
              value={data.location?.city || ''}
              onChange={handleLocationChange('city')}
            />
            <Input
              placeholder="State/Province"
              value={data.location?.state || ''}
              onChange={handleLocationChange('state')}
            />
            <Input
              placeholder="Country"
              value={data.location?.country || ''}
              onChange={handleLocationChange('country')}
            />
          </div>
        </div>

        {/* Professional Links */}
        <div className="space-y-4">
          <Label>Professional Links</Label>
          <div className="space-y-3">
            <div className="relative">
              <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="LinkedIn profile URL"
                value={data.linkedin || data.linkedIn || ''}
                onChange={handleInputChange('linkedin')}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="GitHub profile URL"
                value={data.github || ''}
                onChange={handleInputChange('github')}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Portfolio/Website URL"
                value={data.portfolio || data.website || ''}
                onChange={handleInputChange('portfolio')}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
