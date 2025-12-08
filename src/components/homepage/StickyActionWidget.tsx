
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Rocket, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StickyActionWidgetProps {
  onStartJourney: () => void;
  onOpenEduBot: () => void;
}

const StickyActionWidget: React.FC<StickyActionWidgetProps> = ({ onStartJourney, onOpenEduBot }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      icon: MessageSquare,
      label: 'Ask EduBot',
      action: onOpenEduBot,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Rocket,
      label: 'Start Journey',
      action: onStartJourney,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: BookOpen,
      label: 'View Guides',
      action: () => navigate('/resources'),
      color: 'bg-emerald-500 hover:bg-emerald-600'
    }
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end space-y-2">
      {/* Action Buttons */}
      {isExpanded && (
        <div className="flex flex-col space-y-2 animate-fade-in">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <div key={index} className="flex items-center space-x-2">
                <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {action.label}
                </div>
                <Button
                  onClick={action.action}
                  className={`${action.color} text-white rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all transform hover:scale-110`}
                >
                  <IconComponent className="w-5 h-5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full w-14 h-14 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
      >
        {isExpanded ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <ChevronUp className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
};

export default StickyActionWidget;
