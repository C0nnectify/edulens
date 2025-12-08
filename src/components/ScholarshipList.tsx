import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, StarOff } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import TrackScholarshipButton from "./TrackScholarshipButton";
import { useApplicationTracker } from "@/hooks/useApplicationTracker";

export type Scholarship = {
  id: string;
  name: string;
  country: string;
  level: string;
  amount: number;
  deadline: string; // ISO string
};

type Props = {
  scholarships: Scholarship[];
  savedIds?: string[];
  onToggleSave?: (id: string) => void;
};

const ScholarshipList: React.FC<Props> = ({
  scholarships,
  savedIds = [],
  onToggleSave,
}) => {
  const tracker = useApplicationTracker(scholarships);
  return (
    <TooltipProvider>
      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-emerald-50">
            <tr>
              <th className="py-3 px-4 text-left font-bold text-emerald-800">Scholarship</th>
              <th className="py-3 px-4 text-left font-bold text-emerald-800">Country</th>
              <th className="py-3 px-4 text-left font-bold text-emerald-800">Level</th>
              <th className="py-3 px-4 text-left font-bold text-emerald-800">Amount</th>
              <th className="py-3 px-4 text-left font-bold text-emerald-800">Deadline</th>
              {onToggleSave && (
                <th className="py-3 px-4 text-center font-bold text-emerald-800">Save</th>
              )}
              <th className="py-3 px-4 text-center font-bold text-blue-900">Track</th>
            </tr>
          </thead>
          <tbody>
            {scholarships.map((s) => {
              const saved = savedIds.includes(s.id);
              const tracked = tracker.isTracked(s.id);
              return (
                <tr key={s.id} id={`scholarship-row-${s.id}`} className={`hover:bg-emerald-50 transition ${saved ? "bg-emerald-50/60" : ""}`}>
                  <td className="py-3 px-4 font-semibold">{s.name}</td>
                  <td className="py-3 px-4">{s.country}</td>
                  <td className="py-3 px-4">
                    <Badge>{s.level}</Badge>
                  </td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">${s.amount.toLocaleString()}</td>
                  <td className="py-3 px-4">{new Date(s.deadline).toLocaleDateString()}</td>
                  {onToggleSave && (
                    <td className="py-3 px-4 text-center">
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
                    </td>
                  )}
                  {/* Track column (always present) */}
                  <td className="py-3 px-4 text-center">
                    <TrackScholarshipButton
                      tracked={tracked}
                      onTrack={() => tracker.addTrack(s.id)}
                      onUntrack={() => tracker.removeTrack(s.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
};

export default ScholarshipList;
