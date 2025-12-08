
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, MapPin, DollarSign } from 'lucide-react';

const ComparisonToolPreview = () => {
  const comparisonData = [
    {
      university: 'MIT',
      country: 'USA',
      tuition: '$53,790',
      ranking: '#1',
      acceptanceRate: '7%',
      roi: 'Very High',
      roiColor: 'bg-green-500'
    },
    {
      university: 'Oxford',
      country: 'UK',
      tuition: '£28,370',
      ranking: '#2',
      acceptanceRate: '18%',
      roi: 'High',
      roiColor: 'bg-blue-500'
    },
    {
      university: 'ETH Zurich',
      country: 'Switzerland',
      tuition: 'CHF 1,330',
      ranking: '#7',
      acceptanceRate: '27%',
      roi: 'High',
      roiColor: 'bg-blue-500'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare Universities Side by Side</h2>
          <p className="text-lg text-gray-600">Make informed decisions with our comprehensive comparison tool</p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <Card className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
              <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                University Comparison Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold">University</th>
                      <th className="text-left p-4 font-semibold">Tuition</th>
                      <th className="text-left p-4 font-semibold">Ranking</th>
                      <th className="text-left p-4 font-semibold">Acceptance</th>
                      <th className="text-left p-4 font-semibold">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((uni, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{uni.university}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {uni.country}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {uni.tuition}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{uni.ranking}</Badge>
                        </td>
                        <td className="p-4">{uni.acceptanceRate}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${uni.roiColor}`}></div>
                            <span className="text-sm">{uni.roi}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-gray-50 text-center">
                <p className="text-gray-600 mb-4">This is just a preview. Compare 50+ factors including:</p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  <Badge variant="secondary">Location & Climate</Badge>
                  <Badge variant="secondary">Campus Life</Badge>
                  <Badge variant="secondary">Research Opportunities</Badge>
                  <Badge variant="secondary">Alumni Network</Badge>
                  <Badge variant="secondary">Industry Connections</Badge>
                </div>
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Try Full Comparison Tool
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-white shadow-lg text-center p-6">
              <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">ROI Analysis</h3>
              <p className="text-sm text-gray-600">Compare tuition costs vs. post-graduation earning potential</p>
            </Card>
            <Card className="bg-white shadow-lg text-center p-6">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Location Insights</h3>
              <p className="text-sm text-gray-600">Cost of living, job market, and quality of life data</p>
            </Card>
            <Card className="bg-white shadow-lg text-center p-6">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Custom Scoring</h3>
              <p className="text-sm text-gray-600">Weight factors that matter most to you</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonToolPreview;
