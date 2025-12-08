
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, Video } from 'lucide-react';
import { useState } from 'react';

const VirtualConsultation = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
    consultationType: '',
    preferredTime: '',
    message: ''
  });

  const consultationTypes = [
    { id: 'university-selection', name: 'University Selection', duration: '30 min' },
    { id: 'application-review', name: 'Application Review', duration: '45 min' },
    { id: 'scholarship-guidance', name: 'Scholarship Guidance', duration: '30 min' },
    { id: 'visa-consultation', name: 'Visa Consultation', duration: '45 min' },
    { id: 'comprehensive', name: 'Comprehensive Planning', duration: '60 min' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Virtual Consultation & Mentorship
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get personalized guidance from our expert counselors and connect directly with mentors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Consultation Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Book Your Consultation</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({...formData, program: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Program</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="masters">Masters</option>
                  <option value="phd">PhD</option>
                  <option value="summer">Summer Program</option>
                </select>
              </div>

              <select
                value={formData.consultationType}
                onChange={(e) => setFormData({...formData, consultationType: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Consultation Type</option>
                {consultationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.duration})
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={formData.preferredTime}
                onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />

              <textarea
                placeholder="Tell us about your study abroad goals..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 py-4 text-lg"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Consultation
              </Button>
            </form>
          </div>

          {/* Consultation Features */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <Video className="h-8 w-8 text-blue-600 mr-3" />
                <h4 className="text-xl font-semibold text-gray-900">Video Consultation</h4>
              </div>
              <p className="text-gray-600 mb-4">
                Face-to-face virtual meetings with our expert counselors for personalized guidance
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Screen sharing for document review</li>
                <li>• Recording available for later reference</li>
                <li>• Flexible scheduling across time zones</li>
                <li>• Follow-up session included</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <MessageSquare className="h-8 w-8 text-green-600 mr-3" />
                <h4 className="text-xl font-semibold text-gray-900">Chat Support</h4>
              </div>
              <p className="text-gray-600 mb-4">
                Instant messaging with counselors for quick questions and ongoing support
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 24/7 AI-powered initial responses</li>
                <li>• Direct access to human counselors</li>
                <li>• Document sharing capabilities</li>
                <li>• Chat history saved for reference</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h4 className="text-xl font-semibold mb-3">Why Choose Our Consultation?</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Expert Counselors</div>
                  <div className="opacity-90">10+ years experience</div>
                </div>
                <div>
                  <div className="font-semibold">Success Rate</div>
                  <div className="opacity-90">95% admission success</div>
                </div>
                <div>
                  <div className="font-semibold">Response Time</div>
                  <div className="opacity-90">Within 24 hours</div>
                </div>
                <div>
                  <div className="font-semibold">Follow-up</div>
                  <div className="opacity-90">Until you succeed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VirtualConsultation;
