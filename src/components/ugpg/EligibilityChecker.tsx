
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle } from 'lucide-react';

const EligibilityChecker = () => {
  const [formData, setFormData] = useState({
    education: '',
    gpa: '',
    englishScore: '',
    preferredCountry: ''
  });
  const [result, setResult] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const checkEligibility = () => {
    // Convert string values to numbers for comparison
    const gpaValue = parseFloat(formData.gpa);
    const englishScoreValue = parseFloat(formData.englishScore);
    
    // Simple eligibility logic
    const eligible = gpaValue >= 3.0 && englishScoreValue >= 6.0;
    setResult({
      eligible,
      recommendations: eligible 
        ? ['Harvard University', 'Stanford University', 'MIT']
        : ['Consider English prep courses', 'Improve academic performance', 'Look into foundation programs']
    });
  };

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Check Your Eligibility</h2>
          <p className="text-lg text-gray-600">Find out what programs and countries you qualify for</p>
        </div>
        
        <Card className="bg-white shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Eligibility Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="education">Education Background</Label>
                <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-school">High School Graduate</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="gpa">GPA / Percentage</Label>
                <Input
                  id="gpa"
                  type="number"
                  placeholder="e.g., 3.5 or 85%"
                  value={formData.gpa}
                  onChange={(e) => handleInputChange('gpa', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="englishScore">English Score (IELTS/TOEFL)</Label>
                <Input
                  id="englishScore"
                  type="number"
                  placeholder="e.g., 7.0 (IELTS) or 100 (TOEFL)"
                  value={formData.englishScore}
                  onChange={(e) => handleInputChange('englishScore', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="preferredCountry">Preferred Country</Label>
                <Select value={formData.preferredCountry} onValueChange={(value) => handleInputChange('preferredCountry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="germany">Germany</SelectItem>
                    <SelectItem value="australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={checkEligibility}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
                disabled={!formData.education || !formData.gpa || !formData.englishScore}
              >
                Check Eligibility
              </Button>
            </div>
            
            {result && (
              <div className={`mt-6 p-6 rounded-lg ${result.eligible ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.eligible ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  )}
                  <h3 className={`text-lg font-semibold ${result.eligible ? 'text-green-800' : 'text-yellow-800'}`}>
                    {result.eligible ? 'Great! You\'re eligible' : 'Needs Improvement'}
                  </h3>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    {result.eligible ? 'Recommended Universities:' : 'Recommendations:'}
                  </h4>
                  <ul className="space-y-1">
                    {result.recommendations.map((item, idx) => (
                      <li key={idx} className="text-sm">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default EligibilityChecker;
