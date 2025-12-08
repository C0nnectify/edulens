
import React, { useState } from "react";
import { useApplicationTracker } from "@/hooks/useApplicationTracker";
import { Scholarship } from "./ScholarshipList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, NotebookPen, Trash2, ClipboardList } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Interview",
  "Rejected",
  "Accepted",
] as const;

type TrackerScholarship = Scholarship & {
  status: string;
  notes: string;
};

const DEMO_SCHOLARSHIPS: Scholarship[] = [
  {
    id: "1",
    name: "Fulbright Foreign Student Program",
    country: "USA",
    level: "Masters",
    amount: 20000,
    deadline: "2025-02-28",
  },
  {
    id: "2",
    name: "Chevening Scholarships",
    country: "UK",
    level: "Masters",
    amount: 18000,
    deadline: "2024-11-01",
  },
  {
    id: "3",
    name: "DAAD Scholarships",
    country: "Germany",
    level: "PhD",
    amount: 15000,
    deadline: "2024-10-15",
  },
  {
    id: "4",
    name: "Australian Awards",
    country: "Australia",
    level: "Masters",
    amount: 22000,
    deadline: "2024-12-04",
  },
  {
    id: "5",
    name: "Vanier Canada Graduate Scholarships",
    country: "Canada",
    level: "PhD",
    amount: 50000,
    deadline: "2024-09-30",
  },
];

const ApplicationTracker: React.FC = () => {
  // Get scholarships from demo (in production, accept props or context!)
  const tracker = useApplicationTracker(DEMO_SCHOLARSHIPS);

  const [editNotesFor, setEditNotesFor] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState("");

  const handleEditNotes = (id: string, notes: string) => {
    setEditNotesFor(id);
    setEditNotesValue(notes ?? "");
  };
  const handleNotesSave = (id: string) => {
    tracker.updateNotes(id, editNotesValue);
    setEditNotesFor(null);
    toast({
      title: "Notes updated",
      description: "Your notes have been saved.",
      variant: "default",
    });
  };

  if (tracker.trackedDetails.length === 0) {
    return (
      <div className="bg-white border border-emerald-100 rounded-xl shadow p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="w-6 h-6 text-blue-500" />
          <h2 className="font-bold text-xl text-blue-900 flex items-center gap-2">
            Application Tracker{" "}
            <Badge className="bg-blue-50 text-blue-700">New</Badge>
          </h2>
        </div>
        <p className="text-gray-600 mb-4 max-w-xl">
          Track scholarships you&apos;ve applied for, set reminders, and never miss a deadline.
        </p>
        <div className="border border-dashed rounded-lg p-6 text-center text-gray-400 bg-gray-50 my-4">
          <CalendarCheck className="mx-auto mb-3 w-8 h-8 text-gray-300" />
          You don&apos;t have any scholarships in your tracker yet.<br />
          <span className="text-sm text-gray-500">Use the “Track” button on scholarships to add them here!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-emerald-100 rounded-xl shadow p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <ClipboardList className="w-6 h-6 text-blue-500" />
        <h2 className="font-bold text-xl text-blue-900 flex items-center gap-2">
          Application Tracker{" "}
          <Badge className="bg-blue-50 text-blue-700">New</Badge>
        </h2>
      </div>
      <p className="text-gray-600 mb-4 max-w-xl">
        View and update your tracked scholarships, notes, and keep your progress organized.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-t text-sm">
          <thead>
            <tr>
              <th className="py-2 px-2 text-left font-semibold text-blue-900">Scholarship</th>
              <th className="py-2 px-2 text-left">Country</th>
              <th className="py-2 px-2 text-left">Level</th>
              <th className="py-2 px-2 text-center">Deadline</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Notes</th>
              <th className="py-2 px-2 text-center">Remove</th>
            </tr>
          </thead>
          <tbody>
            {tracker.trackedDetails.map((s) => (
              <tr key={s.id} className="border-b last:border-none hover:bg-blue-50/30 transition">
                <td className="py-2 px-2 font-semibold text-blue-900">{s.name}</td>
                <td className="py-2 px-2">{s.country}</td>
                <td className="py-2 px-2"><Badge>{s.level}</Badge></td>
                <td className="py-2 px-2 text-center">
                  {new Date(s.deadline).toLocaleDateString()}
                </td>
                {/* Status select */}
                <td className="py-2 px-2 text-center">
                  <select
                    className="bg-white border border-blue-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200 transition"
                    value={s.status}
                    onChange={(e) =>
                      tracker.updateStatus(s.id, e.target.value as import("@/hooks/useApplicationTracker").ApplicationStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                {/* Notes */}
                <td className="py-2 px-2 text-center max-w-xs">
                  {editNotesFor === s.id ? (
                    <div className="flex flex-col items-stretch gap-1">
                      <textarea
                        className="border rounded p-1 text-sm ring-blue-200 focus:ring-2"
                        rows={2}
                        value={editNotesValue}
                        onChange={(e) => setEditNotesValue(e.target.value)}
                        placeholder="Your notes"
                      />
                      <div className="flex gap-1">
                        <Button variant="default" size="sm" onClick={() => handleNotesSave(s.id)}>
                          Save
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditNotesFor(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="truncate max-w-[120px]" title={s.notes}>{s.notes || <span className="text-gray-400">No notes</span>}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit notes"
                        onClick={() => handleEditNotes(s.id, s.notes)}
                      >
                        <NotebookPen className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </td>
                {/* Remove */}
                <td className="py-2 px-2 text-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label="Remove tracked scholarship"
                    onClick={() => {
                      tracker.removeTrack(s.id);
                      toast({
                        title: "Removed",
                        description: `Scholarship removed from Tracker.`,
                        variant: "destructive",
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationTracker;
