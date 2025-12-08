
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

const AdmissionRequirements = () => {
  const requirements = [
    {
      country: "United Kingdom",
      minDegree: "Master's",
      languageTest: "IELTS 6.5+",
      proposalNeeded: true,
      supervisorContact: "Before Applying",
      applicationFee: true,
      fee: "£50-100"
    },
    {
      country: "Germany",
      minDegree: "Master's",
      languageTest: "IELTS 6.0+ or German C1",
      proposalNeeded: true,
      supervisorContact: "Before Applying",
      applicationFee: false,
      fee: "Free"
    },
    {
      country: "United States",
      minDegree: "Bachelor's",
      languageTest: "TOEFL 100+",
      proposalNeeded: false,
      supervisorContact: "After Admission",
      applicationFee: true,
      fee: "$50-150"
    },
    {
      country: "Canada",
      minDegree: "Master's",
      languageTest: "IELTS 7.0+",
      proposalNeeded: true,
      supervisorContact: "Before Applying",
      applicationFee: true,
      fee: "CAD $100-200"
    },
    {
      country: "Australia",
      minDegree: "Master's",
      languageTest: "IELTS 6.5+",
      proposalNeeded: true,
      supervisorContact: "Before Applying",
      applicationFee: true,
      fee: "AUD $100-150"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Admission Requirements by Country</h2>
          <p className="text-lg text-gray-600">Compare requirements across top PhD destinations</p>
        </div>
        
        <Card className="shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-center text-xl">PhD Admission Requirements Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Country</TableHead>
                    <TableHead className="font-semibold">Min Degree</TableHead>
                    <TableHead className="font-semibold">Language Test</TableHead>
                    <TableHead className="font-semibold">Proposal Needed</TableHead>
                    <TableHead className="font-semibold">Supervisor Contact</TableHead>
                    <TableHead className="font-semibold">Application Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((req, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <Badge className="bg-purple-100 text-purple-800">
                          {req.country}
                        </Badge>
                      </TableCell>
                      <TableCell>{req.minDegree}</TableCell>
                      <TableCell>{req.languageTest}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {req.proposalNeeded ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          {req.proposalNeeded ? 'Required' : 'Not Required'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={req.supervisorContact === 'Before Applying' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {req.supervisorContact}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {req.applicationFee ? (
                            <span className="text-red-600 font-medium">{req.fee}</span>
                          ) : (
                            <span className="text-green-600 font-medium">{req.fee}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Requirements may vary by university and program. Always check specific institutional requirements.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdmissionRequirements;
