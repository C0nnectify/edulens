
import React from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Question {
  question: string;
  options: string[];
  key: string;
}

interface Answers {
  [key: string]: string;
}

interface EligibilityWizardStepProps {
  stepIndex: number;
  totalSteps: number;
  questions: Question[];
  answers: Answers;
  onRadioChange: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
}

const EligibilityWizardStep: React.FC<EligibilityWizardStepProps> = ({
  stepIndex,
  totalSteps,
  questions,
  answers,
  onRadioChange,
  onBack,
  onNext,
  backDisabled,
  nextDisabled,
}) => (
  <div>
    <div className="mb-2 text-emerald-700 font-semibold">
      Step {stepIndex} of {totalSteps}
    </div>
    {questions.map((q) => (
      <div key={q.key} className="mb-5">
        <div className="text-base mb-3 font-medium">{q.question}</div>
        <RadioGroup
          value={answers[q.key] || ""}
          onValueChange={v => onRadioChange(q.key, v)}
          className="flex flex-col gap-2"
        >
          {q.options.map(opt => (
            <label 
              key={opt}
              htmlFor={`${q.key}-${opt}`}
              className={`flex items-center cursor-pointer p-2 border rounded-lg gap-3 transition
                ${answers[q.key] === opt
                  ? "border-emerald-500 bg-emerald-50 shadow"
                  : "border-gray-200 hover:border-emerald-300"
                }
              `}
            >
              <RadioGroupItem value={opt} id={`${q.key}-${opt}`} className="mr-2" />
              {opt}
            </label>
          ))}
        </RadioGroup>
      </div>
    ))}
    <div className="flex justify-between mt-6">
      <Button variant="outline" onClick={onBack} disabled={backDisabled}>
        Back
      </Button>
      <Button
        onClick={onNext}
        disabled={nextDisabled}
      >
        Next
      </Button>
    </div>
  </div>
);

export default EligibilityWizardStep;
