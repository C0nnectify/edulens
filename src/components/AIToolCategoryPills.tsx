
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AIToolCategoryPillsProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

const AIToolCategoryPills = ({
  categories,
  selectedCategory,
  setSelectedCategory
}: AIToolCategoryPillsProps) => {
  return (
    // Add sticky positioning via wrapper here as a fallback for other usages
    <div className="flex flex-wrap justify-center gap-2 mb-4 md:mb-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium border transition 
              ${selectedCategory === 'All'
                ? 'bg-gradient-to-r from-emerald-200 to-blue-200 text-emerald-900 border-emerald-200'
                : 'bg-gradient-to-r from-emerald-100 to-blue-100 text-gray-700 border-transparent hover:bg-emerald-50'
              }`}
            onClick={() => setSelectedCategory('All')}
          >
            Show All
          </button>
        </TooltipTrigger>
        <TooltipContent>
          Show all tools
        </TooltipContent>
      </Tooltip>
      {categories.map((category) => (
        <Tooltip key={category}>
          <TooltipTrigger asChild>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium border transition 
                ${selectedCategory === category
                  ? 'bg-gradient-to-r from-emerald-200 to-blue-200 text-emerald-900 border-emerald-200'
                  : 'bg-gradient-to-r from-emerald-100 to-blue-100 text-gray-700 border-transparent hover:bg-emerald-50'
                }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Show only {category} tools
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

export default AIToolCategoryPills;

