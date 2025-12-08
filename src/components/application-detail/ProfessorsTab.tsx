'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  GraduationCap,
  Mail,
  Linkedin,
  BookOpen,
  FlaskConical,
  Search,
  ExternalLink,
  Award,
  Building,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Application } from '@/types/application';

interface ProfessorsTabProps {
  application: Application;
}

interface Professor {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  linkedinUrl?: string;
  scholarUrl?: string;
  researchInterests: string[];
  recentPublications: string[];
  labs: string[];
  matchScore: number;
  acceptingStudents: boolean;
  fundingAvailable: boolean;
}

export default function ProfessorsTab({ application }: ProfessorsTabProps) {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProfessors();
  }, [application.id]);

  const loadProfessors = async () => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setProfessors([
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          title: 'Associate Professor',
          department: 'Computer Science',
          email: 's.johnson@university.edu',
          linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
          scholarUrl: 'https://scholar.google.com/citations?user=xxx',
          researchInterests: ['Machine Learning', 'Computer Vision', 'Deep Learning'],
          recentPublications: [
            'Deep Learning for Image Recognition (2024)',
            'Advances in Neural Networks (2023)',
          ],
          labs: ['AI Research Lab', 'Vision Systems Lab'],
          matchScore: 92,
          acceptingStudents: true,
          fundingAvailable: true,
        },
        {
          id: '2',
          name: 'Prof. Michael Chen',
          title: 'Professor',
          department: 'Computer Science',
          email: 'm.chen@university.edu',
          linkedinUrl: 'https://linkedin.com/in/michaelchen',
          scholarUrl: 'https://scholar.google.com/citations?user=yyy',
          researchInterests: ['Natural Language Processing', 'AI Ethics', 'Robotics'],
          recentPublications: [
            'Ethical AI Systems (2024)',
            'NLP in Healthcare (2023)',
          ],
          labs: ['NLP Lab', 'Ethics in AI Lab'],
          matchScore: 85,
          acceptingStudents: true,
          fundingAvailable: false,
        },
        {
          id: '3',
          name: 'Dr. Emily Rodriguez',
          title: 'Assistant Professor',
          department: 'Computer Science',
          email: 'e.rodriguez@university.edu',
          linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
          scholarUrl: 'https://scholar.google.com/citations?user=zzz',
          researchInterests: ['Data Science', 'Big Data', 'Cloud Computing'],
          recentPublications: [
            'Scalable Data Processing (2024)',
            'Cloud-Native Applications (2023)',
          ],
          labs: ['Data Science Lab'],
          matchScore: 78,
          acceptingStudents: false,
          fundingAvailable: true,
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  const filteredProfessors = professors.filter((prof) =>
    prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.researchInterests.some(interest => interest.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getMatchScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading professors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span>Professor Matching</span>
          </CardTitle>
          <CardDescription>
            Professors at {application.universityName} matched to your research interests and profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or research interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{filteredProfessors.length} Professors</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Professor Cards */}
      <div className="grid grid-cols-1 gap-6">
        {filteredProfessors.map((professor) => (
          <Card key={professor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{professor.name}</h3>
                    <Badge className={getMatchScoreColor(professor.matchScore)}>
                      {professor.matchScore}% Match
                    </Badge>
                  </div>
                  <p className="text-gray-600">{professor.title} • {professor.department}</p>
                </div>
                <div className="flex space-x-2">
                  {professor.acceptingStudents && (
                    <Badge className="bg-green-100 text-green-800">
                      Accepting Students
                    </Badge>
                  )}
                  {professor.fundingAvailable && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Funding Available
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex items-center space-x-4 mb-4 text-sm">
                <a
                  href={`mailto:${professor.email}`}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </a>
                {professor.linkedinUrl && (
                  <a
                    href={professor.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {professor.scholarUrl && (
                  <a
                    href={professor.scholarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Google Scholar</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Research Interests */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Research Interests</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {professor.researchInterests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Labs */}
              {professor.labs.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FlaskConical className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Associated Labs</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {professor.labs.map((lab, index) => (
                      <Badge key={index} variant="outline" className="bg-purple-50">
                        {lab}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Publications */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Recent Publications</span>
                </div>
                <ul className="space-y-1">
                  {professor.recentPublications.map((pub, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{pub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Professor
                </Button>
                <Button size="sm" variant="outline">
                  View Full Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfessors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No professors found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
