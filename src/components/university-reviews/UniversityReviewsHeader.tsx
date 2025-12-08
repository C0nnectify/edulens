
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React from "react";

type Props = {
  title?: string;
  onBack?: () => void;
};
export default function UniversityReviewsHeader({
  title = "University Reviews",
  onBack,
}: Props) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 mb-4">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={onBack || (() => navigate("/"))}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Back</span>
      </Button>
      <h1 className="text-3xl font-bold text-emerald-800 tracking-tight flex-1">
        {title}
      </h1>
    </div>
  );
}
