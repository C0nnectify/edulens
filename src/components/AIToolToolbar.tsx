
import { Button } from "@/components/ui/button";
import { List, Search } from "lucide-react";
import AIToolCategoryPills from "./AIToolCategoryPills";
import { Input } from "@/components/ui/input";

interface Props {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  view: 'grid' | 'list';
  setView: (view: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toolsToShowLen: number;
  toolsLen: number;
}

const AIToolToolbar = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  view,
  setView,
  searchQuery,
  setSearchQuery,
  toolsToShowLen,
  toolsLen,
}: Props) => (
  <>
    <div className="z-30 sticky top-16 bg-white pt-1 pb-3 -mx-4 px-4 mb-6 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      <div className="flex-1">
        <AIToolCategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>
      <div className="flex-shrink-0 flex justify-end">
        <Button
          variant={view === "list" ? "secondary" : "outline"}
          onClick={() => setView(view === "grid" ? "list" : "grid")}
          size="sm"
          className="rounded-full px-4 py-2 flex gap-2 items-center"
          aria-label={view === "grid" ? "Switch to list view" : "Switch to grid view"}
        >
          <List className="h-5 w-5" />
          {view === "grid" ? "List View" : "Grid View"}
        </Button>
      </div>
    </div>
    <div className="max-w-xl mx-auto mb-12 relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      <Input
        type="text"
        placeholder="Search tools by name, keyword..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-12 pr-4 py-3 text-base rounded-full border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
        aria-label="Search AI tools"
      />
    </div>
    <div className="text-sm text-gray-500 mb-4 animate-fade-in text-center">
      Showing {toolsToShowLen} of {toolsLen} AI tools
    </div>
  </>
);

export default AIToolToolbar;
