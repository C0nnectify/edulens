'use client';

/**
 * SmartProfile Page - Beautiful User Profile View
 * 
 * Comprehensive profile display with modern UI, section-based editing,
 * and real-time sync status.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  GraduationCap,
  FileText,
  Briefcase,
  FlaskConical,
  Award,
  Target,
  DollarSign,
  Users,
  ChevronRight,
  ChevronDown,
  Edit2,
  Check,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Globe,
  Calendar,
  Building,
  MapPin,
  Phone,
} from 'lucide-react';
import { useSmartProfile } from '@/hooks/useSmartProfile';

// Section configuration with beautiful gradients
const SECTIONS = [
  { key: 'personalInfo' as const, label: 'Personal Info', icon: User, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { key: 'contactInfo' as const, label: 'Contact', icon: Mail, gradient: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  { key: 'education' as const, label: 'Education', icon: GraduationCap, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { key: 'testScores' as const, label: 'Test Scores', icon: FileText, gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { key: 'workExperience' as const, label: 'Work Experience', icon: Briefcase, gradient: 'from-slate-500 to-gray-600', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  { key: 'research' as const, label: 'Research', icon: FlaskConical, gradient: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  { key: 'skills' as const, label: 'Skills', icon: Sparkles, gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  { key: 'awards' as const, label: 'Awards', icon: Award, gradient: 'from-yellow-500 to-orange-600', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  { key: 'applicationGoals' as const, label: 'Target Programs', icon: Target, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  { key: 'lorTracking' as const, label: 'Recommendations', icon: Users, gradient: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { key: 'financialDetails' as const, label: 'Finances', icon: DollarSign, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
];

export default function SmartProfilePage() {
  const {
    profile,
    computed,
    isLoading,
    error,
    isSyncing,
    fetchProfile,
    createProfile,
    syncToRoadmap,
    profileCompleteness,
    pendingSyncs,
    nextActions,
    hasProfile,
  } = useSmartProfile();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Create profile if doesn't exist
  const handleCreateProfile = async () => {
    await createProfile();
  };

  // Sync all to roadmap
  const handleSync = async () => {
    await syncToRoadmap();
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Create Your SmartProfile
          </h1>
          <p className="text-gray-600 mb-8">
            Your SmartProfile is the single source of truth for your application journey.
            All your documents, roadmap, and applications will sync with this profile.
          </p>
          <button
            onClick={handleCreateProfile}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-violet-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Creating...
              </span>
            ) : (
              'Create SmartProfile'
            )}
          </button>
          
          <Link 
            href="/new-dashboard"
            className="block mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/new-dashboard"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-500">
                  Last updated {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Completeness */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{profileCompleteness}%</p>
                  <p className="text-xs text-gray-500">Complete</p>
                </div>
                <div className="w-12 h-12 relative">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${profileCompleteness * 1.26} 126`}
                      className="text-blue-500 transition-all duration-500"
                    />
                  </svg>
                </div>
              </div>

              {/* Sync Button */}
              {pendingSyncs > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{pendingSyncs} pending</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-blue-500 to-violet-600 p-6 text-center">
                <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-white">
                    {profile?.personalInfo?.firstName?.charAt(0) || profile?.personalInfo?.lastName?.charAt(0) || 'U'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {profile?.personalInfo?.firstName} {profile?.personalInfo?.lastName || 'User'}
                </h2>
                {profile?.contactInfo?.email && (
                  <p className="text-white/80 text-sm mt-1">{profile.contactInfo.email}</p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Quick Stats</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Sections Complete</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {computed?.completeness.completedCount ?? 0}/{computed?.completeness.totalCount ?? SECTIONS.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Target Programs</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {profile?.applicationGoals?.programs?.length ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-600">Recommenders</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {profile?.lorTracking?.contacts?.length ?? 0}
                    </span>
                  </div>
                </div>

                {/* Next Actions */}
                {nextActions.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Next Steps</h3>
                    <div className="space-y-2">
                      {nextActions.slice(0, 3).map((action, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            action.priority === 'high' ? 'bg-red-400' :
                            action.priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                          }`} />
                          <div>
                            <p className="text-sm text-gray-700">{action.action}</p>
                            <p className="text-xs text-gray-500 capitalize">{action.section}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Sections */}
          <div className="lg:col-span-2 space-y-4">
            {SECTIONS.map((section, index) => (
              <ProfileSection
                key={section.key}
                section={section}
                profile={profile}
                isExpanded={expandedSection === section.key}
                onToggle={() => setExpandedSection(
                  expandedSection === section.key ? null : section.key
                )}
                sectionComplete={computed?.completeness.sections[section.key] ?? false}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Section Component
interface ProfileSectionProps {
  section: typeof SECTIONS[number];
  profile: ReturnType<typeof useSmartProfile>['profile'];
  isExpanded: boolean;
  onToggle: () => void;
  sectionComplete: boolean;
  index: number;
}

function ProfileSection({
  section,
  profile,
  isExpanded,
  onToggle,
  sectionComplete,
  index,
}: ProfileSectionProps) {
  const Icon = section.icon;
  const sectionData = profile?.[section.key as keyof typeof profile];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{section.label}</h3>
            <p className="text-sm text-gray-500">
              {getSectionSummary(section.key, sectionData)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {sectionComplete ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              Incomplete
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-5">
              {renderSectionContent(section.key, sectionData, section)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper functions
function getSectionSummary(key: string, data: unknown): string {
  if (!data) return 'Not started';

  switch (key) {
    case 'personalInfo': {
      const d = data as { firstName?: string; lastName?: string };
      return d.firstName && d.lastName 
        ? `${d.firstName} ${d.lastName}` 
        : 'Add your name';
    }
    case 'contactInfo': {
      const d = data as { email?: string };
      return d.email || 'Add contact details';
    }
    case 'education': {
      const d = data as { entries?: unknown[] };
      return d.entries?.length 
        ? `${d.entries.length} institution${d.entries.length > 1 ? 's' : ''}` 
        : 'Add education';
    }
    case 'testScores': {
      const d = data as { gre?: unknown; toefl?: unknown; ielts?: unknown };
      const tests = [];
      if (d.gre) tests.push('GRE');
      if (d.toefl) tests.push('TOEFL');
      if (d.ielts) tests.push('IELTS');
      return tests.length ? tests.join(', ') : 'Add test scores';
    }
    case 'workExperience': {
      const d = data as { entries?: unknown[] };
      return d.entries?.length 
        ? `${d.entries.length} position${d.entries.length > 1 ? 's' : ''}` 
        : 'Add experience';
    }
    case 'research': {
      const d = data as { entries?: unknown[]; researchInterests?: string[] };
      return d.entries?.length 
        ? `${d.entries.length} project${d.entries.length > 1 ? 's' : ''}` 
        : d.researchInterests?.length 
          ? `${d.researchInterests.length} interest${d.researchInterests.length > 1 ? 's' : ''}` 
          : 'Add research';
    }
    case 'skills': {
      const d = data as { skills?: unknown[] };
      return d.skills?.length 
        ? `${d.skills.length} skill${d.skills.length > 1 ? 's' : ''}` 
        : 'Add skills';
    }
    case 'awards': {
      const d = data as { entries?: unknown[] };
      return d.entries?.length 
        ? `${d.entries.length} award${d.entries.length > 1 ? 's' : ''}` 
        : 'Add awards';
    }
    case 'applicationGoals': {
      const d = data as { programs?: unknown[]; targetCountries?: string[] };
      if (d.programs?.length) return `${d.programs.length} program${d.programs.length > 1 ? 's' : ''} targeted`;
      if (d.targetCountries?.length) return d.targetCountries.join(', ');
      return 'Add target programs';
    }
    case 'lorTracking': {
      const d = data as { contacts?: unknown[] };
      return d.contacts?.length 
        ? `${d.contacts.length} recommender${d.contacts.length > 1 ? 's' : ''}` 
        : 'Add recommenders';
    }
    case 'financialDetails': {
      const d = data as { budgetRange?: { min?: number; max?: number } };
      if (d.budgetRange?.min || d.budgetRange?.max) {
        return `$${(d.budgetRange.min || 0).toLocaleString()} - $${(d.budgetRange.max || 0).toLocaleString()}`;
      }
      return 'Add financial details';
    }
    default:
      return 'View details';
  }
}

function renderSectionContent(key: string, data: unknown, section: typeof SECTIONS[number]): React.ReactNode {
  if (!data || (typeof data === 'object' && Object.keys(data as object).length === 0)) {
    return (
      <div className={`text-center py-8 ${section.bg} rounded-xl border ${section.border}`}>
        <section.icon className={`w-8 h-8 ${section.text} mx-auto mb-2 opacity-50`} />
        <p className="text-gray-500 text-sm">No {section.label.toLowerCase()} added yet</p>
        <button className={`mt-3 px-4 py-2 ${section.bg} ${section.text} rounded-lg text-sm font-medium hover:opacity-80 transition-opacity border ${section.border}`}>
          <Edit2 className="w-4 h-4 inline mr-2" />
          Add {section.label}
        </button>
      </div>
    );
  }

  // Render based on section type
  switch (key) {
    case 'personalInfo':
      return renderPersonalInfo(data);
    case 'contactInfo':
      return renderContactInfo(data);
    case 'education':
      return renderEducation(data);
    case 'testScores':
      return renderTestScores(data);
    case 'workExperience':
      return renderWorkExperience(data);
    case 'applicationGoals':
      return renderApplicationGoals(data);
    case 'skills':
      return renderSkills(data);
    case 'research':
      return renderResearch(data);
    case 'awards':
      return renderAwards(data);
    case 'lorTracking':
      return renderLorTracking(data);
    case 'financialDetails':
      return renderFinancialDetails(data);
    default:
      return (
        <div className="bg-gray-50 rounded-xl p-4">
          <pre className="text-xs text-gray-600 overflow-auto max-h-60">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
  }
}

function renderPersonalInfo(data: unknown) {
  const d = data as { firstName?: string; lastName?: string; dateOfBirth?: string; nationality?: string; gender?: string };
  return (
    <div className="grid grid-cols-2 gap-4">
      <InfoItem icon={User} label="Full Name" value={`${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Not set'} />
      <InfoItem icon={Calendar} label="Date of Birth" value={d.dateOfBirth ? new Date(d.dateOfBirth).toLocaleDateString() : 'Not set'} />
      <InfoItem icon={Globe} label="Nationality" value={d.nationality || 'Not set'} />
      <InfoItem icon={User} label="Gender" value={d.gender || 'Not set'} />
    </div>
  );
}

function renderContactInfo(data: unknown) {
  const d = data as { email?: string; phone?: string; address?: { city?: string; country?: string } };
  return (
    <div className="grid grid-cols-2 gap-4">
      <InfoItem icon={Mail} label="Email" value={d.email || 'Not set'} />
      <InfoItem icon={Phone} label="Phone" value={d.phone || 'Not set'} />
      <InfoItem icon={MapPin} label="Location" value={d.address ? `${d.address.city || ''}, ${d.address.country || ''}`.replace(/^, |, $/g, '') || 'Not set' : 'Not set'} />
    </div>
  );
}

function renderEducation(data: unknown) {
  const d = data as { entries?: Array<{ institution?: string; degree?: string; field?: string; gpa?: number; startDate?: string; endDate?: string }> };
  if (!d.entries?.length) return null;
  
  return (
    <div className="space-y-4">
      {d.entries.map((edu, index) => (
        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{edu.institution || 'Institution'}</h4>
              <p className="text-sm text-gray-600">{edu.degree} in {edu.field}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {edu.gpa && <span>GPA: {edu.gpa}</span>}
                {edu.startDate && <span>{new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderTestScores(data: unknown) {
  const d = data as { gre?: { verbal?: number; quant?: number; awa?: number; total?: number }; toefl?: { total?: number }; ielts?: { overall?: number } };
  return (
    <div className="grid grid-cols-3 gap-4">
      {d.gre && (
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <h4 className="font-semibold text-orange-800 mb-2">GRE</h4>
          <div className="space-y-1 text-sm">
            {d.gre.verbal && <p className="text-gray-600">Verbal: <span className="font-medium text-gray-900">{d.gre.verbal}</span></p>}
            {d.gre.quant && <p className="text-gray-600">Quant: <span className="font-medium text-gray-900">{d.gre.quant}</span></p>}
            {d.gre.awa && <p className="text-gray-600">AWA: <span className="font-medium text-gray-900">{d.gre.awa}</span></p>}
            {d.gre.total && <p className="text-gray-600 font-medium">Total: <span className="text-gray-900">{d.gre.total}</span></p>}
          </div>
        </div>
      )}
      {d.toefl && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h4 className="font-semibold text-blue-800 mb-2">TOEFL</h4>
          <p className="text-2xl font-bold text-gray-900">{d.toefl.total}</p>
          <p className="text-xs text-gray-500">out of 120</p>
        </div>
      )}
      {d.ielts && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <h4 className="font-semibold text-green-800 mb-2">IELTS</h4>
          <p className="text-2xl font-bold text-gray-900">{d.ielts.overall}</p>
          <p className="text-xs text-gray-500">out of 9.0</p>
        </div>
      )}
      {!d.gre && !d.toefl && !d.ielts && (
        <div className="col-span-3 text-center py-4 text-gray-500 text-sm">
          No test scores recorded
        </div>
      )}
    </div>
  );
}

function renderWorkExperience(data: unknown) {
  const d = data as { entries?: Array<{ company?: string; position?: string; startDate?: string; endDate?: string; description?: string }> };
  if (!d.entries?.length) return null;
  
  return (
    <div className="space-y-4">
      {d.entries.map((work, index) => (
        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{work.position || 'Position'}</h4>
              <p className="text-sm text-gray-600">{work.company}</p>
              {work.startDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(work.startDate).toLocaleDateString()} - {work.endDate ? new Date(work.endDate).toLocaleDateString() : 'Present'}
                </p>
              )}
              {work.description && (
                <p className="text-sm text-gray-600 mt-2">{work.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderResearch(data: unknown) {
  const d = data as { entries?: Array<{ title?: string; description?: string; institution?: string }>; researchInterests?: string[] };
  return (
    <div className="space-y-4">
      {d.researchInterests && d.researchInterests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Research Interests</h4>
          <div className="flex flex-wrap gap-2">
            {d.researchInterests.map((interest, i) => (
              <span key={i} className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm border border-cyan-200">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
      {d.entries?.map((entry, index) => (
        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="font-semibold text-gray-900">{entry.title}</h4>
          {entry.institution && <p className="text-sm text-gray-600">{entry.institution}</p>}
          {entry.description && <p className="text-sm text-gray-500 mt-2">{entry.description}</p>}
        </div>
      ))}
    </div>
  );
}

function renderAwards(data: unknown) {
  const d = data as { entries?: Array<{ title?: string; issuer?: string; date?: string }> };
  if (!d.entries?.length) return null;
  
  return (
    <div className="space-y-3">
      {d.entries.map((award, index) => (
        <div key={index} className="flex items-center gap-3 bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <Award className="w-5 h-5 text-yellow-600" />
          <div>
            <h4 className="font-medium text-gray-900">{award.title}</h4>
            <p className="text-sm text-gray-500">
              {award.issuer}{award.date && ` • ${new Date(award.date).getFullYear()}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderLorTracking(data: unknown) {
  const d = data as { contacts?: Array<{ name?: string; email?: string; status?: string; institution?: string }> };
  if (!d.contacts?.length) return null;
  
  return (
    <div className="space-y-3">
      {d.contacts.map((contact, index) => (
        <div key={index} className="flex items-center justify-between bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{contact.name}</h4>
              <p className="text-sm text-gray-500">{contact.institution}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            contact.status === 'received' ? 'bg-green-100 text-green-700' :
            contact.status === 'requested' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {contact.status || 'Pending'}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderFinancialDetails(data: unknown) {
  const d = data as { budgetRange?: { min?: number; max?: number }; fundingSource?: string; needScholarship?: boolean };
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <h4 className="text-sm font-medium text-emerald-800 mb-1">Budget Range</h4>
        <p className="text-lg font-semibold text-gray-900">
          ${(d.budgetRange?.min || 0).toLocaleString()} - ${(d.budgetRange?.max || 0).toLocaleString()}
        </p>
      </div>
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <h4 className="text-sm font-medium text-emerald-800 mb-1">Funding Source</h4>
        <p className="text-lg font-semibold text-gray-900 capitalize">{d.fundingSource || 'Not specified'}</p>
      </div>
      {d.needScholarship !== undefined && (
        <div className="col-span-2 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-2">
            {d.needScholarship ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-gray-900">{d.needScholarship ? 'Seeking scholarship opportunities' : 'Not seeking scholarships'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function renderApplicationGoals(data: unknown) {
  const d = data as { targetCountries?: string[]; targetDegree?: string; targetIntake?: string; programs?: Array<{ university?: string; program?: string }> };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <h4 className="font-medium text-red-800 text-sm mb-1">Target Countries</h4>
          <p className="text-gray-900 font-medium">{d.targetCountries?.join(', ') || 'Not set'}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <h4 className="font-medium text-red-800 text-sm mb-1">Degree</h4>
          <p className="text-gray-900 font-medium capitalize">{d.targetDegree || 'Not set'}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <h4 className="font-medium text-red-800 text-sm mb-1">Target Intake</h4>
          <p className="text-gray-900 font-medium">{d.targetIntake || 'Not set'}</p>
        </div>
      </div>
      
      {d.programs && d.programs.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Target Programs</h4>
          <div className="space-y-2">
            {d.programs.map((prog, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{prog.university}</p>
                  <p className="text-sm text-gray-500">{prog.program}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderSkills(data: unknown) {
  const d = data as { skills?: Array<{ name?: string; level?: string }> | string[] };
  const skills = Array.isArray(d.skills) ? d.skills : [];
  
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        const skillLevel = typeof skill === 'object' ? skill.level : null;
        return (
          <span
            key={index}
            className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-sm font-medium border border-pink-200"
          >
            {skillName}
            {skillLevel && <span className="text-pink-400 ml-1">• {skillLevel}</span>}
          </span>
        );
      })}
      {skills.length === 0 && (
        <p className="text-gray-500 text-sm">No skills added</p>
      )}
    </div>
  );
}

// Info Item Component
function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
