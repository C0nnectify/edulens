
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tool } from "./AITools";

interface Props {
  groupedByCategory: Record<string, Tool[]>;
  handleStartTool: (tool: Tool) => void;
  handleCopyJourney: (tool: Tool) => void;
  setQuickPreviewTool: (tool: Tool | null) => void;
  setShowQuickPreview: (open: boolean) => void;
}

const AIToolGroupedList = ({
  groupedByCategory,
  handleStartTool,
  handleCopyJourney,
  setQuickPreviewTool,
  setShowQuickPreview,
}: Props) => (
  <ScrollArea style={{ maxHeight: 620, minHeight: 320 }}>
    <div className="flex flex-col gap-8">
      {Object.entries(groupedByCategory).map(([category, tools]) => (
        <div key={category} className="mb-2">
          <h3 className="text-lg font-bold text-gray-800 mb-2 ml-1">{category}</h3>
          <div className="flex flex-col gap-4">
            {tools.map(tool => (
              <div
                key={tool.id}
                className={`
                  flex items-center gap-4 bg-white border rounded-lg shadow-sm px-5 py-4 hover:shadow-lg transition
                  ${tool.popular ? "border-emerald-300 bg-emerald-50/60" : ""}
                  animate-fade-in
                `}
                tabIndex={0}
                onClick={() => handleStartTool(tool)}
                onMouseEnter={() => { setQuickPreviewTool(tool); setShowQuickPreview(true); }}
                onMouseLeave={() => setShowQuickPreview(false)}
                onFocus={() => { setQuickPreviewTool(tool); setShowQuickPreview(true); }}
                onBlur={() => setShowQuickPreview(false)}
              >
                <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center bg-gray-100 rounded-full mr-2 text-emerald-700 text-2xl font-bold">
                  {tool.icon ? <img src={tool.icon as string} alt="" className="h-10 w-10" /> : tool.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">{tool.name}</span>
                    {tool.popular && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-semibold ml-2">Trending</span>
                    )}
                  </div>
                  <div className="text-gray-600 text-sm">{tool.description}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">{tool.category}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-2">
                  <Button size="sm" className="bg-emerald-600 text-white"
                    onClick={e => { e.stopPropagation(); handleStartTool(tool); }}>
                    Open Tool
                  </Button>
                  <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleCopyJourney(tool); }}>
                    Copy Steps
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-2"
                  onClick={e => { e.stopPropagation(); setQuickPreviewTool(tool); setShowQuickPreview(true); }}
                  tabIndex={0}
                  aria-label={`Preview ${tool.name}`}
                >👁</Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
);

export default AIToolGroupedList;
