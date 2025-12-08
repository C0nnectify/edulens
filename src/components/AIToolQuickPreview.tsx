
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

type Tool = {
  id: number;
  name: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  journey: string[];
  category: string;
};

interface PreviewProps {
  open: boolean;
  onClose: () => void;
  tool: Tool | null;
  onStartTool?: (tool: Tool) => void;
  onCopyJourney?: (tool: Tool) => void;
}

const AIToolQuickPreview = ({
  open,
  onClose,
  tool,
  onStartTool,
  onCopyJourney,
}: PreviewProps) => {
  if (!tool) return null;
  const IconComponent = tool.icon;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white mr-3">
              <IconComponent className="h-7 w-7" />
            </div>
            <DialogTitle>{tool.name}</DialogTitle>
          </div>
          <DialogDescription>{tool.description}</DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Key Features:</div>
          <ul className="space-y-1">
            {tool.features.map((feature, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-center">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2" /> {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Journey Steps:</div>
          <ol className="list-decimal list-inside pl-3 space-y-1 text-base text-blue-700">
            {tool.journey.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-emerald-600 text-white"
            onClick={() => onStartTool && onStartTool(tool)}
          >
            Start Tool
          </Button>
          <Button size="sm" variant="outline"
            onClick={() => onCopyJourney && onCopyJourney(tool)}
          >
            <Copy size={16} className="mr-1" />
            Copy Steps
          </Button>
        </div>
        <DialogClose asChild>
          <Button variant="ghost" className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600">×</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default AIToolQuickPreview;
