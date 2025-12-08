
import React from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ScholarshipAlerts: React.FC = () => {
  return (
    <div className="bg-white border border-emerald-100 rounded-xl shadow p-6 mb-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Bell className="w-6 h-6 text-emerald-500" />
        <h2 className="font-bold text-xl text-emerald-800 flex items-center gap-2">
          Scholarship Alerts <Badge className="bg-emerald-50 text-emerald-700">Beta</Badge>
        </h2>
      </div>
      <p className="text-gray-600 mb-4 max-w-xl">
        Get notified when new scholarships that match your interests become available!
      </p>
      <Button variant="default" className="flex items-center gap-1">
        <Bell className="w-4 h-4 mr-1" /> Enable Alerts
      </Button>
    </div>
  );
};

export default ScholarshipAlerts;
