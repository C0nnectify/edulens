
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, Award, Users } from 'lucide-react';

const AdmissionRequirements = () => {
  const ugRequirements = [
    { icon: FileText, title: '12th Grade Marksheet', description: 'Official transcripts with minimum 70-80%' },
    { icon: Award, title: 'English Proficiency', description: 'IELTS 6.0+ or TOEFL 80+' },
    { icon: FileText, title: 'Statement of Purpose', description: 'Personal essay explaining your goals' },
    { icon: Users, title: 'Letters of Recommendation', description: '2-3 LORs from teachers/counselors' },
    { icon: FileText, title: 'Standardized Tests', description: 'SAT/ACT (for US universities)' }
  ];

  const pgRequirements = [
    { icon: FileText, title: 'Bachelor\'s Transcript', description: 'Official degree with CGPA 3.0+' },
    { icon: FileText, title: 'Resume/CV', description: 'Professional experience and achievements' },
    { icon: FileText, title: 'Statement of Purpose', description: 'Research interests and career goals' },
    { icon: Users, title: 'Letters of Recommendation', description: '2-3 LORs from professors/employers' },
    { icon: Award, title: 'Test Scores', description: 'GRE/GMAT (if required), IELTS/TOEFL' }
  ];

  const RequirementCard = ({ requirements, title }) => (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <req.icon className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">{req.title}</h4>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Admission Requirements</h2>
          <p className="text-lg text-gray-600">Everything you need to know to prepare your application</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <RequirementCard requirements={ugRequirements} title="Undergraduate Programs" />
          <RequirementCard requirements={pgRequirements} title="Postgraduate Programs" />
        </div>
        
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>When should I start preparing my application?</AccordionTrigger>
              <AccordionContent>
                Start preparing at least 12-18 months before your intended start date. This gives you time to prepare for standardized tests, gather documents, and write strong personal statements.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I apply without IELTS/TOEFL?</AccordionTrigger>
              <AccordionContent>
                Some universities accept alternative English proficiency proofs like previous education in English or specific country exemptions. However, most require standardized test scores.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What if my GPA is below the minimum requirement?</AccordionTrigger>
              <AccordionContent>
                You can still apply by strengthening other parts of your application like work experience, research projects, or taking additional courses to improve your academic profile.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>How important are extracurricular activities?</AccordionTrigger>
              <AccordionContent>
                Very important! Universities look for well-rounded students. Leadership roles, volunteer work, research projects, and relevant work experience can significantly strengthen your application.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default AdmissionRequirements;
