# AI Insights Dashboard - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
# Already in package.json, just install:
npm install
```

### 2. Environment Setup
```bash
# Add to .env.local:
AI_SERVICE_URL=http://localhost:8000
MONGODB_URI=mongodb://localhost:27017/edulens
```

### 3. Start Services
```bash
# Terminal 1: AI Service
cd ai_service && ./start.sh

# Terminal 2: Next.js
npm run dev
```

### 4. Create Insights Page
```tsx
// src/app/dashboard/insights/page.tsx
import { AIInsightsDashboard } from '@/components/dashboard/ai-insights';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function InsightsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect('/signin');

  return (
    <div className="container mx-auto p-6">
      <AIInsightsDashboard userId={session.user.id} />
    </div>
  );
}
```

### 5. Add to Navigation
```tsx
// src/components/dashboard/Sidebar.tsx
import { Sparkles } from 'lucide-react';

// Add this item:
{
  href: '/dashboard/insights',
  icon: Sparkles,
  label: 'AI Insights',
}
```

**Done!** Visit `/dashboard/insights`

---

## Most Common Use Cases

### 1. Full Dashboard
```tsx
<AIInsightsDashboard userId={userId} />
```

### 2. Application-Specific
```tsx
<AIInsightsDashboard userId={userId} applicationId={appId} />
```

### 3. Compact Card
```tsx
<ApplicationInsightsCard
  insights={appInsights}
  onViewDetails={() => router.push(`/insights/${appId}`)}
/>
```

### 4. Standalone Components
```tsx
import {
  ProfileStrengthMeter,
  PriorityBadge,
  ImpactEstimator,
} from '@/components/dashboard/ai-insights';

<ProfileStrengthMeter score={85} label="GPA" showPercentile percentile={82} />
<PriorityBadge priority="high" />
<ImpactEstimator impact={45} />
```

### 5. Using Hooks
```tsx
import { useAIInsights } from '@/hooks/useAIInsights';

const { data: insights, isLoading } = useAIInsights(userId);
```

---

## File Structure

```
src/
├── types/insights.ts                    # TypeScript types
├── hooks/
│   ├── useAIInsights.ts                 # Main hook
│   ├── useAdmissionPrediction.ts        # Predictions
│   ├── useFacultyMatches.ts             # Faculty
│   └── useProfileAnalysis.ts            # Profile
├── app/api/insights/                    # API routes
└── components/dashboard/ai-insights/    # Components
    ├── AIInsightsDashboard.tsx          # Main
    ├── *Tab.tsx                         # Tabs
    ├── *Chart.tsx                       # Charts
    ├── *.tsx                            # Utilities
    └── index.ts                         # Exports
```

---

## Available Components

### Main
- `AIInsightsDashboard` - Full dashboard

### Tabs
- `OverviewTab` - Overview
- `ProfileAnalysisTab` - Profile analysis
- `RecommendationsTab` - Recommendations
- `FacultyMatchesTab` - Faculty matches
- `TimelineTab` - Timeline

### Charts
- `AdmissionProbabilityChart` - Line chart
- `PeerComparisonChart` - Bar chart
- `SuccessFactorsChart` - Pie chart

### Utilities
- `ProfileStrengthMeter` - Score meter
- `PriorityBadge` - Priority badge
- `ImpactEstimator` - Impact bar
- `ProgressTracker` - Progress steps
- `ComparisonBar` - Comparison bar

### Features
- `ExportInsights` - Export dialog
- `InsightNotification` - Notifications
- `ApplicationInsightsCard` - Compact card

---

## Available Hooks

### Main
- `useAIInsights(userId)` - Fetch all insights
- `useRefreshInsights()` - Refresh insights

### Predictions
- `useAdmissionPredictions(userId)` - All predictions
- `useApplicationPrediction(appId)` - Single prediction

### Faculty
- `useFacultyMatches(userId)` - Faculty matches
- `useAddFacultyToApplication()` - Add faculty

### Profile
- `useProfileAnalysis(userId)` - Profile analysis
- `useRecommendations(userId)` - Recommendations
- `useCompleteRecommendation()` - Complete recommendation

---

## API Routes

All routes require authentication:

- `GET /api/insights` - All insights
- `POST /api/insights/refresh` - Refresh
- `GET /api/insights/predictions` - Predictions
- `GET /api/insights/profile` - Profile analysis
- `GET /api/insights/recommendations` - Recommendations
- `GET /api/insights/faculty` - Faculty matches
- `POST /api/insights/export` - Export

---

## TypeScript Types

Import from `@/types/insights`:

```tsx
import type {
  AIInsights,
  AdmissionPrediction,
  ProfileStrength,
  ProfileWeakness,
  Recommendation,
  FacultyMatch,
  TimelineSuggestion,
} from '@/types/insights';
```

---

## Common Patterns

### Loading State
```tsx
const { data, isLoading } = useAIInsights(userId);

