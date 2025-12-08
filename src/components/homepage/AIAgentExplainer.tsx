
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Zap } from 'lucide-react';

const AIAgentExplainer = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            💬 AI Tools vs AI Agents
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding the difference between task-based tools and intelligent assistants
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* AI Tools */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">AI Tools</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Task-based solutions for specific needs like document creation, budget planning, and research.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  SOP Generator
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Budget Estimator
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  University Matcher
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">
                  Perfect for: Specific tasks with clear objectives
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Agents */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-all border-2 border-purple-200">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">AI Agents</h3>
                  <span className="text-sm text-purple-600 font-medium">Recommended</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Smart assistants for ongoing support with 1:1 chat-like logic and contextual understanding.
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-800 italic">
                    &quot;What&apos;s the best country for MS in AI with 6.5 IELTS?&quot;
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-800 italic">
                    &quot;Help me compare UK vs Australia for cost and opportunities&quot;
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-800 font-medium">
                  Perfect for: Complex queries, ongoing guidance, personalized advice
                </p>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                onClick={() => navigate('/ai-agents')}
              >
                Explore AI Agents
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border mb-6">
            <span className="text-sm font-semibold text-gray-700">
              ✨ Try both and see which works best for your needs
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAgentExplainer;
