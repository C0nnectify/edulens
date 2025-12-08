'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Scroll,
  Zap,
  FileText,
  Target,
  GraduationCap,
  Building,
  MapPin,
  Calendar,
  Users,
  Award,
  BookOpen,
  Lightbulb,
  Download,
  RefreshCw,
  Eye,
  Edit3,
} from 'lucide-react';

interface SOPFormData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    currentLocation: string;
  };
  academicBackground: {
    currentDegree: string;
    currentInstitution: string;
    currentGPA: string;
    graduationYear: string;
    relevantCoursework: string;
    academicAchievements: string;
  };
  targetProgram: {
    programName: string;
    university: string;
    country: string;
    degreeLevel: string;
    specialization: string;
    startDate: string;
  };
  experience: {
    workExperience: string;
    researchExperience: string;
    volunteerWork: string;
    internships: string;
    projects: string;
  };
  motivation: {
    whyThisProgram: string;
    careerGoals: string;
    whyThisUniversity: string;
    futurePlans: string;
  };
  additionalInfo: {
    skills: string;
    languages: string;
    publications: string;
    awards: string;
    extracurriculars: string;
  };
}

export default function SOPGeneratorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSOP, setGeneratedSOP] = useState('');
  const [formData, setFormData] = useState<SOPFormData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      nationality: '',
      currentLocation: '',
    },
    academicBackground: {
      currentDegree: '',
      currentInstitution: '',
      currentGPA: '',
      graduationYear: '',
      relevantCoursework: '',
      academicAchievements: '',
    },
    targetProgram: {
      programName: '',
      university: '',
      country: '',
      degreeLevel: '',
      specialization: '',
      startDate: '',
    },
    experience: {
      workExperience: '',
      researchExperience: '',
      volunteerWork: '',
      internships: '',
      projects: '',
    },
    motivation: {
      whyThisProgram: '',
      careerGoals: '',
      whyThisUniversity: '',
      futurePlans: '',
    },
    additionalInfo: {
      skills: '',
      languages: '',
      publications: '',
      awards: '',
      extracurriculars: '',
    },
  });

  const steps = [
    { id: 1, title: 'Personal Info', icon: Users },
    { id: 2, title: 'Academic Background', icon: GraduationCap },
    { id: 3, title: 'Target Program', icon: Target },
    { id: 4, title: 'Experience', icon: Building },
    { id: 5, title: 'Motivation', icon: Lightbulb },
    { id: 6, title: 'Additional Info', icon: Award },
  ];

  const handleInputChange = (section: keyof SOPFormData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateSOP = async () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setGeneratedSOP(`
# Statement of Purpose

## Introduction

My name is ${formData.personalInfo.fullName}, and I am writing to express my strong interest in the ${formData.targetProgram.programName} program at ${formData.targetProgram.university}. As a ${formData.academicBackground.currentDegree} graduate from ${formData.academicBackground.currentInstitution} with a GPA of ${formData.academicBackground.currentGPA}, I am eager to advance my academic journey and contribute to the field of ${formData.targetProgram.specialization}.

## Academic Background

I completed my ${formData.academicBackground.currentDegree} in ${formData.academicBackground.graduationYear} from ${formData.academicBackground.currentInstitution}. My academic performance, reflected in my GPA of ${formData.academicBackground.currentGPA}, demonstrates my commitment to excellence and my ability to handle rigorous coursework.

During my undergraduate studies, I focused on ${formData.academicBackground.relevantCoursework}, which has provided me with a solid foundation for advanced studies in ${formData.targetProgram.specialization}. My academic achievements include ${formData.academicBackground.academicAchievements}.

## Professional Experience

My professional experience has been instrumental in shaping my understanding of ${formData.targetProgram.specialization}. I have gained valuable experience through ${formData.experience.workExperience}.

Additionally, my research experience includes ${formData.experience.researchExperience}, which has deepened my interest in pursuing advanced studies in this field.

## Motivation and Goals

I am particularly drawn to the ${formData.targetProgram.programName} program at ${formData.targetProgram.university} because ${formData.motivation.whyThisProgram}. The university's reputation for excellence in ${formData.targetProgram.specialization} and its commitment to research aligns perfectly with my academic and career aspirations.

My career goals include ${formData.motivation.careerGoals}. I believe that the comprehensive curriculum and research opportunities at ${formData.targetProgram.university} will provide me with the necessary skills and knowledge to achieve these objectives.

## Why This University

${formData.motivation.whyThisUniversity}. The university's state-of-the-art facilities, distinguished faculty, and collaborative research environment make it the ideal place for me to pursue my graduate studies.

## Future Plans

Upon completion of the program, I plan to ${formData.motivation.futurePlans}. I am confident that the education and experiences I will gain at ${formData.targetProgram.university} will prepare me to make significant contributions to the field and society at large.

## Conclusion

I am excited about the opportunity to join the ${formData.targetProgram.programName} program at ${formData.targetProgram.university} and contribute to its academic community. I am committed to academic excellence and look forward to the challenges and opportunities that lie ahead.

Thank you for considering my application.

Sincerely,
${formData.personalInfo.fullName}
      `);
      setIsGenerating(false);
    }, 3000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.personalInfo.fullName}
                  onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.personalInfo.phone}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  id="nationality"
                  value={formData.personalInfo.nationality}
                  onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
                  placeholder="Enter your nationality"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="currentLocation">Current Location *</Label>
                <Input
                  id="currentLocation"
                  value={formData.personalInfo.currentLocation}
                  onChange={(e) => handleInputChange('personalInfo', 'currentLocation', e.target.value)}
                  placeholder="Enter your current location"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="currentDegree">Current Degree *</Label>
                <Select
                  value={formData.academicBackground.currentDegree}
                  onValueChange={(value) => handleInputChange('academicBackground', 'currentDegree', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bachelor's">Bachelor's Degree</SelectItem>
                    <SelectItem value="Master's">Master's Degree</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currentInstitution">Current Institution *</Label>
                <Input
                  id="currentInstitution"
                  value={formData.academicBackground.currentInstitution}
                  onChange={(e) => handleInputChange('academicBackground', 'currentInstitution', e.target.value)}
                  placeholder="Enter your institution name"
                />
              </div>
              <div>
                <Label htmlFor="currentGPA">Current GPA *</Label>
                <Input
                  id="currentGPA"
                  value={formData.academicBackground.currentGPA}
                  onChange={(e) => handleInputChange('academicBackground', 'currentGPA', e.target.value)}
                  placeholder="e.g., 3.8/4.0"
                />
              </div>
              <div>
                <Label htmlFor="graduationYear">Graduation Year *</Label>
                <Input
                  id="graduationYear"
                  value={formData.academicBackground.graduationYear}
                  onChange={(e) => handleInputChange('academicBackground', 'graduationYear', e.target.value)}
                  placeholder="e.g., 2024"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="relevantCoursework">Relevant Coursework</Label>
              <Textarea
                id="relevantCoursework"
                value={formData.academicBackground.relevantCoursework}
                onChange={(e) => handleInputChange('academicBackground', 'relevantCoursework', e.target.value)}
                placeholder="List relevant courses you've taken"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="academicAchievements">Academic Achievements</Label>
              <Textarea
                id="academicAchievements"
                value={formData.academicBackground.academicAchievements}
                onChange={(e) => handleInputChange('academicBackground', 'academicAchievements', e.target.value)}
                placeholder="List any academic honors, awards, or achievements"
                rows={4}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="programName">Program Name *</Label>
                <Input
                  id="programName"
                  value={formData.targetProgram.programName}
                  onChange={(e) => handleInputChange('targetProgram', 'programName', e.target.value)}
                  placeholder="e.g., Master of Science in Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="university">University *</Label>
                <Input
                  id="university"
                  value={formData.targetProgram.university}
                  onChange={(e) => handleInputChange('targetProgram', 'university', e.target.value)}
                  placeholder="Enter university name"
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.targetProgram.country}
                  onChange={(e) => handleInputChange('targetProgram', 'country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
              <div>
                <Label htmlFor="degreeLevel">Degree Level *</Label>
                <Select
                  value={formData.targetProgram.degreeLevel}
                  onValueChange={(value) => handleInputChange('targetProgram', 'degreeLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Master's">Master's</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  value={formData.targetProgram.specialization}
                  onChange={(e) => handleInputChange('targetProgram', 'specialization', e.target.value)}
                  placeholder="e.g., Artificial Intelligence"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Intended Start Date *</Label>
                <Input
                  id="startDate"
                  value={formData.targetProgram.startDate}
                  onChange={(e) => handleInputChange('targetProgram', 'startDate', e.target.value)}
                  placeholder="e.g., Fall 2024"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="workExperience">Work Experience</Label>
              <Textarea
                id="workExperience"
                value={formData.experience.workExperience}
                onChange={(e) => handleInputChange('experience', 'workExperience', e.target.value)}
                placeholder="Describe your work experience relevant to your field"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="researchExperience">Research Experience</Label>
              <Textarea
                id="researchExperience"
                value={formData.experience.researchExperience}
                onChange={(e) => handleInputChange('experience', 'researchExperience', e.target.value)}
                placeholder="Describe any research projects, publications, or academic research"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="internships">Internships</Label>
              <Textarea
                id="internships"
                value={formData.experience.internships}
                onChange={(e) => handleInputChange('experience', 'internships', e.target.value)}
                placeholder="Describe any internships or practical training"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="projects">Projects</Label>
              <Textarea
                id="projects"
                value={formData.experience.projects}
                onChange={(e) => handleInputChange('experience', 'projects', e.target.value)}
                placeholder="Describe significant projects you've worked on"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="volunteerWork">Volunteer Work</Label>
              <Textarea
                id="volunteerWork"
                value={formData.experience.volunteerWork}
                onChange={(e) => handleInputChange('experience', 'volunteerWork', e.target.value)}
                placeholder="Describe any volunteer work or community service"
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="whyThisProgram">Why This Program? *</Label>
              <Textarea
                id="whyThisProgram"
                value={formData.motivation.whyThisProgram}
                onChange={(e) => handleInputChange('motivation', 'whyThisProgram', e.target.value)}
                placeholder="Explain why you want to pursue this specific program"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="careerGoals">Career Goals *</Label>
              <Textarea
                id="careerGoals"
                value={formData.motivation.careerGoals}
                onChange={(e) => handleInputChange('motivation', 'careerGoals', e.target.value)}
                placeholder="Describe your short-term and long-term career goals"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="whyThisUniversity">Why This University? *</Label>
              <Textarea
                id="whyThisUniversity"
                value={formData.motivation.whyThisUniversity}
                onChange={(e) => handleInputChange('motivation', 'whyThisUniversity', e.target.value)}
                placeholder="Explain why you chose this specific university"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="futurePlans">Future Plans</Label>
              <Textarea
                id="futurePlans"
                value={formData.motivation.futurePlans}
                onChange={(e) => handleInputChange('motivation', 'futurePlans', e.target.value)}
                placeholder="Describe your plans after completing the program"
                rows={3}
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="skills">Technical Skills</Label>
              <Textarea
                id="skills"
                value={formData.additionalInfo.skills}
                onChange={(e) => handleInputChange('additionalInfo', 'skills', e.target.value)}
                placeholder="List your technical skills, software, programming languages, etc."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="languages">Languages</Label>
              <Textarea
                id="languages"
                value={formData.additionalInfo.languages}
                onChange={(e) => handleInputChange('additionalInfo', 'languages', e.target.value)}
                placeholder="List languages you speak and proficiency levels"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="publications">Publications</Label>
              <Textarea
                id="publications"
                value={formData.additionalInfo.publications}
                onChange={(e) => handleInputChange('additionalInfo', 'publications', e.target.value)}
                placeholder="List any publications, papers, or articles"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="awards">Awards & Honors</Label>
              <Textarea
                id="awards"
                value={formData.additionalInfo.awards}
                onChange={(e) => handleInputChange('additionalInfo', 'awards', e.target.value)}
                placeholder="List any awards, honors, or recognitions"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="extracurriculars">Extracurricular Activities</Label>
              <Textarea
                id="extracurriculars"
                value={formData.additionalInfo.extracurriculars}
                onChange={(e) => handleInputChange('additionalInfo', 'extracurriculars', e.target.value)}
                placeholder="Describe your extracurricular activities and leadership roles"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Scroll className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">SOP Generator</h1>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              AI-Powered
            </Badge>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Create compelling Statements of Purpose that tell your unique story and stand out to admissions committees.
          </p>
        </div>

        {!generatedSOP ? (
          <>
            {/* Progress Steps */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          currentStep >= step.id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          currentStep >= step.id ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <steps[currentStep - 1].icon className="h-5 w-5 text-green-600" />
                  <span>{steps[currentStep - 1].title}</span>
                </CardTitle>
                <CardDescription>
                  Step {currentStep} of {steps.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              {currentStep < steps.length ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={generateSOP}
                  disabled={isGenerating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating SOP...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate SOP
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        ) : (
          /* Generated SOP Display */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span>Generated Statement of Purpose</span>
                    </CardTitle>
                    <CardDescription>
                      Your personalized SOP is ready for review and editing
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGeneratedSOP('');
                        setCurrentStep(1);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full border rounded-lg p-6">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {generatedSOP}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button size="lg" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setGeneratedSOP('');
                  setCurrentStep(1);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
