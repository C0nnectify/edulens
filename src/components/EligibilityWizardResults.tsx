
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

interface EligibilityWizardResultsProps {
  result: "eligible" | "partial" | "ineligible" | null;
  onFinish: () => void;
}

const EligibilityWizardResults: React.FC<EligibilityWizardResultsProps> = ({ result, onFinish }) => (
  <div className="text-center py-8">
    {result === "eligible" && (
      <>
        <CheckCircle className="w-12 h-12 mx-auto text-emerald-700 mb-3" />
        <p className="text-lg font-bold text-emerald-900 mb-2">
          Congratulations! <Badge className="bg-emerald-50 text-emerald-800 ml-2">Eligible</Badge>
        </p>
        <p className="mb-4 text-gray-700">
          Based on your answers, you meet the general criteria for highly funded scholarships!
        </p>
      </>
    )}
    {result === "partial" && (
      <>
        <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
        <p className="text-lg font-bold text-yellow-800 mb-2">
          Partially Eligible
        </p>
        <p className="mb-2 text-gray-700">You meet some requirements for select scholarships, but may have limited options.</p>
      </>
    )}
    {result === "ineligible" && (
      <>
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
        <p className="text-lg font-bold text-red-700 mb-2">
          Not Eligible
        </p>
        <p className="mb-2 text-gray-700">Unfortunately, you don&apos;t meet the criteria for most featured scholarships.</p>
      </>
    )}
    <Button className="mt-3" onClick={onFinish}>
      Finish
    </Button>
  </div>
);

export default EligibilityWizardResults;
