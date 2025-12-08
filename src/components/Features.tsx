
import { Search, Calculator, FileText, Users, Calendar, BookOpen } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Search,
      title: "AI Search & Chat",
      description: "GPT-powered 24/7 counselor with smart filters for budget, goals, location, and eligibility matching.",
      example: "Best CS programs in Germany under $15K"
    },
    {
      icon: Calculator,
      title: "Admission & Scholarship Calculators",
      description: "Predict your success using GPA, IELTS scores, and budget. Get realistic alternatives if needed.",
      example: "85% chance with your 3.7 GPA"
    },
    {
      icon: FileText,
      title: "AI Document Assistant",
      description: "SOP/Resume builder with NLP feedback, sample matching, and fake certificate detection.",
      example: "Your SOP needs more specific examples"
    },
    {
      icon: Users,
      title: "Mentorship Tools",
      description: "Book mentors by filters, video calls, and chat with students at your target universities.",
      example: "Connect with CS students in Germany"
    },
    {
      icon: Calendar,
      title: "Workflow Automations",
      description: "Auto-fill forms, visa checklists, currency converter, and email assistance.",
      example: "Auto-filled 12 university applications"
    },
    {
      icon: BookOpen,
      title: "Career & Course Planner",
      description: "Skill roadmap generator, internship predictions, and course credit planning.",
      example: "Your pathway to data science career"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Core AI-Powered Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to make your study abroad journey smoother, faster, and more successful.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {feature.description}
              </p>
              <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-700 font-medium">
                  Example: {feature.example}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
