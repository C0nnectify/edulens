
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, GraduationCap, MapPin, Star, Users, BookOpen, Zap, FileText, Eye, DollarSign, Calendar, MessageSquare, Globe, FlaskConical, TreePine, Mail, PenTool } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const NavDropdowns = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const studyAbroadMenuItems = [
    { to: "/undergraduate-postgraduate", label: "Undergraduate & Postgraduate", icon: GraduationCap },
    { to: "/phd-doctoral", label: "PhD & Doctoral Programs", icon: FlaskConical },
    { to: "/summer-camps", label: "Summer Camps", icon: TreePine },
    { to: "/virtual-tours", label: "Virtual Tours", icon: Eye },
    { to: "/university-reviews", label: "University Reviews", icon: Star },
  ];

  const toolsMenuItems = [
    { to: "/ai-agents", label: "AI Agents", icon: Zap },
    { to: "/resume-builder", label: "Resume Builder", icon: FileText },
    { to: "/sop-library", label: "SOP Library", icon: PenTool },
    { to: "/resume-library", label: "Resume Library", icon: FileText },
    { to: "/gmail-library", label: "Gmail Library", icon: Mail },
    { to: "/gre-ielts-resources", label: "GRE & IELTS Resources", icon: BookOpen },
  ];

  const communityMenuItems = [
    { to: "/forum", label: "Forum", icon: MessageSquare },
    { to: "/scholarships", label: "Scholarships", icon: DollarSign },
    { to: "/resources", label: "Resource Library", icon: BookOpen },
  ];

  return (
    <>
      {/* Study Abroad Dropdown - First */}
      <DropdownMenu open={openDropdown === 'study-abroad'} onOpenChange={(open) => setOpenDropdown(open ? 'study-abroad' : null)}>
        <DropdownMenuTrigger className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
          <span>Study Abroad</span>
          <ChevronDown className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 bg-white border shadow-xl z-[60]" align="start">
          {studyAbroadMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <DropdownMenuItem key={item.to} asChild className="px-4 py-3 hover:bg-blue-50 cursor-pointer">
                <Link href={item.to} className="flex items-center space-x-3 w-full">
                  <IconComponent className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tools Dropdown - Second */}
      <DropdownMenu open={openDropdown === 'tools'} onOpenChange={(open) => setOpenDropdown(open ? 'tools' : null)}>
        <DropdownMenuTrigger className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
          <span>Tools</span>
          <ChevronDown className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 bg-white border shadow-xl z-[60]" align="start">
          {toolsMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <DropdownMenuItem key={item.to} asChild className="px-4 py-3 hover:bg-purple-50 cursor-pointer">
                <Link href={item.to} className="flex items-center space-x-3 w-full">
                  <IconComponent className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Community Dropdown - Third */}
      <DropdownMenu open={openDropdown === 'community'} onOpenChange={(open) => setOpenDropdown(open ? 'community' : null)}>
        <DropdownMenuTrigger className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
          <span>Community</span>
          <ChevronDown className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 bg-white border shadow-xl z-[60]" align="start">
          {communityMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <DropdownMenuItem key={item.to} asChild className="px-4 py-3 hover:bg-emerald-50 cursor-pointer">
                <Link href={item.to} className="flex items-center space-x-3 w-full">
                  <IconComponent className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default NavDropdowns;
