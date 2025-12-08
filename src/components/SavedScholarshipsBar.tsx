
import React from "react";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Scholarship } from "./ScholarshipList";

type Props = {
  scholarships: Scholarship[];
  onShow: (id: string) => void;
  onRemove: (id: string) => void;
};

const SavedScholarshipsBar: React.FC<Props> = ({ scholarships, onShow, onRemove }) => {
  return (
    <TooltipProvider>
      <div className="bg-white/90 border border-emerald-200 rounded-lg shadow mb-4 px-4 py-2 flex items-center gap-2 animate-fade-in">
        <Star className="w-5 h-5 text-emerald-500 mr-1" />
        <span className="font-semibold text-emerald-800 text-sm">Saved Scholarships:</span>
        <div className="flex flex-wrap gap-1.5">
          {scholarships.map((s) => (
            <div key={s.id} className="flex items-center gap-1 rounded px-2 py-1 bg-emerald-50 border border-emerald-100 hover:shadow cursor-pointer transition group">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span onClick={() => onShow(s.id)} className="inline-flex items-center gap-1 text-emerald-900 font-medium text-sm">
                    {s.name}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Scroll to scholarship</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button aria-label="Remove from saved" className="ml-1 p-0.5 text-gray-400 hover:text-emerald-600" onClick={() => onRemove(s.id)}>
                    <X className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SavedScholarshipsBar;

