
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Globe, Calendar, FileText, MessageCircle } from 'lucide-react';

const EligibilitySteps = () => {
  const eligibilityItems = [
    {
      icon: Users,
      title: "Age Range",
      requirement: "14–24 years old",
      note: "Varies by camp"
    },
    {
      icon: Globe,
      title: "English Level",
      requirement: "Basic conversational English",
      note: "No IELTS/TOEFL required"
    },
    {
      icon: Calendar,
      title: "Student Status",
      requirement: "High school or early university",
      note: "Open to all students"
    }
  ];

  const applicationSteps = [
    {
      step: 1,
      title: "Fill Interest Form",
      description: "Complete our quick online form with your camp preferences",
      icon: FileText,
      color: "bg-blue-500"
    },
    {
      step: 2,
      title: "Upload Documents",
      description: "Submit passport copy and school marksheet/transcript",
      icon: FileText,
      color: "bg-green-500"
    },
    {
      step: 3,
      title: "Motivation Letter",
      description: "Write a short essay about why you want to join",
      icon: MessageCircle,
      color: "bg-purple-500"
    },
    {
      step: 4,
      title: "Interview (if needed)",
      description: "Some camps may require a brief video interview",
      icon: MessageCircle,
      color: "bg-orange-500"
    },
    {
      step: 5,
      title: "Payment or Scholarship",
      description: "Pay fees or wait for scholarship decision",
      icon: Users,
      color: "bg-pink-500"
    }
  ];

  return (
    <section id="eligibility-steps" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Eligibility & Application Steps</h2>
          <p className="text-lg text-gray-600">Simple requirements and easy application process</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Eligibility Requirements */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Who Can Apply?</h3>
            <div className="space-y-4">
              {eligibilityItems.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <item.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-700 font-medium">{item.requirement}</p>
                        <p className="text-sm text-gray-500">{item.note}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <Badge className="bg-green-500 text-white mr-2">Good News!</Badge>
              </div>
              <p className="text-green-800 text-sm">
                Most camps welcome international students and provide English support during the program.
              </p>
            </div>
          </div>

          {/* Application Steps */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Application Process</h3>
            <div className="space-y-6">
              {applicationSteps.map((step) => (
                <div key={step.step} className="flex items-start">
                  <div className={`${step.color} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0`}>
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
              <h4 className="font-bold text-lg mb-2">Average Processing Time</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Application Review:</div>
                  <div className="opacity-90">1-2 weeks</div>
                </div>
                <div>
                  <div className="font-semibold">Scholarship Decision:</div>
                  <div className="opacity-90">2-4 weeks</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EligibilitySteps;
