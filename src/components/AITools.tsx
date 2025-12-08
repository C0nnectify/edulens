import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import AIToolQuickPreview from "./AIToolQuickPreview";

import AIJourneyModal from './AIJourneyModal';

import AIToolsCTA from "./AIToolsCTA";
import { fetchAITools } from '@/api/tools';

import AIToolGroupedGrid from './AIToolGroupedGrid';
import AIToolGroupedList from './AIToolGroupedList';
import AIToolToolbar from './AIToolToolbar';

// Define Tool type locally for clarity & safety
export type Tool = {
  id: number;
  name: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  journey: string[];
  category: string;
  popular?: boolean; // add optional popular property if used
};

const SHOW_MORE_INITIAL = 8;

const EXPLANATION_TEXT = (
  <>
    <div className="bg-emerald-50/80 border border-emerald-100 text-emerald-900 p-5 rounded-xl mb-8 max-w-4xl mx-auto shadow-sm animate-fade-in">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        What’s the difference between <span className="text-emerald-700">AI Tools</span> & <span className="text-blue-600">AI Agents</span>?
      </h3>
      <div className="text-gray-700 text-sm md:text-base flex flex-col md:flex-row gap-5">
        <div className="flex-1">
          <span className="font-medium text-emerald-700">AI Tools</span> are specialized products that automate or assist with a specific study abroad task (like SOP generator, University Finder, Budget Estimator, etc), each offering a focused, step-by-step workflow, built using AI.
        </div>
        <div className="flex-1">
          <span className="font-medium text-blue-700">AI Agents</span> are smart assistants able to answer questions, make recommendations, or guide you end-to-end, simulating a personal counselor who can handle conversational problem-solving and open queries across topics.
        </div>
      </div>
    </div>
  </>
);

const AITools = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [journeyModal, setJourneyModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [quickPreviewTool, setQuickPreviewTool] = useState<Tool | null>(null);
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const { toast } = useToast();

  const { data: tools = [], isLoading, error, refetch, isRefetching } = useQuery<Tool[]>({
    queryKey: ['aiTools'],
    queryFn: fetchAITools,
  });

  const handleStartTool = (tool: Tool) => {
    setSelectedTool(tool);
    setJourneyModal(true);
  };

  const handleCopyJourney = (tool: Tool) => {
    const journeyText = tool.journey.map((step: string) => `• ${step}`).join('\n');
    navigator.clipboard.writeText(journeyText).then(() => {
      toast({
        title: "Copied!",
        description: `All journey steps for ${tool.name} were copied to your clipboard.`,
      });
    });
  };

  // Categories for filter pills
  const categories = tools.length > 0 ? [...new Set(tools.map(tool => tool.category))] : [];

  // Trending/popular tools highlighted first if available (assume tool.popular: boolean)
  const sortedTools = [
    ...tools.filter(tool => tool.popular),
    ...tools.filter(tool => !tool.popular),
  ];

  // Filtering by category and search
  const filteredTools = sortedTools
    .filter(tool => selectedCategory === 'All' || tool.category === selectedCategory)
    .filter(tool =>
      searchQuery.trim() === '' ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const shouldEnableShowMore = filteredTools.length > SHOW_MORE_INITIAL;
  const toolsToShow = showMore ? filteredTools : filteredTools.slice(0, SHOW_MORE_INITIAL);

  // Group toolsToShow by category (Show More/Show Less logic now affects BOTH views)
  const groupedByCategory = toolsToShow.reduce((acc: Record<string, Tool[]>, tool) => {
    (acc[tool.category] = acc[tool.category] || []).push(tool);
    return acc;
  }, {});

  // Debug log
  console.log("AITools: groupedByCategory", groupedByCategory, "toolsToShow", toolsToShow);

  const recommendations: unknown[] = []; // (future)

  // --- Main render
  return (
    <>
      <TooltipProvider>
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {EXPLANATION_TEXT}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Complete AI-Powered Toolkit
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                13 comprehensive AI tools covering every aspect of your study abroad journey with detailed step-by-step guidance
              </p>
            </div>
            {/* Toolbar (filter/search/view) */}
            <AIToolToolbar
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              view={view}
              setView={setView}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              toolsToShowLen={toolsToShow.length}
              toolsLen={tools.length}
            />
            {/* AI Tools List */}
            {isLoading ? (
              <div className={view === "list" ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className={view === "list"
                    ? "flex items-center gap-4 bg-white border rounded-lg shadow-sm px-5 py-4 animate-pulse"
                    : "space-y-4 rounded-xl border bg-white p-4 shadow-lg animate-pulse"
                  }>
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-10 flex flex-col items-center justify-center bg-red-50/50 border border-red-100 rounded-xl">
                <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h3>
                <p className="text-red-600 mb-6 max-w-md">
                  We couldn&apos;t load the AI tools right now. Please check your connection and try again.
                </p>
                <Button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isRefetching ? 'Retrying...' : 'Try Again'}
                </Button>
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-10">
                {searchQuery
                  ? `No tools found for "${searchQuery}". Try a different search.`
                  : "No tools available in this category."}
              </div>
            ) : (
              view === "list" ? (
                <AIToolGroupedList
                  groupedByCategory={groupedByCategory}
                  handleStartTool={handleStartTool}
                  handleCopyJourney={handleCopyJourney}
                  setQuickPreviewTool={setQuickPreviewTool}
                  setShowQuickPreview={setShowQuickPreview}
                />
              ) : (
                <AIToolGroupedGrid
                  groupedByCategory={groupedByCategory}
                  recommendations={recommendations}
                  handleStartTool={handleStartTool}
                  handleCopyJourney={handleCopyJourney}
                  setQuickPreviewTool={setQuickPreviewTool}
                  setShowQuickPreview={setShowQuickPreview}
                />
              )
            )}

            {/* Show More/Show Less Button */}
            {!isLoading && !error && shouldEnableShowMore && filteredTools.length > 0 && (
              <div className="flex justify-center mt-10">
                <Button
                  onClick={() => setShowMore((prev) => !prev)}
                  variant="outline"
                  className="px-8 py-2 rounded-full border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-semibold"
                >
                  {showMore ? "Show Less" : `Show More (${filteredTools.length - SHOW_MORE_INITIAL} more)`}
                </Button>
              </div>
            )}
            <div className="text-center mt-16">
              <AIToolsCTA />
            </div>
          </div>
        </section>

        {/* AIJourneyModal modal logic */}
        {selectedTool && (
          <AIJourneyModal
            isOpen={journeyModal}
            onClose={() => {
              setJourneyModal(false);
              setSelectedTool(null);
            }}
            agentId={selectedTool.id}
            agentName={selectedTool.name}
            journey={selectedTool.journey}
            toolType="tool"
          />
        )}
        {/* Quick Preview Modal */}
        <AIToolQuickPreview
          open={showQuickPreview}
          onClose={() => setShowQuickPreview(false)}
          tool={quickPreviewTool}
          onStartTool={handleStartTool}
          onCopyJourney={handleCopyJourney}
        />
      </TooltipProvider>
    </>
  );
};

export default AITools;
