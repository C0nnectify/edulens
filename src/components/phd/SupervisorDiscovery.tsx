
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, User, Mail } from 'lucide-react';

const SupervisorDiscovery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');

  const supervisors = [
    {
      id: 1,
      name: "Dr. Laura Becker",
      university: "University of Cambridge",
      interests: ["AI Ethics", "Natural Language Processing", "Machine Learning"],
      accepting: true,
      email: "l.becker@cam.ac.uk"
    },
    {
      id: 2,
      name: "Prof. Michael Chen",
      university: "Stanford University",
      interests: ["Computer Vision", "Deep Learning", "Robotics"],
      accepting: true,
      email: "mchen@stanford.edu"
    },
    {
      id: 3,
      name: "Dr. Sarah Williams",
      university: "ETH Zurich",
      interests: ["Quantum Computing", "Algorithms", "Theoretical CS"],
      accepting: false,
      email: "s.williams@ethz.ch"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Research Supervisor</h2>
          <p className="text-lg text-gray-600">Connect with leading researchers in your field</p>
        </div>
        
        <Card className="bg-gray-50 shadow-lg rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-center text-xl">Search Supervisors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search by name or keyword</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="e.g., machine learning, Dr. Smith"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="field">Research Field</Label>
                <Select value={fieldFilter} onValueChange={setFieldFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">Artificial Intelligence</SelectItem>
                    <SelectItem value="cs">Computer Science</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supervisors.map((supervisor) => (
            <Card key={supervisor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-3 rounded-full mr-3">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{supervisor.name}</h3>
                      <p className="text-purple-600 text-sm">{supervisor.university}</p>
                    </div>
                  </div>
                  <Badge 
                    className={supervisor.accepting ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  >
                    {supervisor.accepting ? 'Accepting' : 'Not Accepting'}
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Research Interests:</h4>
                  <div className="flex flex-wrap gap-2">
                    {supervisor.interests.map((interest, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <Mail className="h-4 w-4 mr-2" />
                  {supervisor.email}
                </div>
                
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!supervisor.accepting}
                >
                  Request Introduction
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupervisorDiscovery;
