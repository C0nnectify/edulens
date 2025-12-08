
import React from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, List, LayoutGrid } from "lucide-react";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  country: string;
  onCountry: (v: string) => void;
  level: string;
  onLevel: (v: string) => void;
  view: "card" | "list";
  onView: (v: "card" | "list") => void;
  onReset: () => void;
}

const countries = ["USA", "UK", "Canada", "Australia", "Germany"];
const levels = ["Undergraduate", "Masters", "PhD"];

const ScholarshipSearchBar: React.FC<Props> = ({
  search, onSearch, country, onCountry, level, onLevel, view, onView, onReset
}) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5 flex flex-col md:flex-row md:items-center gap-4 animate-fade-in">
    {/* Search Input */}
    <div className="flex-1 flex gap-2 items-center">
      <Search className="w-5 h-5 text-emerald-500" />
      <input 
        type="text"
        placeholder="Search scholarships..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-full focus:outline-emerald-600"
      />
    </div>
    {/* Filters */}
    <div className="flex gap-2 items-center">
      <Filter className="w-5 h-5 text-gray-400" />
      <select
        value={country}
        onChange={e => onCountry(e.target.value)}
        className="border rounded px-2 py-1 text-sm focus:outline-emerald-600"
      >
        <option value="">All Countries</option>
        {countries.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        value={level}
        onChange={e => onLevel(e.target.value)}
        className="border rounded px-2 py-1 text-sm focus:outline-emerald-600"
      >
        <option value="">All Levels</option>
        {levels.map(l => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      <Button variant="outline" size="sm" onClick={onReset}>Reset</Button>
    </div>
    {/* View Switcher */}
    <div className="flex gap-2 ml-auto">
      <Button 
        variant={view === "card" ? "default" : "outline"}
        size="icon"
        aria-label="Card view"
        onClick={() => onView("card")}
        className={view === "card" ? "bg-emerald-500 text-white" : ""}
      >
        <LayoutGrid className="w-5 h-5" />
      </Button>
      <Button 
        variant={view === "list" ? "default" : "outline"}
        size="icon"
        aria-label="List view"
        onClick={() => onView("list")}
        className={view === "list" ? "bg-emerald-500 text-white" : ""}
      >
        <List className="w-5 h-5" />
      </Button>
    </div>
  </div>
);

export default ScholarshipSearchBar;

