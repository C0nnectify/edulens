
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Star, Shield, Clock, Globe } from 'lucide-react';

// Unified color palette
export const designTokens = {
  colors: {
    primary: {
      50: 'bg-emerald-50',
      100: 'bg-emerald-100',
      500: 'bg-emerald-500',
      600: 'bg-emerald-600',
      700: 'bg-emerald-700',
    },
    secondary: {
      50: 'bg-blue-50',
      100: 'bg-blue-100',
      500: 'bg-blue-500',
      600: 'bg-blue-600',
      700: 'bg-blue-700',
    },
    accent: {
      50: 'bg-purple-50',
      100: 'bg-purple-100',
      500: 'bg-purple-500',
      600: 'bg-purple-600',
      700: 'bg-purple-700',
    },
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  },
  spacing: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  },
  borderRadius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
  },
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  }
};

// Unified components
export const UnifiedCard = ({ children, variant = 'default', className = '' }: {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}) => {
  const variantClasses = {
    default: 'bg-white border-gray-200',
    primary: 'bg-emerald-50 border-emerald-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div className={`border ${variantClasses[variant]} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 ${className}`}>
      {children}
    </div>
  );
};

export const TrustBadge = ({ type, text }: { type: 'verified' | 'ai' | 'expert' | 'time'; text: string }) => {
  const badgeConfig = {
    verified: { icon: CheckCircle, color: 'bg-green-100 text-green-800', iconColor: 'text-green-600' },
    ai: { icon: Star, color: 'bg-blue-100 text-blue-800', iconColor: 'text-blue-600' },
    expert: { icon: Shield, color: 'bg-purple-100 text-purple-800', iconColor: 'text-purple-600' },
    time: { icon: Clock, color: 'bg-gray-100 text-gray-800', iconColor: 'text-gray-600' },
  };

  const config = badgeConfig[type];
  const IconComponent = config.icon;

  return (
    <Badge className={`inline-flex items-center gap-1 ${config.color} hover:shadow-md transition-all`}>
      <IconComponent className={`h-3 w-3 ${config.iconColor}`} />
      {text}
    </Badge>
  );
};

export const AIFeedbackBar = ({ score, label, explanation }: { 
  score: number; 
  label: string; 
  explanation?: string;
}) => {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
      {explanation && (
        <p className="text-xs text-gray-600 italic">{explanation}</p>
      )}
    </div>
  );
};

export const MobileOptimizedButton = ({ children, ...props }: any) => (
  <Button {...props} className={`min-h-[48px] text-base font-semibold ${props.className || ''}`}>
    {children}
  </Button>
);
