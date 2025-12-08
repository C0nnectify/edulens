
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, User, FileText, Mail, Send, Video, Plane } from 'lucide-react';

const ApplicationTimeline = () => {
  const steps = [
    {
      step: 1,
      title: "Choose Topic",
      description: "Identify your research area and interests",
      icon: Search,
      duration: "1-2 months"
    },
    {
      step: 2,
      title: "Find Supervisor",
      description: "Research and contact potential supervisors",
      icon: User,
      duration: "2-3 months"
    },
    {
      step: 3,
      title: "Write Proposal",
      description: "Develop comprehensive research proposal",
      icon: FileText,
      duration: "2-4 months"
    },
    {
      step: 4,
      title: "Contact Supervisor",
      description: "Reach out with proposal and CV",
      icon: Mail,
      duration: "1-2 weeks"
    },
    {
      step: 5,
      title: "Submit Application",
      description: "Complete university application forms",
      icon: Send,
      duration: "2-4 weeks"
    },
    {
      step: 6,
      title: "Interview",
      description: "Participate in interviews or presentations",
      icon: Video,
      duration: "1-2 months"
    },
    {
      step: 7,
      title: "Apply for Visa",
      description: "Process visa and immigration requirements",
      icon: Plane,
      duration: "1-3 months"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">PhD Application Timeline</h2>
          <p className="text-lg text-gray-600">Follow this step-by-step process to successfully apply for your PhD</p>
        </div>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-purple-200 hidden md:block"></div>
          
          <div className="space-y-8">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              const isEven = idx % 2 === 0;
              
              return (
                <div key={step.step} className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-purple-600 rounded-full border-4 border-white shadow-lg hidden md:block z-10"></div>
                  
                  {/* Content card */}
                  <div className={`w-full md:w-5/12 ${isEven ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}`}>
                    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          <div className="bg-purple-100 p-3 rounded-full mr-4">
                            <IconComponent className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <div className="flex items-center mb-1">
                              <span className="bg-purple-600 text-white text-sm font-bold px-2 py-1 rounded-full mr-2">
                                {step.step}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                            </div>
                            <p className="text-sm text-purple-600 font-medium">{step.duration}</p>
                          </div>
                        </div>
                        <p className="text-gray-600">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Mobile timeline indicator */}
                  <div className="md:hidden absolute -left-4 top-6 w-2 h-2 bg-purple-600 rounded-full"></div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            Timeline may vary by country and institution. Start planning 12-18 months before your intended start date.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ApplicationTimeline;
