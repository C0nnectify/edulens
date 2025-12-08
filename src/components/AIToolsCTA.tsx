
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AIToolsStats from "./AIToolsStats";

const AIToolsCTA = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 max-w-6xl mx-auto shadow-lg border border-emerald-100 relative">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
        Why Choose Our Complete AI Toolkit?
      </h3>
      <div className="text-emerald-700 text-md md:text-lg font-semibold mb-6">
        Everything you need for your study abroad – all in one intelligent, personalized suite.
      </div>
      <AIToolsStats />
      <p className="text-gray-600 mb-6 max-w-4xl mx-auto">
        Each tool provides a complete, workable journey from start to finish with AI assistance, expert guidance, and personalized recommendations at every step of your study abroad process.
      </p>
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-2">
        <Button 
          size="lg"
          onClick={() => navigate('/ai-agents')}
          className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
        >
          Explore AI Agents
        </Button>
        <Button 
          size="lg"
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="border-emerald-300 text-emerald-700 font-semibold bg-white hover:bg-emerald-50"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AIToolsCTA;

