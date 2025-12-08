
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, FileText, Upload } from 'lucide-react';

const ResearchProposalHelp = () => {
  const checklist = [
    "Clear research question",
    "Literature gap identification",
    "Research methodology",
    "Expected outcomes",
    "Timeline and milestones",
    "Budget considerations"
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Research Proposal Help</h2>
          <p className="text-lg text-gray-600">Get expert guidance on crafting a winning research proposal</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-6 w-6 text-purple-600" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is a research proposal?</AccordionTrigger>
                  <AccordionContent>
                    A research proposal is a detailed plan that outlines your intended research project. It demonstrates your understanding of the field, identifies a research gap, and explains how you plan to address it through your doctoral studies.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>What should be included?</AccordionTrigger>
                  <AccordionContent>
                    Your proposal should include: a clear research question, literature review, methodology, expected outcomes, timeline, and budget. It should be well-structured and demonstrate your research skills and knowledge of the field.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>How long should it be?</AccordionTrigger>
                  <AccordionContent>
                    Most PhD proposals range from 1,500 to 3,000 words, but this varies by institution and field. Check the specific requirements of your target universities as they may have different word limits.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>When should I start writing?</AccordionTrigger>
                  <AccordionContent>
                    Start writing your proposal at least 3-6 months before application deadlines. This gives you time for multiple revisions, feedback from mentors, and thorough research of your topic.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-6 w-6 text-green-600" />
                Proposal Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Need Expert Review?</h4>
                <p className="text-gray-600 mb-4">
                  Get professional feedback on your research proposal from experienced academics and admission experts.
                </p>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => window.location.href = '/proposal-review'}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Proposal for Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ResearchProposalHelp;
