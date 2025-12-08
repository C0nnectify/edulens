
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const ComparisonTable = () => {
  const comparisonData = [
    {
      focus: "Campus Tours",
      format: "360° Virtual Reality",
      duration: "5-15 minutes",
      bestFor: "Academic facilities, campus size, atmosphere"
    },
    {
      focus: "City Tours",
      format: "Video + Interactive Map",
      duration: "10-20 minutes",
      bestFor: "Local culture, transport, cost of living"
    },
    {
      focus: "Dorm Tours",
      format: "Walk-through Video",
      duration: "3-8 minutes",
      bestFor: "Living conditions, room types, amenities"
    },
    {
      focus: "Lab Tours",
      format: "Guided 360° Tour",
      duration: "8-12 minutes",
      bestFor: "Research facilities, equipment, opportunities"
    }
  ];

  return (
    <section id="comparison" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Campus vs. City Tours
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare different tour types to find what's most relevant for your decision
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Tour Type Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-gray-900">Focus</TableHead>
                    <TableHead className="font-semibold text-gray-900">Format</TableHead>
                    <TableHead className="font-semibold text-gray-900">Duration</TableHead>
                    <TableHead className="font-semibold text-gray-900">Best For</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="font-semibold">
                          {row.focus}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.format}</TableCell>
                      <TableCell>{row.duration}</TableCell>
                      <TableCell className="text-sm text-gray-600">{row.bestFor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700 flex items-center gap-2">
                🏛️ Campus Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Academic buildings and libraries</li>
                <li>• Sports facilities and recreation centers</li>
                <li>• Student common areas and dining halls</li>
                <li>• Campus architecture and landscaping</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center gap-2">
                🏙️ City Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Public transportation and connectivity</li>
                <li>• Local culture and entertainment</li>
                <li>• Cost of living and housing options</li>
                <li>• Job opportunities and internships</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
