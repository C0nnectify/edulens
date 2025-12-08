"use client";

import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import React, { useState } from "react";

const FAQSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How long does the entire process take?",
          answer:
            "Our AI platform can complete the entire process from profile analysis to application submission in 2-4 weeks, compared to 6-12 months with traditional methods. This includes research, document creation, and application submission.",
        },
        {
          question: "What information do I need to provide?",
          answer:
            "You'll need to provide your academic transcripts, test scores (IELTS/TOEFL, GRE/GMAT if applicable), personal statement draft, resume, and your preferences for countries, programs, and budget. Our AI will guide you through the process step by step.",
        },
        {
          question: "Is there a free consultation available?",
          answer:
            "Yes! We offer a free 30-minute consultation where our AI analyzes your profile and provides initial recommendations. This helps you understand how our platform can help you before committing to the full service.",
        },
      ],
    },
    {
      category: "AI Technology",
      questions: [
        {
          question: "How accurate is the AI in finding suitable programs?",
          answer:
            "Our AI has a 95% success rate in matching students with suitable programs. It analyzes thousands of data points including your academic profile, preferences, and university requirements to provide highly accurate recommendations.",
        },
        {
          question: "Are the documents created by AI authentic?",
          answer:
            "Yes, our AI creates authentic, personalized documents based on your unique profile and experiences. The AI doesn't fabricate information but helps you present your achievements and goals in the most compelling way possible.",
        },
        {
          question: "How does the 24/7 tracking work?",
          answer:
            "Our AI continuously monitors university application portals and detects any status changes. You'll receive instant notifications via WhatsApp, email, and SMS whenever there's an update to your application status.",
        },
      ],
    },
    {
      category: "Pricing & Support",
      questions: [
        {
          question: "What is the cost of using the platform?",
          answer:
            "Our pricing is significantly lower than traditional consultants, starting at $299 for the complete service. This includes profile analysis, program matching, document creation, application submission, and ongoing tracking. We also offer payment plans to make it affordable for everyone.",
        },
        {
          question: "What if I'm not satisfied with the results?",
          answer:
            "We offer a 100% satisfaction guarantee. If you're not accepted to any of the recommended universities, we'll provide a full refund. We're confident in our AI's ability to help you succeed.",
        },
        {
          question: "Do you provide support after I get accepted?",
          answer:
            "Yes! We provide comprehensive post-acceptance support including visa application assistance, accommodation guidance, cultural preparation, and ongoing support throughout your study abroad journey.",
        },
      ],
    },
    {
      category: "Technical Questions",
      questions: [
        {
          question: "Is my personal information secure?",
          answer:
            "Absolutely. We use enterprise-grade encryption and security measures to protect your personal information. Your data is never shared with third parties without your explicit consent, and we comply with all international data protection regulations.",
        },
        {
          question: "Can I use the platform on my mobile device?",
          answer:
            "Yes! Our platform is fully responsive and works seamlessly on all devices including smartphones and tablets. You can track your applications, receive notifications, and communicate with our AI agents from anywhere.",
        },
        {
          question: "What if I need to make changes to my applications?",
          answer:
            "Our AI platform allows you to make changes to your applications at any time before submission. After submission, our tracking system will monitor for any updates and notify you of any required actions.",
        },
      ],
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 px-6 py-3 rounded-full shadow-sm mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-semibold text-blue-700">
              Frequently Asked Questions
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Know
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get answers to the most common questions about our AI-powered study
            abroad platform.
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              className="bg-white rounded-lg shadow-sm overflow-hidden border"
            >
              <div className="bg-blue-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">
                  {category.category}
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 10 + faqIndex;
                  const isOpen = openItems.includes(globalIndex);

                  return (
                    <div key={faqIndex} className="p-6">
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-lg p-2 -m-2"
                      >
                        <h4 className="text-lg font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </h4>
                        {isOpen ? (
                          <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="mt-4 pl-2">
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 bg-white rounded-lg p-8 border shadow-sm text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still Have Questions?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our AI support team is available 24/7 to answer any questions you
            might have about our platform or the study abroad process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-sm">
              Chat with AI Support
            </button>
            <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-all">
              Schedule a Call
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
