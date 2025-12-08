
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Shield, Award } from 'lucide-react';

const TrustBadges = () => {
  const badges = [
    {
      icon: CheckCircle,
      title: 'Verified Reviewer',
      description: 'Email and student status verified',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      icon: Star,
      title: 'SOP Accepted',
      description: 'Successfully admitted with our help',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      icon: Award,
      title: 'Top Reviewer',
      description: '100+ helpful votes earned',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      icon: Shield,
      title: 'Expert Contributor',
      description: 'Industry professional or mentor',
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    }
  ];

  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Trust & Verification Badges</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          We verify our reviewers to ensure authentic experiences. Look for these badges when reading reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map((badge, index) => {
          const IconComponent = badge.icon;
          return (
            <div key={index} className="text-center group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${badge.color} mb-4`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg mb-2">{badge.title}</h3>
                <p className="text-gray-600 text-sm">{badge.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
          <Shield className="w-4 h-4 mr-2" />
          100% Verified Reviews
        </Badge>
      </div>
    </section>
  );
};

export default TrustBadges;
