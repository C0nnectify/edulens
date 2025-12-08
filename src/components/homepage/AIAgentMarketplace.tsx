"use client";

import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  DollarSign,
  GitCompare,
  GraduationCap,
  Mic,
  PenTool,
  Plane,
  User,
  Users,
} from "lucide-react";
import React, { useState } from "react";

interface Agent {
  id: number;
  name: string;
  summary: string;
  icon: React.ElementType;
  phase: string;
  phaseKey: string;
  status: "active" | "coming-soon";
}

const phases = [
  {
    key: "explore",
    label: "🧭 Explore & Discover",
    color: "bg-blue-100 text-blue-800",
  },
  {
    key: "plan",
    label: "🎯 Plan Your Path",
    color: "bg-purple-100 text-purple-800",
  },
  {
    key: "build",
    label: "✍️ Build Your Profile",
    color: "bg-green-100 text-green-800",
  },
  {
    key: "apply",
    label: "📄 Apply with Confidence",
    color: "bg-orange-100 text-orange-800",
  },
  {
    key: "interview",
    label: "🎤 Interview Ready",
    color: "bg-red-100 text-red-800",
  },
  {
    key: "predeparture",
    label: "✈️ Pre-Departure",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    key: "settle",
    label: "🏠 Settle Abroad",
    color: "bg-emerald-100 text-emerald-800",
  },
];

const agents: Agent[] = [
  {
    id: 1,
    name: "Profile Evaluation Agent",
    summary: "Get comprehensive assessment of your academic profile",
    icon: User,
    phase: "🧭 Explore & Discover",
    phaseKey: "explore",
    status: "coming-soon",
  },
  {
    id: 2,
    name: "Smart Comparison Engine",
    summary: "Compare universities, programs, and opportunities",
    icon: GitCompare,
    phase: "🎯 Plan Your Path",
    phaseKey: "plan",
    status: "coming-soon",
  },
  {
    id: 3,
    name: "Smart Connection Engine",
    summary: "Find mentors, alumni, and study abroad peers",
    icon: Users,
    phase: "🎯 Plan Your Path",
    phaseKey: "plan",
    status: "coming-soon",
  },
  {
    id: 4,
    name: "Smart Writing Assistant",
    summary: "Build SOPs, resumes, emails with AI guidance",
    icon: PenTool,
    phase: "✍️ Build Your Profile",
    phaseKey: "build",
    status: "coming-soon",
  },
  {
    id: 5,
    name: "Financial Planning Agent",
    summary: "Plan budgets, scholarships, and funding strategies",
    icon: DollarSign,
    phase: "📄 Apply with Confidence",
    phaseKey: "apply",
    status: "coming-soon",
  },
  {
    id: 6,
    name: "Application Tracker Agent",
    summary: "Track deadlines, requirements, and submissions",
    icon: ClipboardList,
    phase: "📄 Apply with Confidence",
    phaseKey: "apply",
    status: "coming-soon",
  },
  {
    id: 7,
    name: "Interview Prep Agent",
    summary: "Practice interviews with AI-powered feedback",
    icon: Mic,
    phase: "🎤 Interview Ready",
    phaseKey: "interview",
    status: "coming-soon",
  },
  {
    id: 8,
    name: "Academic & Career Mentor",
    summary: "Align your academic plan with career goals",
    icon: GraduationCap,
    phase: "✍️ Build Your Profile",
    phaseKey: "build",
    status: "coming-soon",
  },
  {
    id: 9,
    name: "Pre-Departure Coach",
    summary: "Get ready for life abroad with pre-departure guidance",
    icon: Plane,
    phase: "✈️ Pre-Departure",
    phaseKey: "predeparture",
    status: "coming-soon",
  },
  {
    id: 10,
    name: "Post-Arrival Coach",
    summary: "Navigate life abroad with personalized guidance",
    icon: Plane,
    phase: "🏠 Settle Abroad",
    phaseKey: "settle",
    status: "coming-soon",
  },
];

const AIAgentMarketplace = () => {
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  const filteredAgents =
    selectedPhase === "all"
      ? agents
      : agents.filter((agent) => agent.phaseKey === selectedPhase);

  const handleLaunchAgent = (agent: Agent) => {
    if (agent.status === "coming-soon") {
      alert("This agent is coming soon! We'll notify you when it's ready.");
    } else {
      alert(`Launching ${agent.name}... Coming soon with full functionality!`);
    }
  };

  return (
    <section
      id="ai-agent-marketplace"
      className="py-16 sm:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 sm:mb-6 shadow-lg">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 sm:mb-6 px-4">
            Study Abroad AI Agents
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Navigate your study abroad journey with specialized AI agents
            designed for each phase of your academic adventure
          </p>
        </div>

        {/* Phase Filter Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-8 mb-8 sm:mb-12 border border-white/50">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <button
              onClick={() => setSelectedPhase("all")}
              className={`px-4 sm:px-8 py-2 sm:py-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedPhase === "all"
                  ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200"
              }`}
            >
              <span className="text-sm sm:text-lg mr-1 sm:mr-2">🌟</span>
              All Agents
            </button>
            {phases.map((phase) => (
              <button
                key={phase.key}
                onClick={() => setSelectedPhase(phase.key)}
                className={`px-4 sm:px-8 py-2 sm:py-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  selectedPhase === phase.key
                    ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200"
                }`}
              >
                {phase.label}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
          {filteredAgents.map((agent) => {
            const IconComponent = agent.icon;
            const phaseColor =
              phases.find((p) => p.key === agent.phaseKey)?.color ||
              "bg-gray-100 text-gray-800";

            return (
              <div
                key={agent.id}
                className="group bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 border border-white/50 relative overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

                {/* Icon and Status */}
                <div className="relative z-10 flex items-start justify-between mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <IconComponent className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 group-hover:text-purple-600 transition-colors duration-300" />
                  </div>
                  <div className="px-2 sm:px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full">
                    <span className="text-xs font-semibold text-amber-700">
                      Coming Soon
                    </span>
                  </div>
                </div>

                {/* Agent Info */}
                <div className="relative z-10">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-800 transition-colors duration-300">
                    {agent.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 line-clamp-3 leading-relaxed">
                    {agent.summary}
                  </p>

                  {/* Phase Tag */}
                  <div className="mb-4 sm:mb-6">
                    <span
                      className={`inline-block px-3 sm:px-4 py-1 sm:py-2 rounded-xl text-xs font-semibold shadow-sm ${phaseColor}`}
                    >
                      {agent.phase}
                    </span>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleLaunchAgent(agent)}
                    className="w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold py-2 sm:py-3 text-sm sm:text-base"
                    disabled={true}
                  >
                    <span className="mr-1 sm:mr-2">🚀</span>
                    Coming Soon
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom decoration */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
            <span className="text-white text-lg sm:text-xl">✨</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAgentMarketplace;
