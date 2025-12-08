
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const Pricing = () => {
  const subscriptions = [
    {
      name: "Free",
      bdtPrice: "0",
      usdPrice: "$0",
      period: "month",
      features: [
        "Limited access",
        "5 scholarships/month", 
        "1 SOP sample",
        "Community access",
        "Basic tools"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Standard", 
      bdtPrice: "299-399",
      usdPrice: "$3-$5",
      period: "month",
      features: [
        "University guides",
        "10+ SOP samples",
        "Resume tools",
        "Peer connect",
        "Ad-free experience",
        "Priority support"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Premium",
      bdtPrice: "599-799", 
      usdPrice: "$6-$8",
      period: "month",
      features: [
        "Unlimited features",
        "1-on-1 mentor calls",
        "Custom checklists",
        "Priority support",
        "All AI agents",
        "Visa assistance"
      ],
      cta: "Go Premium",
      popular: false
    }
  ];

  const oneTimePacks = [
    {
      name: "SOP/Essay Pack",
      bdtPrice: "299-499",
      usdPrice: "$3-$5", 
      includes: "20 samples + 3 templates"
    },
    {
      name: "Scholarship Tracker",
      bdtPrice: "149",
      usdPrice: "$1.5",
      includes: "PDF guide + alerts"
    },
    {
      name: "Peer Call", 
      bdtPrice: "499-999",
      usdPrice: "$5-$10",
      includes: "1-on-1 call with verified peer"
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include our core AI features.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Subscription Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptions.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-blue-500 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-sm text-gray-500">🇧🇩</span>
                      <span className="text-3xl font-bold text-gray-900 ml-2">
                        {plan.bdtPrice}
                      </span>
                      <span className="text-gray-500 ml-1">BDT/{plan.period}</span>
                    </div>
                    <div className="flex items-baseline mt-1">
                      <span className="text-sm text-gray-500">🌍</span>
                      <span className="text-3xl font-bold text-gray-900 ml-2">
                        {plan.usdPrice}
                      </span>
                      <span className="text-gray-500 ml-1">/{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">One-Time Packs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {oneTimePacks.map((pack, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
                <h4 className="text-lg font-bold text-gray-900 mb-3">{pack.name}</h4>
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-sm text-gray-500">🇧🇩</span>
                    <span className="text-2xl font-bold text-gray-900 ml-2">{pack.bdtPrice}</span>
                    <span className="text-gray-500 ml-1">BDT</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-sm text-gray-500">🌍</span>
                    <span className="text-2xl font-bold text-gray-900 ml-2">{pack.usdPrice}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{pack.includes}</p>
                <Button variant="outline" className="w-full">
                  Buy Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
