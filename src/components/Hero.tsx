import { Button } from '@/components/ui/button';
import { ArrowDown, Search, Filter, Globe, Users, BookOpen, Star, X, Play, GraduationCap, FileText, Send, Award, Plane, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import SearchResultsModal from './SearchResultsModal';
import { useWaitlistModal } from '@/hooks/useWaitlistModal';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    budget: '',
    level: ''
  });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { openFromHero } = useWaitlistModal();

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'universities', name: 'Universities' },
    { id: 'scholarships', name: 'Scholarships' },
    { id: 'programs', name: 'Programs' },
    { id: 'mentors', name: 'Mentors' }
  ];

  const filters = {
    location: ['USA', 'UK', 'Canada', 'Australia', 'Germany'],
    budget: ['Under $20K', '$20K-$40K', '$40K-$60K', '$60K+'],
    level: ['Undergraduate', 'Masters', 'PhD']
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const journeySteps = [
    { 
      step: 1, 
      title: "Profile", 
      icon: Users,
      color: "from-blue-500 to-purple-500"
    },
    { 
      step: 2, 
      title: "Match", 
      icon: GraduationCap,
      color: "from-emerald-500 to-teal-500"
    },
    { 
      step: 3, 
      title: "Apply", 
      icon: FileText,
      color: "from-orange-500 to-red-500"
    },
    { 
      step: 4, 
      title: "Fund", 
      icon: Award,
      color: "from-yellow-500 to-orange-500"
    },
    { 
      step: 5, 
      title: "Visa", 
      icon: Plane,
      color: "from-green-500 to-emerald-500"
    },
    { 
      step: 6, 
      title: "Success", 
      icon: Star,
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <>
      <section className="pt-20 pb-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-300 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-teal-300 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="max-w-5xl mx-auto">
              {/* Trust Badge */}
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg border border-emerald-200 mb-8">
                <Star className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">AI-Powered • Expert Mentors • Global Reach</span>
              </div>

              {/* Enhanced Main Headline */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 opacity-20 blur-3xl rounded-3xl"></div>
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 mb-6 leading-tight relative z-10 drop-shadow-2xl">
                  <span className="block animate-fade-in">Your Dreams Deserve</span>
                  <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">
                    a Clear Vision
                  </span>
                </h1>
                {/* Decorative elements */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full opacity-60 animate-bounce delay-300"></div>
                <div className="absolute top-0 -right-6 w-6 h-6 bg-pink-400 rounded-full opacity-60 animate-bounce delay-500"></div>
                <div className="absolute -bottom-2 left-1/4 w-4 h-4 bg-blue-400 rounded-full opacity-60 animate-bounce delay-700"></div>
              </div>
              
              {/* Clear Value Proposition */}
              <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-4xl mx-auto leading-relaxed font-medium">
                The first AI-powered platform that replaces traditional study abroad consultants
              </p>
              
              <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
                Get personalized guidance, university matching, scholarship hunting, and application support — all powered by AI and expert mentors, at a fraction of agency costs.
              </p>

              {/* Enhanced Search Engine */}
              <div className="max-w-3xl mx-auto mb-12">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Start Your Journey Today</h3>
                    <p className="text-gray-600 text-sm">Search from 100+ universities, 500+ scholarships, and 1000+ expert mentors</p>
                  </div>
                  
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-6 w-6 text-emerald-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search universities, scholarships, programs, mentors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="block w-full pl-14 pr-4 py-4 border-2 border-emerald-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                    />
                  </div>

                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className={selectedCategory === category.id ? 
                          "bg-emerald-500 hover:bg-emerald-600" : 
                          "hover:bg-emerald-50 hover:border-emerald-300"
                        }
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>

                  {/* Advanced Filters Toggle */}
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center hover:bg-emerald-50"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      {showFilters ? 'Hide Filters' : 'Advanced Filters'}
                    </Button>
                  </div>

                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(filters).map(([filterType, options]) => (
                          <div key={filterType}>
                            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                              {filterType}
                            </label>
                            <select 
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              value={selectedFilters[filterType as keyof typeof selectedFilters]}
                              onChange={(e) => setSelectedFilters(prev => ({
                                ...prev,
                                [filterType]: e.target.value
                              }))}
                            >
                              <option value="">Select {filterType}</option>
                              {options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Call to Action Buttons - Moved after search engine */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button 
                  size="lg" 
                  onClick={openFromHero}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold min-w-[200px]"
                >
                  Join Waitlist
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-10 py-4 rounded-xl border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold min-w-[200px] inline-flex items-center"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
              {/* New: Explore Scholarship Finder CTA */}
              <div className="flex justify-center mb-4">
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-4 rounded-xl border-2 border-purple-500 text-purple-700 bg-white hover:bg-purple-50 hover:text-purple-800 font-semibold min-w-[250px] shadow hover:shadow-xl inline-flex items-center gap-2 animate-fade-in"
                  onClick={() => window.location.href = "/scholarships"}
                  aria-label="Explore Scholarships"
                >
                  <Award className="w-5 h-5 mr-2 text-purple-500" />
                  Find Scholarships
                </Button>
              </div>
              {/* New: Explore Virtual Tours CTA */}
              <div className="flex justify-center mb-16">
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-4 rounded-xl border-2 border-blue-500 text-blue-700 bg-white hover:bg-blue-50 hover:text-blue-800 font-semibold min-w-[250px] shadow hover:shadow-xl inline-flex items-center gap-2 animate-fade-in"
                  onClick={() => window.location.href = "/virtual-tours"}
                  aria-label="Explore Virtual Tours"
                >
                  <Globe className="w-5 h-5 mr-2 text-blue-500" />
                  Explore Virtual Tours
                </Button>
              </div>

              {/* Horizontal Journey Steps */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-6xl mx-auto border border-emerald-100 mb-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg mb-4">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    <span className="font-semibold">Your Path to Success</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">6 Simple Steps to Study Abroad</h3>
                  <p className="text-gray-600">AI-powered guidance at every step</p>
                </div>
                
                {/* Horizontal Steps */}
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-emerald-300 to-green-500 hidden md:block"></div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {journeySteps.map((step, index) => {
                      const IconComponent = step.icon;
                      
                      return (
                        <div key={step.step} className="relative text-center">
                          {/* Step Icon */}
                          <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center shadow-lg mx-auto mb-3 relative z-10`}>
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>
                          
                          {/* Step Number */}
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
                            {step.step}
                          </div>
                          
                          {/* Step Title */}
                          <h4 className="text-sm font-bold text-gray-800 mb-2">{step.title}</h4>
                          
                          {/* Arrow (except for last step) */}
                          {index < journeySteps.length - 1 && (
                            <div className="hidden md:block absolute top-8 -right-8 text-gray-300">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Success Stats */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-emerald-600 mb-1">99%</div>
                        <div className="text-gray-600 text-xs font-medium">Success Rate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600 mb-1">10K+</div>
                        <div className="text-gray-600 text-xs font-medium">Students</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600 mb-1">50+</div>
                        <div className="text-gray-600 text-xs font-medium">Countries</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600 mb-1">24/7</div>
                        <div className="text-gray-600 text-xs font-medium">AI Support</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Proof Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-6xl mx-auto border border-emerald-100">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Join Thousands of Students Worldwide</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">13</div>
                    <div className="text-gray-600 text-sm font-medium">AI Tools</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-600 mb-2">100+</div>
                    <div className="text-gray-600 text-sm font-medium">Universities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-600 mb-2">1000+</div>
                    <div className="text-gray-600 text-sm font-medium">Expert Mentors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-700 mb-2">500+</div>
                    <div className="text-gray-600 text-sm font-medium">Global Events</div>
                  </div>
                </div>
                
                {/* Trust Indicators */}
                <div className="border-t border-gray-200 mt-6 pt-6">
                  <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      No Hidden Fees
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Expert Verified
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      24/7 AI Support
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Global Recognition
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <ArrowDown className="h-6 w-6 text-gray-400 mx-auto animate-bounce" />
          </div>
        </div>
      </section>

      {/* Search Results Modal */}
      <SearchResultsModal
        isOpen={showSearchResults}
        onClose={() => setShowSearchResults(false)}
        searchQuery={searchQuery}
        category={selectedCategory}
        filters={selectedFilters}
      />
    </>
  );
};

export default Hero;
