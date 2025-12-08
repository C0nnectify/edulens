
const AIAgents = () => {
  const agents = [
    { name: "Personalized Study Abroad Advisor", description: "Custom guidance for your unique goals" },
    { name: "AI Document Assistant", description: "Perfect SOPs and resumes every time" },
    { name: "Financial Planning Agent", description: "Budget planning and scholarship hunting" },
    { name: "AI Connection Engine", description: "Connect with the right people" },
    { name: "Peer Community Builder", description: "Find your study abroad tribe" },
    { name: "Long-Term Planner Agent", description: "Map your entire academic journey" },
    { name: "Advanced AI Tools", description: "Fake certificate checker and more" },
    { name: "AI University Comparison Agent", description: "Side-by-side university analysis" },
    { name: "AI Suggestion Engine", description: "Smart recommendations for everything" },
    { name: "AI Application Tracker", description: "Never miss a deadline again" },
    { name: "Scholarship Auto-Applicator", description: "Apply to relevant scholarships automatically" },
    { name: "Email Writing Assistant", description: "Professional emails made easy" },
    { name: "Course Planner Agent", description: "Plan your academic curriculum" }
  ];

  return (
    <section id="ai-agents" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            13 AI Agents Working for You
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our specialized AI agents handle every aspect of your study abroad journey, 
            so you can focus on what matters most - your dreams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {agent.name}
                  </h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                {agent.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center bg-white px-6 py-3 rounded-full shadow-md">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-gray-700 font-medium">All agents active and ready to help</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAgents;