if (isLoading) return <Loader />;
if (!data) return <EmptyState />;
```

### Error Handling
```tsx
const { data, isError, error } = useAIInsights(userId);

if (isError) {
  return <Alert variant="destructive">{error.message}</Alert>;
}
```

### Refresh
```tsx
const { mutate: refresh, isPending } = useRefreshInsights();

<Button onClick={() => refresh({ userId })} disabled={isPending}>
  {isPending ? 'Refreshing...' : 'Refresh'}
</Button>
```

### Complete Recommendation
```tsx
const { mutate: complete } = useCompleteRecommendation();

<Button onClick={() => complete({ recommendationId, userId })}>
  Complete
</Button>
```

---

## Customization

### Colors
Override in `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      'insights-primary': '#your-color',
    }
  }
}
```

### Custom Tab
```tsx
// Add to AIInsightsDashboard.tsx
<TabsContent value="custom">
  <YourCustomTab data={insights.customData} />
</TabsContent>
```

---

## Troubleshooting

### Insights not loading?
1. Check AI service: `curl http://localhost:8000/health`
2. Check MongoDB: `mongosh`
3. Check auth session: Browser DevTools → Application → Cookies
4. Check console for errors

### Charts not showing?
1. Verify Recharts installed
2. Check data format matches types
3. Ensure ResponsiveContainer has height

### Styles not applying?
1. Check Tailwind compiled: `npm run dev`
2. Verify import paths
3. Check dark mode: Toggle in app

---

## Performance Tips

1. **Enable caching**: Already configured in hooks
2. **Lazy load tabs**: Use React.lazy() for heavy tabs
3. **Memoize components**: Use React.memo() for expensive renders
4. **Optimize images**: Use Next.js Image component
5. **Monitor bundle**: Run `npm run build` and check sizes

---

## Best Practices

1. **Always handle loading/error states**
2. **Use TypeScript types for autocomplete**
3. **Test on mobile devices**
4. **Check accessibility (keyboard nav, screen readers)**
5. **Monitor performance (Lighthouse)**

---

## Resources

- **Full Docs**: `src/components/dashboard/ai-insights/README.md`
- **Examples**: `src/components/dashboard/ai-insights/example-usage.tsx`
- **Implementation Guide**: `AI_INSIGHTS_IMPLEMENTATION_GUIDE.md`
- **Summary**: `AI_INSIGHTS_SUMMARY.md`

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Test (when tests added)
npm test

# AI Service
cd ai_service && ./start.sh
```

---

## Need Help?

1. Check README.md first
2. Review example-usage.tsx
3. Inspect browser console
4. Check API responses in Network tab
5. Review TypeScript types for correct usage

---

## Quick Reference: Props

### AIInsightsDashboard
```tsx
userId: string           // required
applicationId?: string   // optional
className?: string       // optional
```

### ApplicationInsightsCard
```tsx
insights: ApplicationInsights  // required
onViewDetails?: () => void     // optional
className?: string             // optional
```

### ProfileStrengthMeter
```tsx
score: number                           // required, 0-100
label?: string                          // optional
showPercentile?: boolean                // optional
percentile?: number                     // optional
comparison?: 'above'|'below'|'neutral'  // optional
size?: 'sm'|'md'|'lg'                  // optional
```

### PriorityBadge
```tsx
priority: 'high'|'medium'|'low'  // required
showIcon?: boolean               // optional
size?: 'sm'|'md'|'lg'           // optional
```

### ImpactEstimator
```tsx
impact: number        // required, 0-100
label?: string        // optional
showIcon?: boolean    // optional
animated?: boolean    // optional
```

---

## That's It!

You now have everything you need to use the AI Insights Dashboard.

For detailed information, see the full documentation in the README.md file.
