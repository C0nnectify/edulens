
import { useState, useEffect, useCallback } from "react";
import { Scholarship } from "@/components/ScholarshipList";

export type ApplicationStatus =
  | "Not Started"
  | "In Progress"
  | "Submitted"
  | "Interview"
  | "Rejected"
  | "Accepted";

export interface TrackedScholarship {
  id: string;
  status: ApplicationStatus;
  notes: string;
}

const STORAGE_KEY = "trackedScholarshipsV1";

export function useApplicationTracker(scholarships: Scholarship[]) {
  const [tracked, setTracked] = useState<TrackedScholarship[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          setTracked(JSON.parse(raw));
        } catch {
          setTracked([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracked));
    }
  }, [tracked]);

  const isTracked = (id: string) => tracked.some((s) => s.id === id);

  const addTrack = useCallback((id: string) => {
    setTracked((prev) =>
      prev.some((t) => t.id === id)
        ? prev
        : [{ id, status: "Not Started", notes: "" }, ...prev]
    );
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracked((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: ApplicationStatus) => {
    setTracked((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setTracked((prev) =>
      prev.map((t) => (t.id === id ? { ...t, notes } : t))
    );
  }, []);

  // Get detailed info
  const trackedDetails = scholarships
    .filter((sch) => isTracked(sch.id))
    .map((sch) => ({
      ...sch,
      ...tracked.find((t) => t.id === sch.id),
    }));

  return {
    tracked, // raw
    trackedDetails, // full schol details + status/notes
    isTracked,
    addTrack,
    removeTrack,
    updateStatus,
    updateNotes,
  };
}
