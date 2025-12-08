
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, Zap, FileText, BookOpen, Mail, PenTool } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ToolsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toolsMenuItems = [
    { to: "/ai-agents", label: "AI Agents", icon: Zap },
    { to: "/resume-builder", label: "Resume Builder", icon: FileText },
    { to: "/sop-library", label: "SOP Library", icon: PenTool },
    { to: "/resume-library", label: "Resume Library", icon: FileText },
    { to: "/gmail-library", label: "Gmail Library", icon: Mail },
    { to: "/gre-ielts-resources", label: "GRE & IELTS Resources", icon: BookOpen },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
        <span>Tools</span>
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 bg-white border shadow-xl z-[60]" align="start">
        {toolsMenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <DropdownMenuItem key={item.to} asChild className="px-4 py-3 hover:bg-purple-50 cursor-pointer">
              <NavLink to={item.to} className="flex items-center space-x-3 w-full">
                <IconComponent className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
              </NavLink>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ToolsDropdown;
