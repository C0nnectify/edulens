'use client';

import { useState } from 'react';
import { Check, HelpCircle, ChevronDown } from 'lucide-react';

const PricingAndFAQ = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for exploring your options',
      features: [
        'AI Program Research (3 searches)',
        'Basic SOP Template',
        'Application Tracker',
        'Community Access',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'For serious applicants',
      features: [
        'Unlimited Program Research',
        'AI-Generated SOPs & Essays',
        'Smart Deadline Tracking',
        'LOR Templates',
        'Priority Support',
        'Document Reviews',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Premium',
      price: '$99',
      period: '/month',
      description: 'Complete application suite',
      features: [
        'Everything in Pro',
        '1-on-1 Expert Consultation',
        'Interview Preparation',
        'Visa Guidance',
        'Scholarship Matching',
        'Unlimited Revisions',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'How does the AI generate personalized documents?',
      answer: 'Our AI analyzes your profile, academic background, and target programs to create unique, compelling SOPs and essays that highlight your strengths and align with university requirements.',
    },
    {
      question: 'Can I use EduLens for multiple countries?',
      answer: 'Yes! EduLens supports applications to 50+ countries including USA, UK, Canada, Australia, Germany, and more. Our AI adapts to different application requirements.',
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes, we offer a 7-day free trial for the Pro plan. No credit card required. You can explore all features and cancel anytime.',
    },
    {
      question: 'How accurate is the program matching?',
      answer: 'Our AI achieves 95% accuracy by analyzing thousands of data points including your profile, preferences, admission statistics, and program requirements.',
    },
    {
      question: 'Can I get help from human experts?',
      answer: 'Premium plan includes 1-on-1 consultations with study abroad experts. Pro and Starter users have access to our community and email support.',
    },
  ];

  return (
    <section className="py-20 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pricing Section */}
        <div className="mb-24">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1724] mb-4">
              Choose Your Success Plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, transparent pricing. Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular
                    ? 'border-[#5C6BFF] shadow-xl scale-105'
                    : 'border-gray-200 shadow-lg'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-[#0F1724] mb-2">{plan.name}</h3>
                
                {/* Description */}
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#0F1724]">{plan.price}</span>
                  {plan.period && <span className="text-gray-600">{plan.period}</span>}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-3 rounded-full font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#5C6BFF] to-[#7C4DFF] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-[#F6F9FF] text-[#5C6BFF] hover:bg-[#5C6BFF] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1724] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about EduLens
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-start justify-between p-6 text-left"
                  aria-expanded={openFAQ === index}
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <HelpCircle className="w-6 h-6 text-[#5C6BFF] flex-shrink-0 mt-1" />
                    <span className="font-semibold text-[#0F1724] text-lg pr-4">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openFAQ === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-6 pl-16">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingAndFAQ;
