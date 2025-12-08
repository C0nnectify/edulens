
import React from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

interface EligibilityWizardWelcomeProps {
  onStart: () => void;
}

const EligibilityWizardWelcome: React.FC<EligibilityWizardWelcomeProps> = ({ onStart }) => (
  <div className="text-center py-8">
    <p className="text-lg font-bold mb-2 text-emerald-900">Check your eligibility in 3 easy steps!</p>
    <p className="text-gray-600 mb-5">
      Answer a few short questions to see which scholarships you might be eligible for.
    </p>
    <Button className="mt-4" onClick={onStart}>
      Start
    </Button>
  </div>
);

export default EligibilityWizardWelcome;
