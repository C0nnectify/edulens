
import { AlertCircle, Clock, Users } from 'lucide-react';

const ProblemsWeSolve = () => {
  const problems = [
    {
      icon: AlertCircle,
      title: "Information Gap",
      description: "Students always target high-ranking universities that everybody can't afford or are not eligible for. Getting scholarship opportunities creates another hardship. However, students also don't know which university they are eligible for.",
      pain: "When they go to the agency for consultation, they suggest the university with which they partnered, which creates another information gap. Also, these agencies are only accessible to big-city students."
    },
    {
      icon: Clock,
      title: "Long-time Study Abroad Research",
      description: "Online, there is a lot of information about studying abroad. There are many blogs and websites for that. Also, there is no way to verify and validate that information.",
      pain: "So, students need to do a long period of research to get the exact and expected information. There is no other short-term way in their research process."
    },
    {
      icon: Users,
      title: "Connection Gap",
      description: "Students have no easy way to connect with international university students. In some cases, we found them on social media. But, there is no way to check reliability, and their response rate is very low.",
      pain: "Also, connecting directly with the university is impossible without email or an agency. That's why, as a medium, these agencies charge students a lot for consultancy and overall application processing."
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Problems We&apos;re Solving
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Traditional study abroad processes are broken. We&apos;re fixing them with AI and technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-white mr-3">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{problem.title}</h3>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-3">{problem.description}</p>
                  <p className="text-gray-700 text-sm font-medium">{problem.pain}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemsWeSolve;
