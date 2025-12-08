
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Star, HelpCircle, Users } from 'lucide-react';

const HighlightedThreads = () => {
  const highlightedSections = [
    {
      title: "🔥 Hot Discussions",
      icon: TrendingUp,
      items: [
        { title: "2025 Visa Updates for Canada", replies: 45, category: "Visa" },
        { title: "Best Cities for Tech Jobs", replies: 32, category: "Career" },
        { title: "Housing Crisis in Major Cities", replies: 28, category: "Housing" }
      ]
    },
    {
      title: "⭐ Staff Picks",
      icon: Star,
      items: [
        { title: "Complete SOP Writing Guide", replies: 156, category: "SOP" },
        { title: "Scholarship Application Timeline", replies: 89, category: "Funding" },
        { title: "Interview Tips from Alumni", replies: 67, category: "Career" }
      ]
    },
    {
      title: "❓ Need Answers",
      icon: HelpCircle,
      items: [
        { title: "GRE vs GMAT for Business School?", replies: 3, category: "Test Prep" },
        { title: "Work permit after graduation in Germany", replies: 1, category: "Visa" },
        { title: "Research opportunities in UK", replies: 0, category: "Academic" }
      ]
    }
  ];

  const topContributors = [
    { name: "Dr. Sarah Johnson", country: "Canada", badges: ["Expert", "Mentor"], contributions: 234 },
    { name: "Mike Chen", country: "Australia", badges: ["Alumni", "Top Contributor"], contributions: 189 },
    { name: "Priya Sharma", country: "India", badges: ["Student Leader"], contributions: 156 },
    { name: "James Wilson", country: "UK", badges: ["Verified"], contributions: 143 }
  ];

  return (
    <div className="space-y-6">
      {/* Highlighted Threads */}
      {highlightedSections.map((section, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <section.icon className="w-5 h-5" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="border-l-2 border-blue-200 pl-3 hover:border-blue-400 transition-colors cursor-pointer">
                <h4 className="font-medium text-sm text-gray-900 hover:text-blue-600 line-clamp-2">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {item.replies} replies
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Top Contributors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            🏆 Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topContributors.map((contributor, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {contributor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">
                  {contributor.name}
                </div>
                <div className="text-xs text-gray-500">
                  {contributor.country} • {contributor.contributions} contributions
                </div>
                <div className="flex gap-1 mt-1">
                  {contributor.badges.map((badge, badgeIndex) => (
                    <Badge key={badgeIndex} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <div className="text-sm text-gray-600">Questions this week</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">89%</div>
              <div className="text-xs text-gray-500">Answered</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">2.3h</div>
              <div className="text-xs text-gray-500">Avg. Response</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HighlightedThreads;
