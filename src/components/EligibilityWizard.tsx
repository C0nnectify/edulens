import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import EligibilityWizardWelcome from "./EligibilityWizardWelcome";
import EligibilityWizardStep from "./EligibilityWizardStep";
import EligibilityWizardResults from "./EligibilityWizardResults";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Step =
  | "welcome"
  | "personal"
  | "education"
  | "finances"
  | "results";

interface Answers {
  citizenship: string;
  education: string;
  gpa: string;
  needFunding: string;
  [key: string]: string; // Add this index signature for compatibility
}

const initialState: Answers = {
  citizenship: "",
  education: "",
  gpa: "",
  needFunding: "",
};

const eligibilityQuestions = [
  {
    step: "personal",
    question: "What is your citizenship?",
    options: [
      "USA",
      "UK",
      "Canada",
      "Australia",
      "Germany",
      "Other",
    ],
    key: "citizenship",
  },
  {
    step: "education",
    question: "Which program are you applying for?",
    options: ["Undergraduate", "Masters", "PhD"],
    key: "education",
  },
  {
    step: "education",
    question: "What is your GPA (or equivalent)?",
    options: ["4.0+", "3.5 - 3.99", "3.0 - 3.49", "< 3.0"],
    key: "gpa",
  },
  {
    step: "finances",
    question: "Do you need full funding?",
    options: ["Yes", "Partial", "No"],
    key: "needFunding",
  },
];

export default function EligibilityWizardModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialState);
  const [result, setResult] = useState<null | "eligible" | "partial" | "ineligible">(null);

  const steps: Step[] = [
    "welcome",
    "personal",
    "education",
    "finances",
    "results",
  ];

  const currentStep = steps[stepIndex];

  const handleNext = () => {
    if (stepIndex === steps.length - 2) {
      // Evaluate eligibility on the last question step
      evaluateEligibility();
      setStepIndex((i) => i + 1);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  function evaluateEligibility() {
    // This logic can be improved, but for demo: need a country, education, and at least GPA >= 3
    if (
      ["USA", "UK", "Canada", "Australia", "Germany"].includes(answers.citizenship) &&
      (answers.education === "Masters" || answers.education === "PhD") &&
      (answers.gpa === "4.0+" || answers.gpa === "3.5 - 3.99" || answers.gpa === "3.0 - 3.49")
    ) {
      setResult("eligible");
    } else if (answers.gpa && answers.education) {
      setResult("partial");
    } else {
      setResult("ineligible");
    }
  }

  const handleRadioChange = (key: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setStepIndex(0);
    setAnswers(initialState);
    setResult(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            <GraduationCap className="inline mr-2 text-emerald-700" />
            Scholarship Eligibility Wizard
          </DialogTitle>
        </DialogHeader>
        <div>
          {currentStep === "welcome" && (
            <EligibilityWizardWelcome onStart={handleNext} />
          )}
          {currentStep !== "welcome" && currentStep !== "results" && (
            <EligibilityWizardStep
              stepIndex={stepIndex}
              totalSteps={steps.length - 2}
              questions={eligibilityQuestions.filter(q => q.step === currentStep)}
              answers={answers}
              onRadioChange={handleRadioChange}
              onBack={handleBack}
              onNext={handleNext}
              backDisabled={stepIndex === 1}
              nextDisabled={
                eligibilityQuestions
                  .filter(q => q.step === currentStep)
                  .some(q => !answers[q.key as keyof Answers])
              }
            />
          )}
          {currentStep === "results" && (
            <EligibilityWizardResults
              result={result}
              onFinish={() => { reset(); setOpen(false); }}
            />
          )}
        </div>
        <DialogFooter>
          <div className="w-full flex justify-center text-xs text-gray-400 mt-2">
            Your answers are private and never saved.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
