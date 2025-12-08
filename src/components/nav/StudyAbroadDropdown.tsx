
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, GraduationCap, Star, Eye, FlaskConical, TreePine } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StudyAbroadDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  const studyAbroadMenuItems = [
    { to: "/undergraduate-postgraduate", label: "Undergraduate & Postgraduate", icon: GraduationCap },
    { to: "/phd-doctoral", label: "PhD & Doctoral Programs", icon: FlaskConical },
    { to: "/summer-camps", label: "Summer Camps", icon: TreePine },
    { to: "/virtual-tours", label: "Virtual Tours", icon: Eye },
    { to: "/university-reviews", label: "University Reviews", icon: Star },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
        <span>Home</span>
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 bg-white border shadow-xl z-[60]" align="start">
        {studyAbroadMenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <DropdownMenuItem key={item.to} asChild className="px-4 py-3 hover:bg-blue-50 cursor-pointer">
              <NavLink to={item.to} className="flex items-center space-x-3 w-full">
                <IconComponent className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
              </NavLink>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StudyAbroadDropdown;
