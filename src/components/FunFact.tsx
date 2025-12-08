
import React from "react";
import { Sparkles } from "lucide-react";

interface FunFactProps {
  children: React.ReactNode;
  className?: string;
}

const FunFact: React.FC<FunFactProps> = ({ children, className = "" }) => (
  <div
    className={
      "flex items-start gap-2 rounded-lg bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 mt-2 mb-2 shadow animate-fade-in " +
      className
    }
  >
    <span className="pt-0.5">
      <Sparkles className="w-5 h-5 text-yellow-500 animate-bounce" />
    </span>
    <span className="text-sm text-yellow-900 font-semibold">{children}</span>
  </div>
);

export default FunFact;
