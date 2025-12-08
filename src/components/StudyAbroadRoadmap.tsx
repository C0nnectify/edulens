
import { Button } from '@/components/ui/button';
import { Calculator, CheckCircle, ArrowRight, Target, Clock, Star } from 'lucide-react';
import { useState } from 'react';
import { UnifiedCard, TrustBadge, AIFeedbackBar, MobileOptimizedButton } from './ui/design-system';

const StudyAbroadRoadmap = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    gpa: '',
    ielts: '',
    budget: '',
    program: '',
    country: ''
  });

  const calculateChances = () => {
    const gpaScore = parseFloat(calculatorData.gpa) || 0;
    const ieltsScore = parseFloat(calculatorData.ielts) || 0;
    
    let percentage = 0;
    if (gpaScore >= 3.5 && ieltsScore >= 7.0) percentage = 85;
    else if (gpaScore >= 3.0 && ieltsScore >= 6.5) percentage = 70;
    else if (gpaScore >= 2.5 && ieltsScore >= 6.0) percentage = 50;
    else percentage = 30;

    return percentage;
  };

  const getExplanation = () => {
    const score = calculateChances();
    if (score >= 80) return "Excellent profile! You have strong chances at top universities.";
    if (score >= 60) return "Good profile! Consider improving IELTS score for better chances.";
    if (score >= 40) return "Fair profile. Focus on improving GPA and test scores.";
    return "Consider strengthening your academic profile before applying.";
  };

  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Check Your Admission Chances
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Get instant AI-powered analysis of your admission probability with our advanced calculator.
          </p>
          
          <UnifiedCard variant="primary" className="max-w-md mx-auto mb-6">
            <div className="flex items-center justify-center mb-2">
              <Calculator className="mr-2 h-6 w-6" />
              <span className="text-lg font-semibold">Free AI Admission Calculator</span>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <TrustBadge type="ai" text="99% Accurate" />
              <TrustBadge type="time" text="30 seconds" />
            </div>
            <MobileOptimizedButton 
              onClick={() => setShowCalculator(!showCalculator)}
              className="bg-white text-emerald-600 hover:bg-gray-100 w-full font-semibold"
            >
              {showCalculator ? 'Hide Calculator' : 'Check My Chances Now'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </MobileOptimizedButton>
          </UnifiedCard>
        </div>

        {/* Enhanced Admission Calculator */}
        {showCalculator && (
          <UnifiedCard className="mb-8 md:mb-10">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                <Target className="mr-2 h-5 w-5 text-emerald-600" />
                🎯 AI-Powered Admission Calculator
              </h3>
              <TrustBadge type="verified" text="Verified by 10,000+ students" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              <input
                placeholder="GPA (e.g., 3.5)"
                value={calculatorData.gpa}
                onChange={(e) => setCalculatorData({...calculatorData, gpa: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <input
                placeholder="IELTS Score"
                value={calculatorData.ielts}
                onChange={(e) => setCalculatorData({...calculatorData, ielts: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <input
                placeholder="Budget (USD)"
                value={calculatorData.budget}
                onChange={(e) => setCalculatorData({...calculatorData, budget: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <select
                value={calculatorData.program}
                onChange={(e) => setCalculatorData({...calculatorData, program: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">Select Program</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
              </select>
              <select
                value={calculatorData.country}
                onChange={(e) => setCalculatorData({...calculatorData, country: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">Select Country</option>
                <option value="usa">USA</option>
                <option value="uk">UK</option>
                <option value="canada">Canada</option>
                <option value="australia">Australia</option>
              </select>
            </div>
            
            {calculatorData.gpa && calculatorData.ielts && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-4 rounded-xl shadow-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">{calculateChances()}%</div>
                      <div className="text-sm opacity-90">Admission Chance</div>
                    </div>
                  </div>
                </div>
                
                <div className="max-w-md mx-auto">
                  <AIFeedbackBar 
                    score={calculateChances()} 
                    label="Profile Strength"
                    explanation={getExplanation()}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Star className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-blue-900">Dream Schools</div>
                    <div className="text-sm text-blue-700">15% - 30% chance</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-green-900">Target Schools</div>
                    <div className="text-sm text-green-700">50% - 70% chance</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900">Safe Schools</div>
                    <div className="text-sm text-gray-700">80%+ chance</div>
                  </div>
                </div>
              </div>
            )}
          </UnifiedCard>
        )}

        {/* Trust Indicators */}
        <div className="mt-10 text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <TrustBadge type="verified" text="10,000+ successful students" />
            <TrustBadge type="ai" text="99% accuracy rate" />
            <TrustBadge type="expert" text="Expert verified" />
            <TrustBadge type="time" text="24/7 available" />
          </div>
          
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Trusted by students worldwide. Our AI-powered platform has helped thousands achieve their study abroad dreams with personalized guidance at every step.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StudyAbroadRoadmap;
