import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, Award, Star, StarOff } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Scholarship } from "./ScholarshipList";
import TrackScholarshipButton from "./TrackScholarshipButton";
import { useApplicationTracker } from "@/hooks/useApplicationTracker";

const colors = [
  "bg-blue-50 border-blue-200",
  "bg-emerald-50 border-emerald-200",
  "bg-yellow-50 border-yellow-200",
  "bg-purple-50 border-purple-200",
  "bg-pink-50 border-pink-200",
];

type Props = {
  scholarships: Scholarship[];
  savedIds?: string[];
  onToggleSave?: (id: string) => void;
};

const ScholarshipCardGrid: React.FC<Props> = ({
  scholarships,
  savedIds = [],
  onToggleSave,
}) => {
  // Add tracker functionality
  const tracker = useApplicationTracker(scholarships);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {scholarships.map((s, i) => {
          const saved = savedIds.includes(s.id);
          const tracked = tracker.isTracked(s.id);
          return (
            <div
              key={s.id}
              id={`scholarship-card-${s.id}`}
              className={`group rounded-xl p-6 border shadow hover:shadow-lg hover:scale-105 transition-all relative animate-fade-in ${colors[i % colors.length]} ${
                saved ? "border-emerald-400/70 bg-emerald-50/80 shadow-emerald-100" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg text-emerald-900">
                  {s.name}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge>{s.level}</Badge>
                  {onToggleSave && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label={saved ? "Unsave Scholarship" : "Save Scholarship"}
                            onClick={() => onToggleSave(s.id)}
                            className={`p-1.5 rounded-full border-none outline-none transition ${
                              saved ? "bg-emerald-100 text-emerald-600" : "hover:bg-emerald-50 text-gray-500"
                            }`}
                          >
                            {saved ? (
                              <Star className="w-5 h-5 fill-emerald-400 text-emerald-600" />
                            ) : (
                              <StarOff className="w-5 h-5" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {saved ? "Remove from saved scholarships" : "Save this scholarship"}
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  {/* Track button */}
                  <TrackScholarshipButton
                    tracked={tracked}
                    onTrack={() => tracker.addTrack(s.id)}
                    onUntrack={() => tracker.removeTrack(s.id)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-emerald-700">
                  ${s.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                Deadline:{" "}
                <span>
                  {new Date(s.deadline).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-blue-700 font-medium mt-2">
                Country: {s.country}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default ScholarshipCardGrid;
