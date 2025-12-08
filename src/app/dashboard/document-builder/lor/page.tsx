'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Zap,
  FileText,
  User,
  Award,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  CheckCircle,
  Users,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

interface LORFormData {
  recommenderInfo: {
    name: string;
    title: string;
    organization: string;
    email: string;
    phone: string;
    relationship: string;
  };
  studentInfo: {
    name: string;
    program: string;
    university: string;
    graduationYear: string;
    gpa: string;
    major: string;
  };
  relationship: {
    howLongKnown: string;
    context: string;
    interactions: string;
    specificExamples: string;
  };
  achievements: {
    academicAchievements: string;
    projects: string;
    leadership: string;
    skills: string;
    character: string;
  };
  recommendation: {
    strengths: string;
    weaknesses: string;
    potential: string;
    comparison: string;
    specificRecommendation: string;
  };
}

export default function LORGeneratorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLOR, setGeneratedLOR] = useState('');
  const [formData, setFormData] = useState<LORFormData>({
    recommenderInfo: {
      name: '',
      title: '',
      organization: '',
      email: '',
      phone: '',
      relationship: '',
    },
    studentInfo: {
      name: '',
      program: '',
      university: '',
      graduationYear: '',
      gpa: '',
      major: '',
    },
    relationship: {
      howLongKnown: '',
      context: '',
      interactions: '',
      specificExamples: '',
    },
    achievements: {
      academicAchievements: '',
      projects: '',
      leadership: '',
      skills: '',
      character: '',
    },
    recommendation: {
      strengths: '',
      weaknesses: '',
      potential: '',
      comparison: '',
      specificRecommendation: '',
    },
  });

  const steps = [
    { id: 1, title: 'Recommender Info', icon: User },
    { id: 2, title: 'Student Details', icon: GraduationCap },
    { id: 3, title: 'Relationship', icon: Users },
    { id: 4, title: 'Achievements', icon: Award },
    { id: 5, title: 'Recommendation', icon: Briefcase },
  ];

  const handleInputChange = (section: keyof LORFormData, field: string, value: string) => {
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

  const generateLOR = async () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setGeneratedLOR(`
${formData.recommenderInfo.organization}
${formData.recommenderInfo.title}

To Whom It May Concern:

I am writing to enthusiastically recommend ${formData.studentInfo.name} for admission to the ${formData.studentInfo.program} program at ${formData.studentInfo.university}. As ${formData.recommenderInfo.title} at ${formData.recommenderInfo.organization}, I have had the privilege of working closely with ${formData.studentInfo.name} for ${formData.relationship.howLongKnown}, and I can confidently say that they are an exceptional candidate who would make significant contributions to your program.

## Academic Excellence

${formData.studentInfo.name} has demonstrated outstanding academic performance throughout their time at our institution. With a GPA of ${formData.studentInfo.gpa} in ${formData.studentInfo.major}, they have consistently shown intellectual curiosity and dedication to their studies. Their academic achievements include ${formData.achievements.academicAchievements}.

## Professional Relationship

I have known ${formData.studentInfo.name} in the capacity of ${formData.recommenderInfo.relationship} for ${formData.relationship.howLongKnown}. During this time, I have observed their work in ${formData.relationship.context}. Our interactions have included ${formData.relationship.interactions}, and I have been consistently impressed by their professionalism, dedication, and ability to exceed expectations.

## Key Strengths and Achievements

${formData.studentInfo.name} possesses several outstanding qualities that make them an ideal candidate for your program:

**Leadership and Initiative:** ${formData.achievements.leadership}

**Technical Skills and Projects:** ${formData.achievements.projects}

**Character and Work Ethic:** ${formData.achievements.character}

**Specific Examples:** ${formData.relationship.specificExamples}

## Areas of Strength

${formData.recommendation.strengths}

## Growth and Potential

While ${formData.studentInfo.name} is already an accomplished individual, I have observed their continuous growth and development. ${formData.recommendation.potential}

## Comparative Assessment

In my experience working with students over the years, ${formData.studentInfo.name} stands out as ${formData.recommendation.comparison}.

## Specific Recommendation

${formData.recommendation.specificRecommendation}

## Conclusion

I give ${formData.studentInfo.name} my highest recommendation without reservation. They are a talented, dedicated, and well-rounded individual who would be an asset to your program and the broader academic community. I am confident that they will excel in their graduate studies and make significant contributions to their field.

Please feel free to contact me if you require any additional information regarding this recommendation.

Sincerely,

${formData.recommenderInfo.name}
${formData.recommenderInfo.title}
${formData.recommenderInfo.organization}
Email: ${formData.recommenderInfo.email}
Phone: ${formData.recommenderInfo.phone}
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
                <Label htmlFor="recommenderName">Recommender Name *</Label>
                <Input
                  id="recommenderName"
                  value={formData.recommenderInfo.name}
                  onChange={(e) => handleInputChange('recommenderInfo', 'name', e.target.value)}
                  placeholder="Enter recommender's full name"
                />
              </div>
              <div>
                <Label htmlFor="title">Title/Position *</Label>
                <Input
                  id="title"
                  value={formData.recommenderInfo.title}
                  onChange={(e) => handleInputChange('recommenderInfo', 'title', e.target.value)}
                  placeholder="e.g., Professor, Manager, Director"
                />
              </div>
              <div>
                <Label htmlFor="organization">Organization *</Label>
                <Input
                  id="organization"
                  value={formData.recommenderInfo.organization}
                  onChange={(e) => handleInputChange('recommenderInfo', 'organization', e.target.value)}
                  placeholder="University, Company, or Institution"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.recommenderInfo.email}
                  onChange={(e) => handleInputChange('recommenderInfo', 'email', e.target.value)}
                  placeholder="recommender@email.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.recommenderInfo.phone}
                  onChange={(e) => handleInputChange('recommenderInfo', 'phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relationship to Student *</Label>
                <Select
                  value={formData.recommenderInfo.relationship}
                  onValueChange={(value) => handleInputChange('recommenderInfo', 'relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professor">Professor</SelectItem>
                    <SelectItem value="Academic Advisor">Academic Advisor</SelectItem>
                    <SelectItem value="Research Supervisor">Research Supervisor</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Colleague">Colleague</SelectItem>
                    <SelectItem value="Mentor">Mentor</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="studentName">Student Name *</Label>
                <Input
                  id="studentName"
                  value={formData.studentInfo.name}
                  onChange={(e) => handleInputChange('studentInfo', 'name', e.target.value)}
                  placeholder="Enter student's full name"
                />
              </div>
              <div>
                <Label htmlFor="program">Target Program *</Label>
                <Input
                  id="program"
                  value={formData.studentInfo.program}
                  onChange={(e) => handleInputChange('studentInfo', 'program', e.target.value)}
                  placeholder="e.g., Master of Science in Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="university">Target University *</Label>
                <Input
                  id="university"
                  value={formData.studentInfo.university}
                  onChange={(e) => handleInputChange('studentInfo', 'university', e.target.value)}
                  placeholder="University name"
                />
              </div>
              <div>
                <Label htmlFor="graduationYear">Graduation Year *</Label>
                <Input
                  id="graduationYear"
                  value={formData.studentInfo.graduationYear}
                  onChange={(e) => handleInputChange('studentInfo', 'graduationYear', e.target.value)}
                  placeholder="e.g., 2024"
                />
              </div>
              <div>
                <Label htmlFor="gpa">Current GPA *</Label>
                <Input
                  id="gpa"
                  value={formData.studentInfo.gpa}
                  onChange={(e) => handleInputChange('studentInfo', 'gpa', e.target.value)}
                  placeholder="e.g., 3.8/4.0"
                />
              </div>
              <div>
                <Label htmlFor="major">Major/Field of Study *</Label>
                <Input
                  id="major"
                  value={formData.studentInfo.major}
                  onChange={(e) => handleInputChange('studentInfo', 'major', e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="howLongKnown">How long have you known the student? *</Label>
              <Input
                id="howLongKnown"
                value={formData.relationship.howLongKnown}
                onChange={(e) => handleInputChange('relationship', 'howLongKnown', e.target.value)}
                placeholder="e.g., 2 years, 3 semesters"
              />
            </div>
            <div>
              <Label htmlFor="context">In what context have you worked with the student? *</Label>
              <Textarea
                id="context"
                value={formData.relationship.context}
                onChange={(e) => handleInputChange('relationship', 'context', e.target.value)}
                placeholder="Describe the academic, professional, or research context"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="interactions">What types of interactions have you had? *</Label>
              <Textarea
                id="interactions"
                value={formData.relationship.interactions}
                onChange={(e) => handleInputChange('relationship', 'interactions', e.target.value)}
                placeholder="e.g., classroom teaching, research collaboration, project supervision"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="specificExamples">Specific examples of your interactions</Label>
              <Textarea
                id="specificExamples"
                value={formData.relationship.specificExamples}
                onChange={(e) => handleInputChange('relationship', 'specificExamples', e.target.value)}
                placeholder="Provide specific examples that demonstrate the student's abilities"
                rows={4}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="academicAchievements">Academic Achievements *</Label>
              <Textarea
                id="academicAchievements"
                value={formData.achievements.academicAchievements}
                onChange={(e) => handleInputChange('achievements', 'academicAchievements', e.target.value)}
                placeholder="List academic honors, awards, high grades, etc."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="projects">Notable Projects or Research *</Label>
              <Textarea
                id="projects"
                value={formData.achievements.projects}
                onChange={(e) => handleInputChange('achievements', 'projects', e.target.value)}
                placeholder="Describe significant projects, research work, or contributions"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="leadership">Leadership and Initiative *</Label>
              <Textarea
                id="leadership"
                value={formData.achievements.leadership}
                onChange={(e) => handleInputChange('achievements', 'leadership', e.target.value)}
                placeholder="Describe leadership roles, initiative, and responsibility"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="skills">Technical and Soft Skills *</Label>
              <Textarea
                id="skills"
                value={formData.achievements.skills}
                onChange={(e) => handleInputChange('achievements', 'skills', e.target.value)}
                placeholder="List relevant skills and competencies"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="character">Character and Personal Qualities</Label>
              <Textarea
                id="character"
                value={formData.achievements.character}
                onChange={(e) => handleInputChange('achievements', 'character', e.target.value)}
                placeholder="Describe personal qualities, work ethic, integrity, etc."
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="strengths">Key Strengths *</Label>
              <Textarea
                id="strengths"
                value={formData.recommendation.strengths}
                onChange={(e) => handleInputChange('recommendation', 'strengths', e.target.value)}
                placeholder="What are the student's main strengths and how do they stand out?"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="weaknesses">Areas for Growth (Optional)</Label>
              <Textarea
                id="weaknesses"
                value={formData.recommendation.weaknesses}
                onChange={(e) => handleInputChange('recommendation', 'weaknesses', e.target.value)}
                placeholder="Any areas where the student could improve (be constructive)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="potential">Future Potential *</Label>
              <Textarea
                id="potential"
                value={formData.recommendation.potential}
                onChange={(e) => handleInputChange('recommendation', 'potential', e.target.value)}
                placeholder="What do you see for the student's future potential and growth?"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="comparison">Comparative Assessment</Label>
              <Textarea
                id="comparison"
                value={formData.recommendation.comparison}
                onChange={(e) => handleInputChange('recommendation', 'comparison', e.target.value)}
                placeholder="How does this student compare to others you've worked with?"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="specificRecommendation">Specific Recommendation *</Label>
              <Textarea
                id="specificRecommendation"
                value={formData.recommendation.specificRecommendation}
                onChange={(e) => handleInputChange('recommendation', 'specificRecommendation', e.target.value)}
                placeholder="Why do you specifically recommend this student for this program?"
                rows={4}
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
            <Mail className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">LOR Generator</h1>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
              AI-Powered
            </Badge>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Create professional Letters of Recommendation that effectively highlight a student's strengths, achievements, and potential.
          </p>
        </div>

        {!generatedLOR ? (
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
                            ? 'bg-indigo-600 text-white'
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
                          currentStep >= step.id ? 'text-indigo-600' : 'text-gray-600'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5 text-indigo-600" })}
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
                  onClick={generateLOR}
                  disabled={isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating LOR...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate LOR
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        ) : (
          /* Generated LOR Display */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <span>Generated Letter of Recommendation</span>
                    </CardTitle>
                    <CardDescription>
                      Your professional LOR is ready for review and editing
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
                        setGeneratedLOR('');
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
                      {generatedLOR}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
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
                  setGeneratedLOR('');
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
