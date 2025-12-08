
import React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Props = {
  tracked: boolean;
  onTrack: () => void;
  onUntrack: () => void;
};

const TrackScholarshipButton: React.FC<Props> = ({
  tracked,
  onTrack,
  onUntrack,
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={tracked ? "secondary" : "outline"}
        size="icon"
        aria-label={tracked ? "Untrack Scholarship" : "Track Scholarship"}
        onClick={tracked ? onUntrack : onTrack}
        className={tracked ? "bg-blue-100 text-blue-700" : ""}
        type="button"
      >
        {tracked ? (
          <BookmarkCheck className="w-5 h-5" />
        ) : (
          <Bookmark className="w-5 h-5" />
        )}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {tracked ? "Remove from Application Tracker" : "Add to Application Tracker"}
    </TooltipContent>
  </Tooltip>
);

export default TrackScholarshipButton;
