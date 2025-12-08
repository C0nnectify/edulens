import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useState } from 'react';

const EventsSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const events = [
    {
      id: 1,
      title: "Harvard University Information Session",
      organizer: "Harvard University",
      type: "University",
      date: "Dec 15, 2024",
      time: "2:00 PM EST",
      location: "Virtual",
      attendees: 245,
      price: "Free",
      description: "Learn about Harvard's admission process, programs, and student life",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Study in Canada: Scholarship Workshop",
      organizer: "EduConsult Pro",
      type: "Workshop",
      date: "Dec 18, 2024",
      time: "10:00 AM GMT",
      location: "Toronto, Canada",
      attendees: 89,
      price: "$25",
      description: "Comprehensive guide to Canadian scholarships and funding opportunities",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      title: "STEM PhD Fair 2024",
      organizer: "Global STEM Alliance",
      type: "Fair",
      date: "Dec 22, 2024",
      time: "9:00 AM PST",
      location: "Virtual",
      attendees: 567,
      price: "Free",
      description: "Meet representatives from top STEM PhD programs worldwide",
      image: "/placeholder.svg"
    }
  ];

  const filters = {
    type: ['University', 'Workshop', 'Fair', 'Webinar', 'Conference'],
    location: ['Virtual', 'USA', 'UK', 'Canada', 'Australia'],
    price: ['Free', 'Under $25', '$25-$50', '$50+'],
    date: ['This Week', 'This Month', 'Next Month', 'Custom']
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Events & Opportunities
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with universities and organizations through our dynamic event platform
          </p>
        </div>

        {/* Enhanced Event Search Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl shadow-xl p-8 mb-12 border-2 border-purple-200">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Discover Amazing Events</h3>
            <p className="text-gray-600">Find workshops, university sessions, fairs, and networking opportunities</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-purple-500" />
              <input
                type="text"
                placeholder="Search events by title, organizer, topic, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-4 border-2 border-purple-200 rounded-xl text-lg focus:ring-4 focus:ring-purple-100 focus:border-purple-400 bg-white shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {['All Events', 'This Week', 'Free Events', 'Virtual', 'University Sessions'].map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  className="hover:bg-purple-50 hover:border-purple-300"
                >
                  {tag}
                </Button>
              ))}
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center hover:bg-purple-50 hover:border-purple-300"
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Event Filters'}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-6 p-6 bg-white rounded-xl border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(filters).map(([filterType, options]) => (
                    <div key={filterType}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {filterType}
                      </label>
                      <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">All</option>
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

        {/* Event Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
              <div className="relative">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.price === 'Free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {event.price}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center mb-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    {event.type}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                  {event.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {event.date} at {event.time}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {event.attendees} registered
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Register Now
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Host Event Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Host Your Event on Our Platform</h3>
          <p className="text-lg mb-6 opacity-90">
            Universities and organizations can easily connect with students through our event management system
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Event Creation</div>
              <div className="text-sm opacity-90">Easy setup & management</div>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Registration</div>
              <div className="text-sm opacity-90">Automated attendee management</div>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Analytics</div>
              <div className="text-sm opacity-90">Real-time insights & reporting</div>
            </div>
          </div>
          <Button 
            size="lg"
            variant="outline"
            className="bg-white text-purple-600 hover:bg-gray-100 border-white"
          >
            Start Hosting Events
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
