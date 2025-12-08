
import { ScrollArea } from "@/components/ui/scroll-area";
import AIToolCard from "./AIToolCard";
import { Tool } from "./AITools";

interface Props {
  groupedByCategory: Record<string, Tool[]>;
  recommendations?: unknown[];
  handleStartTool: (tool: Tool) => void;
  handleCopyJourney: (tool: Tool) => void;
  setQuickPreviewTool: (tool: Tool | null) => void;
  setShowQuickPreview: (open: boolean) => void;
}

const AIToolGroupedGrid = ({
  groupedByCategory,
  recommendations = [],
  handleStartTool,
  handleCopyJourney,
  setQuickPreviewTool,
  setShowQuickPreview,
}: Props) => (
  <ScrollArea className="w-full" style={{ maxHeight: 620, minHeight: 320 }}>
    <div className="flex flex-col gap-8">
      {recommendations.length > 0 && (
        <div>
          <div className="text-xl font-semibold text-blue-700 mb-3">Recommended For You</div>
        </div>
      )}
      {Object.entries(groupedByCategory).map(([category, tools]) => (
        <div key={category} className="mb-2">
          <h3 className="text-lg font-bold text-gray-800 mb-3 ml-1">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <AIToolCard
                key={tool.id}
                tool={tool}
                handleStartTool={handleStartTool}
                handleCopyJourney={handleCopyJourney}
                animated={true}
                onQuickPreview={() => { setQuickPreviewTool(tool); setShowQuickPreview(true); }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
);

export default AIToolGroupedGrid;
