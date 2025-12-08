
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Star, MapPin, DollarSign, Clock, Users, X, ExternalLink } from 'lucide-react';

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  category: string;
  filters: {
    location: string;
    budget: string;
    level: string;
  };
}

const SearchResultsModal = ({ isOpen, onClose, searchQuery, category, filters }: SearchResultsModalProps) => {
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    if (isOpen && searchQuery) {
      performSearch();
    }
  }, [isOpen, searchQuery, category, filters, performSearch]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock results based on search query and filters
    const mockResults = generateMockResults(searchQuery, category, filters);
    setResults(mockResults);
    setLoading(false);
  }, [searchQuery, category, filters]);

  const generateMockResults = (query: string, category: string, filters: unknown) => {
    const universities = [
      {
        type: 'university',
        id: 1,
        name: 'Massachusetts Institute of Technology',
        location: 'Cambridge, MA, USA',
        tuition: '$57,986',
        ranking: '#1 in Engineering',
        acceptanceRate: '7%',
        match: 92,
        image: '/placeholder.svg',
        programs: ['Computer Science', 'Engineering', 'Business'],
        deadline: '2024-01-01'
      },
      {
        type: 'university',
        id: 2,
        name: 'Stanford University',
        location: 'Stanford, CA, USA',
        tuition: '$61,731',
        ranking: '#2 in Computer Science',
        acceptanceRate: '4%',
        match: 89,
        image: '/placeholder.svg',
        programs: ['Computer Science', 'MBA', 'Medicine'],
        deadline: '2024-01-15'
      },
      {
        type: 'university',
        id: 3,
        name: 'University of Cambridge',
        location: 'Cambridge, UK',
        tuition: '£12,000',
        ranking: '#1 in UK',
        acceptanceRate: '21%',
        match: 85,
        image: '/placeholder.svg',
        programs: ['Natural Sciences', 'Engineering', 'Mathematics'],
        deadline: '2024-01-31'
      }
    ];

    const scholarships = [
      {
        type: 'scholarship',
        id: 1,
        name: 'Merit Scholarship Program',
        amount: '$15,000',
        provider: 'International Education Foundation',
        deadline: '2024-03-15',
        eligibility: 'GPA 3.5+, International Students',
        match: 95,
        renewable: true
      },
      {
        type: 'scholarship',
        id: 2,
        name: 'STEM Excellence Grant',
        amount: '$25,000',
        provider: 'Tech Innovation Foundation',
        deadline: '2024-04-01',
        eligibility: 'STEM Field, Undergraduate',
        match: 88,
        renewable: false
      }
    ];

    const programs = [
      {
        type: 'program',
        id: 1,
        name: 'Master of Computer Science',
        university: 'MIT',
        duration: '2 years',
        tuition: '$57,986/year',
        startDate: 'Fall 2024',
        requirements: 'GRE, TOEFL, Bachelor\'s in CS',
        match: 91
      },
      {
        type: 'program',
        id: 2,
        name: 'MBA Program',
        university: 'Stanford',
        duration: '2 years',
        tuition: '$74,706/year',
        startDate: 'Fall 2024',
        requirements: 'GMAT, Work Experience, Essays',
        match: 87
      }
    ];

    const mentors = [
      {
        type: 'mentor',
        id: 1,
        name: 'Dr. Sarah Johnson',
        expertise: 'Computer Science PhD',
        university: 'MIT Alumna',
        experience: '5 years mentoring',
        rating: 4.9,
        sessions: 150,
        specialties: ['PhD Applications', 'Research Guidance', 'Career Planning'],
        match: 94
      },
      {
        type: 'mentor',
        id: 2,
        name: 'Michael Chen',
        expertise: 'MBA Graduate',
        university: 'Stanford Alumnus',
        experience: '3 years mentoring',
        rating: 4.8,
        sessions: 89,
        specialties: ['MBA Applications', 'Essay Writing', 'Interview Prep'],
        match: 90
      }
    ];

    let filteredResults = [];
    
    if (category === 'all' || category === 'universities') {
      filteredResults.push(...universities);
    }
    if (category === 'all' || category === 'scholarships') {
      filteredResults.push(...scholarships);
    }
    if (category === 'all' || category === 'programs') {
      filteredResults.push(...programs);
    }
    if (category === 'all' || category === 'mentors') {
      filteredResults.push(...mentors);
    }

    // Apply filters
    if (filters.location) {
      filteredResults = filteredResults.filter(result => 
        result.location?.includes(filters.location) || 
        result.university?.includes(filters.location)
      );
    }

    // Sort by match score
    return filteredResults.sort((a, b) => (b.match || 0) - (a.match || 0));
  };

  const renderResult = (result: Record<string, unknown>) => {
    switch (result.type) {
      case 'university':
        return (
          <div key={result.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{result.name}</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{result.location}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                    <span className="text-sm">{result.tuition}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <Star className="h-4 w-4 inline mr-1" />
                    {result.ranking}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-2">
                  {result.match}% Match
                </div>
                <div className="text-sm text-gray-500">
                  Accept: {result.acceptanceRate}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {result.programs.map((program: string, index: number) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {program}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Deadline: {result.deadline}
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Learn More <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        );

      case 'scholarship':
        return (
          <div key={result.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{result.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{result.provider}</p>
                <p className="text-sm text-gray-500">{result.eligibility}</p>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-lg font-bold mb-2">
                  {result.amount}
                </div>
                <div className="text-sm text-gray-500">
                  {result.renewable ? 'Renewable' : 'One-time'}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Deadline: {result.deadline}
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Apply Now <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        );

      case 'mentor':
        return (
          <div key={result.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{result.name}</h3>
                <p className="text-gray-600 text-sm mb-1">{result.expertise}</p>
                <p className="text-gray-500 text-sm mb-2">{result.university}</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm">{result.rating}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm">{result.sessions} sessions</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {result.match}% Match
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {result.specialties.map((specialty: string, index: number) => (
                <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  {specialty}
                </span>
              ))}
            </div>
            <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
              Connect with Mentor
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const getResultCounts = () => {
    const counts = {
      all: results.length,
      universities: results.filter(r => r.type === 'university').length,
      scholarships: results.filter(r => r.type === 'scholarship').length,
      programs: results.filter(r => r.type === 'program').length,
      mentors: results.filter(r => r.type === 'mentor').length
    };
    return counts;
  };

  const filteredResults = selectedTab === 'all' 
    ? results 
    : results.filter(r => r.type === selectedTab.slice(0, -1));

  const counts = getResultCounts();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Search Results for &quot;{searchQuery}&quot;
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 text-lg">Searching across universities, scholarships, programs & mentors...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Result Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'all', label: `All (${counts.all})` },
                { key: 'universities', label: `Universities (${counts.universities})` },
                { key: 'scholarships', label: `Scholarships (${counts.scholarships})` },
                { key: 'programs', label: `Programs (${counts.programs})` },
                { key: 'mentors', label: `Mentors (${counts.mentors})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === tab.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="space-y-4">
              {filteredResults.length > 0 ? (
                filteredResults.map(renderResult)
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No results found for your search.</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search terms or filters.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchResultsModal;
