
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, FileText, Calculator, Users, MessageSquare, Calendar, Search, Star, User, Book, Globe, Target } from 'lucide-react';
import AIJourneyModal from './AIJourneyModal';

const AIAgentsShowcase = () => {
  const [selectedAgent, setSelectedAgent] = useState<Record<string, unknown> | null>(null);
  const [journeyModal, setJourneyModal] = useState(false);

  const agents = [
    {
      id: 1,
      name: "Study Abroad Advisor",
      description: "24/7 virtual counselor providing custom guidance",
      icon: Bot,
      features: ["Eligibility questions", "University recommendations"],
      journey: ["Profile Setup", "Goals Analysis", "University Matching", "Recommendations", "Action Plan"]
    },
    {
      id: 2,
      name: "Document Assistant",
      description: "Streamlines application paperwork perfectly",
      icon: FileText,
      features: ["SOP analysis", "Resume comparison"],
      journey: ["Document Upload", "AI Analysis", "Improvement Suggestions", "Template Matching", "Final Review"]
    },
    {
      id: 3,
      name: "Financial Planning Agent",
      description: "Budget planning and scholarship hunting",
      icon: Calculator,
      features: ["Expense tracking", "Scholarship matching"],
      journey: ["Budget Assessment", "Cost Calculation", "Scholarship Search", "Financial Planning", "Funding Strategy"]
    },
    {
      id: 4,
      name: "Connection Engine",
      description: "Connect with the right people",
      icon: Users,
      features: ["Alumni finder", "Mentor matching"],
      journey: ["Profile Creation", "Interest Matching", "Network Analysis", "Connection Suggestions", "Introductions"]
    },
    {
      id: 5,
      name: "Community Builder",
      description: "Find your study abroad tribe",
      icon: MessageSquare,
      features: ["Student matching", "Support groups"],
      journey: ["Community Scan", "Interest Alignment", "Group Matching", "Introduction", "Engagement"]
    },
    {
      id: 6,
      name: "Planning Agent",
      description: "Map your entire academic journey",
      icon: Calendar,
      features: ["Personalized roadmaps", "Progress tracking"],
      journey: ["Goal Setting", "Timeline Creation", "Milestone Planning", "Progress Tracking", "Adjustments"]
    },
    {
      id: 7,
      name: "Research Assistant",
      description: "Deep dive into programs and universities",
      icon: Search,
      features: ["Program comparison", "University ranking"],
      journey: ["Research Query", "Data Gathering", "Analysis", "Comparison", "Report Generation"]
    },
    {
      id: 8,
      name: "Application Tracker",
      description: "Never miss a deadline or requirement",
      icon: Target,
      features: ["Deadline reminders", "Status updates"],
      journey: ["Application Setup", "Requirement Tracking", "Progress Monitoring", "Deadline Management", "Submission"]
    },
    {
      id: 9,
      name: "Visa Guide",
      description: "Navigate visa processes with confidence",
      icon: Globe,
      features: ["Visa requirements", "Interview prep"],
      journey: ["Country Selection", "Requirement Analysis", "Document Preparation", "Interview Prep", "Application Support"]
    },
    {
      id: 10,
      name: "Career Counselor",
      description: "Align studies with career goals",
      icon: Star,
      features: ["Career mapping", "Industry insights"],
      journey: ["Career Assessment", "Industry Research", "Skill Gap Analysis", "Course Alignment", "Career Planning"]
    },
    {
      id: 11,
      name: "Cultural Advisor",
      description: "Prepare for life in a new country",
      icon: User,
      features: ["Cultural tips", "Local insights"],
      journey: ["Country Research", "Cultural Analysis", "Preparation Tips", "Local Connections", "Integration Support"]
    },
    {
      id: 12,
      name: "Academic Planner",
      description: "Optimize your academic journey",
      icon: Book,
      features: ["Course selection", "Academic strategy"],
      journey: ["Academic Assessment", "Course Research", "Schedule Planning", "Credit Transfer", "Graduation Planning"]
    },
    {
      id: 13,
      name: "Success Mentor",
      description: "Personal AI mentor for continuous support",
      icon: MessageSquare,
      features: ["Progress monitoring", "Motivation boost"],
      journey: ["Goal Setting", "Progress Check-ins", "Challenge Support", "Motivation", "Success Celebration"]
    }
  ];

  const handleStartJourney = (agent: Record<string, unknown>) => {
    setSelectedAgent(agent);
    setJourneyModal(true);
  };

  return (
    <>
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              13 AI Agents Working for You
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each AI agent provides a complete workable journey to solve specific challenges in your study abroad process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {agents.map((agent) => {
              const IconComponent = agent.icon;
              return (
                <div 
                  key={agent.id}
                  className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white mr-3">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold text-blue-600">Agent #{agent.id}</div>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight">
                    {agent.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {agent.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {agent.features.map((feature, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-500 mb-1">JOURNEY STEPS:</div>
                    <div className="text-xs text-gray-600">
                      {agent.journey.join(' → ')}
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    onClick={() => handleStartJourney(agent)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group-hover:shadow-lg transition-all text-sm"
                  >
                    Start Journey <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center bg-white px-6 py-3 rounded-full shadow-md">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-gray-700 font-medium">All 13 AI agents active and ready to help</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Journey Modal */}
      {selectedAgent && (
        <AIJourneyModal
          isOpen={journeyModal}
          onClose={() => {
            setJourneyModal(false);
            setSelectedAgent(null);
          }}
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          journey={selectedAgent.journey}
          toolType="agent"
        />
      )}
    </>
  );
};

export default AIAgentsShowcase;
