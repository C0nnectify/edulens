
const StudentPersonas = () => {
  const personas = [
    {
      type: "Village Student",
      needs: "Full mentorship & end-to-end help",
      description: "Complete guidance from application to arrival",
      color: "from-green-500 to-teal-500"
    },
    {
      type: "Normal Student", 
      needs: "Filtered info & eligibility tools",
      description: "Precise information and smart filtering",
      color: "from-blue-500 to-indigo-500"
    },
    {
      type: "Quality Student",
      needs: "Rankings, scholarships & professor links", 
      description: "Advanced research and networking tools",
      color: "from-purple-500 to-pink-500"
    },
    {
      type: "Not Self-dependent",
      needs: "Agency-like hand-holding",
      description: "Personal assistance every step of the way",
      color: "from-orange-500 to-red-500"
    },
    {
      type: "Self-dependent",
      needs: "DIY tools & peer connections",
      description: "Independent tools and community access",
      color: "from-teal-500 to-cyan-500"
    }
  ];

  const segments = [
    {
      type: "Type A Students",
      timeline: "Going abroad in 5-6 months",
      focus: "Urgent application support and fast-track guidance"
    },
    {
      type: "Type B Students", 
      timeline: "Planning 2-3 years ahead",
      focus: "Long-term planning and skill development roadmap"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Built for Every Student
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            No matter your background or needs, EduLens has the right tools and support for your journey.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Student Personas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className={`h-2 bg-gradient-to-r ${persona.color}`}></div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {persona.type}
                  </h4>
                  <p className="text-blue-600 font-semibold mb-3">
                    {persona.needs}
                  </p>
                  <p className="text-gray-600">
                    {persona.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Target Segments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {segments.map((segment, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-100">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">
                  {segment.type}
                </h4>
                <p className="text-lg text-blue-600 font-semibold mb-4">
                  {segment.timeline}
                </p>
                <p className="text-gray-700">
                  {segment.focus}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentPersonas;
