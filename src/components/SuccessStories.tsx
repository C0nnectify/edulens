
import { Button } from '@/components/ui/button';
import { Star, Quote } from 'lucide-react';

const SuccessStories = () => {
  const successStories = [
    {
      id: 1,
      name: "Tawsif Elahy",
      university: "Harvard University",
      program: "Computer Science Masters",
      country: "USA",
      image: "/placeholder.svg",
      story: "EduLens transformed my study abroad journey. The AI agents helped me identify the perfect universities and scholarships. I saved over $10,000 in agency fees and got accepted to my dream program at Harvard.",
      achievement: "Full Scholarship + Research Assistantship",
      rating: 5,
      year: "2024"
    },
    {
      id: 2,
      name: "Mohammad Sami",
      university: "University of Cambridge",
      program: "Engineering PhD",
      country: "UK",
      image: "/placeholder.svg",
      story: "The mentorship program connected me with Cambridge alumni who guided me through the application process. The AI tools helped perfect my research proposal, leading to my acceptance with full funding.",
      achievement: "PhD with Full Funding",
      rating: 5,
      year: "2024"
    },
    {
      id: 3,
      name: "Mohammad Ismail",
      university: "University of Toronto",
      program: "Business Administration",
      country: "Canada",
      image: "/placeholder.svg",
      story: "Coming from a small town, I had no idea about international education. EduLens AI agents walked me through every step - from university selection to visa processing. Now I'm studying at one of Canada's top universities.",
      achievement: "Merit Scholarship + Co-op Program",
      rating: 5,
      year: "2023"
    },
    {
      id: 4,
      name: "Mihad Ali",
      university: "University of Melbourne",
      program: "Data Science Masters",
      country: "Australia",
      image: "/placeholder.svg",
      story: "The platform's scholarship auto-applicator was incredible. It applied to over 50 scholarships on my behalf, and I received funding from three different sources. The entire process was seamless and stress-free.",
      achievement: "Multiple Scholarships + Work Permit",
      rating: 5,
      year: "2024"
    }
  ];

  const stats = [
    { number: "2000+", label: "Success Stories" },
    { number: "95%", label: "Admission Rate" },
    { number: "$2M+", label: "Scholarships Won" },
    { number: "50+", label: "Countries" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Success Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real students, real achievements. See how EduLens has transformed study abroad journeys worldwide
          </p>
        </div>

        {/* Success Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Success Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {successStories.map((story) => (
            <div key={story.id} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <img 
                  src={story.image} 
                  alt={story.name}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{story.name}</h3>
                  <p className="text-blue-600 font-medium">{story.program}</p>
                  <p className="text-gray-600 text-sm">{story.university} • {story.country}</p>
                </div>
              </div>

              <div className="mb-6">
                <Quote className="h-8 w-8 text-orange-400 mb-3" />
                <p className="text-gray-700 leading-relaxed italic">
                  &quot;{story.story}&quot;
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-green-600">{story.achievement}</div>
                  <div className="flex items-center">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-500">Class of {story.year}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-orange-600 to-yellow-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Write Your Success Story?</h3>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of students who&apos;ve achieved their study abroad dreams with EduLens
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              variant="outline"
              className="bg-white text-orange-600 hover:bg-gray-100 border-white"
            >
              View All Stories
            </Button>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
