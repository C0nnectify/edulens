
import { NavLink } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { SimpleMobileDropdown } from './SimpleMobileDropdown';
import { 
  GraduationCap, 
  FlaskConical, 
  TreePine, 
  Zap, 
  FileText, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  Star, 
  Eye, 
  Globe,
  Mail,
  PenTool
} from 'lucide-react';

type MobileMenuProps = {
  isLoggedIn: boolean;
  onLogout: () => void;
  openSignin: () => void;
  closeMenu: () => void;
};

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isLoggedIn, 
  onLogout, 
  openSignin, 
  closeMenu 
}) => {
  const dropdownSections = [
    {
      title: "Study Abroad",
      items: [
        { to: "/undergraduate-postgraduate", label: "Undergraduate & Postgraduate" },
        { to: "/phd-doctoral", label: "PhD & Doctoral Programs" },
        { to: "/summer-camps", label: "Summer Camps" },
        { to: "/virtual-tours", label: "Virtual Tours" },
        { to: "/university-reviews", label: "University Reviews" },
      ]
    },
    {
      title: "Tools", 
      items: [
        { to: "/ai-agents", label: "AI Agents" },
        { to: "/resume-builder", label: "Resume Builder" },
        { to: "/sop-library", label: "SOP Library" },
        { to: "/resume-library", label: "Resume Library" },
        { to: "/gmail-library", label: "Gmail Library" },
        { to: "/gre-ielts-resources", label: "GRE & IELTS Resources" },
      ]
    },
    {
      title: "Community",
      items: [
        { to: "/forum", label: "Forum" },
        { to: "/scholarships", label: "Scholarships" },
        { to: "/resources", label: "Resource Library" },
      ]
    }
  ];

  const singleItems = [
    { to: "/", label: "Home" },
    { to: "/events", label: "Events" },
    { to: "/marketplace", label: "Marketplace" }
  ];

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-md border border-white/20">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-xl font-bold">
          <span className="text-blue-600">Edu</span>
          <span className="text-purple-600">Lens</span>
        </div>
      </div>

      {/* Menu Content */}
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
        {/* Single Items */}
        {singleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-4 py-3 text-foreground hover:bg-muted/50 rounded-lg transition-colors font-medium ${
                isActive ? 'bg-primary/5 text-primary' : ''
              }`
            }
            onClick={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}
        
        {/* Dropdown Sections */}
        {dropdownSections.map((section) => (
          <SimpleMobileDropdown
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
      </div>

      {/* Account Section */}
      <div className="p-4 border-t border-border space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Account
        </h3>
        
        {!isLoggedIn ? (
          <button
            onClick={() => {
              openSignin();
              closeMenu();
            }}
            className="w-full text-left py-3 px-4 text-foreground hover:bg-muted/50 rounded-lg transition-colors font-medium"
          >
            Sign In
          </button>
        ) : (
          <button
            onClick={() => {
              onLogout();
              closeMenu();
            }}
            className="w-full text-left py-3 px-4 text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
