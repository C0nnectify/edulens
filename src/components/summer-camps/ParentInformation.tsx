
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Shield, Phone, FileText, Heart, Globe, Clock } from 'lucide-react';

const ParentInformation = () => {
  const trustBadges = [
    {
      icon: Shield,
      title: "Supervised Housing",
      description: "24/7 residential staff supervision"
    },
    {
      icon: Heart,
      title: "Medical Insurance",
      description: "Comprehensive health coverage included"
    },
    {
      icon: Phone,
      title: "24/7 Support",
      description: "Local support staff always available"
    },
    {
      icon: Globe,
      title: "Daily Check-ins",
      description: "Regular updates via email to parents"
    },
    {
      icon: FileText,
      title: "Emergency Protocol",
      description: "Clear emergency contact procedures"
    },
    {
      icon: Clock,
      title: "Certificates",
      description: "Official attendance certificates provided"
    }
  ];

  const faqItems = [
    {
      question: "How is my child's safety ensured?",
      answer: "All camps provide 24/7 supervision, secure accommodation, comprehensive insurance, and trained staff. Emergency contacts are always available, and we maintain strict safety protocols."
    },
    {
      question: "What is included in the program cost?",
      answer: "Typically includes tuition, accommodation, meals, local transportation, cultural activities, and certificates. International flights and personal expenses are usually separate."
    },
    {
      question: "How often will I receive updates?",
      answer: "Parents receive daily email updates with photos and activity summaries. Emergency contact numbers are provided for urgent matters."
    },
    {
      question: "What if my child gets homesick?",
      answer: "Our trained counselors are experienced in helping students adjust. We provide emotional support, regular check-ins, and facilitate communication with home when needed."
    },
    {
      question: "Are meals and dietary restrictions accommodated?",
      answer: "Yes, all dietary requirements including vegetarian, vegan, halal, kosher, and allergy-specific meals are accommodated with advance notice."
    },
    {
      question: "What happens in case of emergency?",
      answer: "Each camp has a 24/7 emergency contact system. Parents are immediately notified of any incidents, and local medical facilities are readily accessible."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Information for Parents</h2>
          <p className="text-lg text-gray-600">Your child's safety and success are our top priorities</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Trust Badges */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Safety & Support Guarantees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trustBadges.map((badge, index) => (
                <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <badge.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{badge.title}</h4>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl text-white">
              <h4 className="font-bold text-lg mb-3">Peace of Mind Package</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  <span>Comprehensive travel insurance included</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  <span>Pre-departure orientation for students and parents</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  <span>Airport pickup and drop-off services</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  <span>Weekly progress reports and photo updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg px-4">
                  <AccordionTrigger className="text-left font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="mt-16 bg-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h3>
          <p className="text-gray-600 mb-6">
            Our parent support team is available to address any concerns about your child's summer camp experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge className="bg-blue-500 text-white px-4 py-2 text-sm">
              <Phone className="mr-2 h-4 w-4" />
              Call: +1 (555) 123-4567
            </Badge>
            <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
              <Globe className="mr-2 h-4 w-4" />
              Email: parents@summercamps.com
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParentInformation;
