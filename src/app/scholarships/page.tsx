"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import ScholarshipSearchBar from "@/components/ScholarshipSearchBar";
import ScholarshipList from "@/components/ScholarshipList";
import ScholarshipCardGrid from "@/components/ScholarshipCardGrid";
import { Scholarship } from "@/components/ScholarshipList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, StarOff, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import ScholarshipAlerts from "@/components/ScholarshipAlerts";
import ApplicationTracker from "@/components/ApplicationTracker";
import { toast } from "@/hooks/use-toast";
import SavedScholarshipsBar from "@/components/SavedScholarshipsBar";
import EligibilityWizardModal from "@/components/EligibilityWizard";
import { useState as useWizardState } from "react";

// Demo data (would be fetched from backend in prod)
const scholarships: Scholarship[] = [
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

const STORAGE_KEY = "savedScholarshipsV2";

export default function ScholarshipFinderPage() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState("");
  const [view, setView] = useState<"card" | "list">("card");
  const router = useRouter();
  const [eligibilityWizardOpen, setEligibilityWizardOpen] = useWizardState(false);

  // Saved scholarships state (ids only)
  const [saved, setSaved] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  });

  // Persist saved scholarships in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
  }, [saved]);

  const filtered = useMemo(() => {
    return scholarships.filter(
      (s) =>
        (!search || s.name.toLowerCase().includes(search.toLowerCase())) &&
        (!country || s.country === country) &&
        (!level || s.level === level)
    );
  }, [search, country, level]);

  const handleReset = () => {
    setSearch("");
    setCountry("");
    setLevel("");
  };

  const handleSave = useCallback((id: string) => {
    setSaved((prev) => {
      if (prev.includes(id)) {
        toast({
          title: "Removed from saved",
          description: "Scholarship removed from your saved list",
        });
        return prev.filter((s) => s !== id);
      } else {
        toast({
          title: "Added to saved",
          description: "Scholarship added to your saved list",
        });
        return [...prev, id];
      }
    });
  }, []);

  const savedScholarships = scholarships.filter((s) => saved.includes(s.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50">
      <div className="pt-20">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Scholarship Finder
                </h1>
                <p className="text-gray-600">
                  Discover scholarships that match your profile
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEligibilityWizardOpen(true)}
                className="flex items-center"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Eligibility Wizard
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <ScholarshipSearchBar
            search={search}
            setSearch={setSearch}
            country={country}
            setCountry={setCountry}
            level={level}
            setLevel={setLevel}
            onReset={handleReset}
          />

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Button
                variant={view === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("card")}
              >
                <Star className="w-4 h-4 mr-2" />
                Card View
              </Button>
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("list")}
              >
                <StarOff className="w-4 h-4 mr-2" />
                List View
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {filtered.length} scholarships found
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {view === "card" ? (
                <ScholarshipCardGrid
                  scholarships={filtered}
                  saved={saved}
                  onSave={handleSave}
                />
              ) : (
                <ScholarshipList
                  scholarships={filtered}
                  saved={saved}
                  onSave={handleSave}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <SavedScholarshipsBar
                scholarships={savedScholarships}
                onRemove={(id) => handleSave(id)}
              />
              <ScholarshipAlerts />
              <ApplicationTracker />
            </div>
          </div>
        </div>
      </div>

      {/* Eligibility Wizard Modal */}
      <EligibilityWizardModal
        isOpen={eligibilityWizardOpen}
        onClose={() => setEligibilityWizardOpen(false)}
      />
    </div>
  );
} 