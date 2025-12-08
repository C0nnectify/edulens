
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, ArrowRight } from 'lucide-react';
import React from 'react';

type Tool = {
  id: number;
  name: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  journey: string[];
  category: string;
};

interface AIToolCardProps {
  tool: Tool;
  handleStartTool: (tool: Tool) => void;
  handleCopyJourney: (tool: Tool) => void;
  animated?: boolean;
  onQuickPreview?: () => void;
}

const isValidIconComponent = (icon: unknown) => {
  // Add an informative log to help debug icon rendering issues
  const valid = typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon);
  if (!valid) {
    console.warn('AIToolCard: icon prop is missing or invalid for tool:', icon);
  }
  return valid;
};

const AIToolCard = ({
  tool,
  handleStartTool,
  handleCopyJourney,
  animated = true,
  onQuickPreview,
}: AIToolCardProps) => {
  const IconComponent = tool.icon;
  const toolLabelId = `tool-label-${tool.id}`;
  const toolDescId = `tool-desc-${tool.id}`;

  return (
    <div 
      className={`
        bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border border-gray-100 p-6 group relative overflow-hidden outline-none
        transition-transform duration-200
        hover:scale-105 hover:border-emerald-300 hover:shadow-2xl
        focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2
        focus-visible:bg-emerald-50 focus-visible:border-emerald-400 focus-visible:shadow-emerald-200 focus-visible:shadow-[0_0_0_4px_rgba(52,211,153,0.25)]
        focus-visible:scale-[1.025]
        active:scale-95
        ${animated ? "animate-fade-in" : ""}
      `}
      tabIndex={0}
      role="button"
      aria-label={`Open ${tool.name} journey modal`}
      aria-labelledby={toolLabelId}
      aria-describedby={toolDescId}
      onClick={() => handleStartTool(tool)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartTool(tool);
        }
      }}
    >
      <div className="absolute top-3 right-3">
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
          {tool.category}
        </span>
      </div>
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white mr-3 transition-transform duration-200 group-hover:scale-110 focus-visible:scale-110">
          {isValidIconComponent(IconComponent) ? (
            <IconComponent className="h-6 w-6" />
          ) : (
            <span className="text-2xl font-bold text-white select-none" aria-hidden>{tool.name?.charAt(0) || "?"}</span>
          )}
        </div>
        <div className="text-sm font-semibold text-emerald-600">AI Tool #{tool.id}</div>
      </div>
      <h3
        id={toolLabelId}
        className="font-bold text-gray-900 text-lg mb-3 leading-tight"
      >
        {tool.name}
      </h3>
      <div id={toolDescId}>
        <p className="text-gray-600 text-sm mb-4">
          {tool.description}
        </p>
        <div className="text-xs font-semibold text-gray-500 mb-2">JOURNEY STEPS:</div>
        <div className="text-sm text-blue-600 font-medium leading-tight mb-2">
          {tool.journey.slice(0, 3).join(' → ')}
          {tool.journey.length > 3 && '...'}
        </div>
        <div className="text-xs text-gray-500">
          {tool.journey.length} total steps
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 flex items-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 font-medium border-blue-100"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyJourney(tool);
            }}
            tabIndex={0}
          >
            <Copy size={16} className="mr-1" />
            Copy Journey Steps
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Copy all steps to clipboard
        </TooltipContent>
      </Tooltip>
      <div className="mb-6">
        <div className="text-xs font-semibold text-gray-500 mb-2">KEY FEATURES:</div>
        <div className="space-y-1">
          {tool.features.slice(0, 3).map((feature, featureIndex) => (
            <div key={featureIndex} className="text-xs text-gray-600 flex items-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
              {feature}
            </div>
          ))}
          {tool.features.length > 3 && (
            <div className="text-xs text-gray-500 italic">
              +{tool.features.length - 3} more features
            </div>
          )}
        </div>
      </div>      
      <Button 
        size="sm" 
        onClick={(e) => {
          e.stopPropagation();
          handleStartTool(tool);
        }}
        className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 group-hover:shadow-lg transition-all"
        tabIndex={0}
      >
        Start Journey <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      {onQuickPreview && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 left-2 z-10"
          tabIndex={0}
          aria-label={`Quick preview ${tool.name}`}
          onClick={e => { e.stopPropagation(); onQuickPreview(); }}
        >
          👁
        </Button>
      )}
    </div>
  );
};

export default AIToolCard;
