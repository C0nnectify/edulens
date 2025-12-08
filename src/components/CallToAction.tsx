
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

const CallToAction = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to Start Your Journey?
          </h2>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Join thousands of students who&apos;ve transformed their study abroad dreams into reality with EduLens
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-xl px-10 py-5 rounded-2xl shadow-2xl hover:shadow-3xl transition-all font-semibold"
            >
              Start Your Journey
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-xl px-10 py-5 rounded-2xl transition-all font-semibold"
            >
              <Play className="mr-3 h-6 w-6" />
              Watch Demo
            </Button>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">Free Trial</div>
              <div className="opacity-90">Start with our free plan and explore all features</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">No Hidden Fees</div>
              <div className="opacity-90">Transparent pricing with no surprise charges</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">Money Back</div>
              <div className="opacity-90">30-day money-back guarantee if not satisfied</div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">10,000+</div>
                <div className="text-sm opacity-90">Students Helped</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">95%</div>
                <div className="text-sm opacity-90">Success Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">$5M+</div>
                <div className="text-sm opacity-90">Scholarships Won</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">4.9/5</div>
                <div className="text-sm opacity-90">Student Rating</div>
              </div>
            </div>
          </div>

          {/* Urgency */}
          <div className="mt-12">
            <p className="text-lg opacity-90 mb-4">
              🎓 Spring 2025 applications are opening soon!
            </p>
            <p className="text-sm opacity-75">
              Don&apos;t miss early bird scholarships and priority deadlines
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
