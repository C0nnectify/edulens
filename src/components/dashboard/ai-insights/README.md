# AI Insights Dashboard Components

Comprehensive React component library for displaying AI-powered insights, admission predictions, and recommendations for university applications.

## Overview

The AI Insights Dashboard provides students with data-driven insights about their application profiles, including:

- **Admission probability predictions** with confidence intervals
- **Profile strength analysis** compared to admitted students
- **Personalized recommendations** to improve application chances
- **Faculty matches** based on research interests
- **Timeline planning** for application milestones
- **Interactive charts** and visualizations

## Installation

The components are already integrated into the project. Simply import what you need:

```tsx
import { AIInsightsDashboard } from '@/components/dashboard/ai-insights';
```

## Dependencies

- React 19
- Recharts (for charts)
- Framer Motion (for animations)
- shadcn/ui components
- TanStack Query (for data fetching)
- date-fns (for date handling)

## Quick Start

### Basic Usage

```tsx
import { AIInsightsDashboard } from '@/components/dashboard/ai-insights';

export default function InsightsPage() {
  const userId = 'user-123'; // From auth session

  return (
    <div className="container mx-auto p-6">
      <AIInsightsDashboard userId={userId} />
    </div>
  );
}
```

### Application-Specific Insights

```tsx
import { AIInsightsDashboard } from '@/components/dashboard/ai-insights';

export default function ApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const userId = 'user-123';

  return (
    <AIInsightsDashboard
      userId={userId}
      applicationId={applicationId}
    />
  );
}
```

## Component Documentation

### Main Components

#### `AIInsightsDashboard`

The main dashboard component that orchestrates all insights displays.

**Props:**
- `userId` (string, required): User ID to fetch insights for
- `applicationId` (string, optional): Specific application ID for focused insights
- `className` (string, optional): Additional CSS classes

**Features:**
- Tabbed interface with 6 sections
- Auto-refresh stale insights
- Export functionality
- Loading and error states
- Dark mode support

**Example:**
```tsx
<AIInsightsDashboard
  userId="user-123"
  applicationId="app-456"
  className="max-w-7xl mx-auto"
/>
```

---

#### `ApplicationInsightsCard`

Compact card showing key insights for a single application.

**Props:**
- `insights` (ApplicationInsights, required): Insights data
- `onViewDetails` (function, optional): Callback when "View Details" is clicked
- `className` (string, optional): Additional CSS classes

**Use Case:**
Perfect for application list views or dashboards showing multiple applications.

**Example:**
```tsx
import { ApplicationInsightsCard } from '@/components/dashboard/ai-insights';

<ApplicationInsightsCard
  insights={appInsights}
  onViewDetails={() => router.push(`/insights/${appId}`)}
/>
```

---

### Tab Components

#### `OverviewTab`

Displays high-level metrics and quick action items.

**Features:**
- Profile score gauge
- Admission probability average
- Application balance (reach/target/safety)
- Top 3 strengths and weaknesses
- High-priority recommendations

---

#### `ProfileAnalysisTab`

Detailed profile comparison with radar charts and breakdowns.

**Features:**
- Interactive radar chart
- Category-by-category comparison bars
- Detailed strength/weakness cards
- Percentile rankings

---

#### `RecommendationsTab`

Actionable recommendations to improve profile.

**Features:**
- Filterable list (all/active/completed)
- Sortable (priority/impact/effort)
- Impact estimation
- Action step tracking
- Completion tracking

---

#### `FacultyMatchesTab`

Shows matching faculty members at target universities.

**Features:**
- Search and filter
- Match score display
- Research areas
- Recent publications
- "Add to Application" functionality

---

#### `TimelineTab`

Visual timeline of application milestones.

**Features:**
- List and Gantt chart views
- Progress tracking
- Deadline alerts
- Dependency management
- Status indicators

---

### Chart Components

#### `AdmissionProbabilityChart`

Line chart showing probability trends over time.

**Props:**
- `trends` (TrendDataPoint[]): Historical data points
- `scenarios` (ScenarioForecast[], optional): Future scenarios
- `currentProbability` (number): Current probability value
- `className` (string, optional)

**Features:**
- Event markers (GRE retake, publication added)
- Scenario forecasts
- Confidence intervals
- Interactive tooltips

---

#### `PeerComparisonChart`

Bar chart comparing user profile to averages.

**Props:**
- `comparisons` (ProfileComparison[]): Comparison data
- `className` (string, optional)

**Features:**
- Three-way comparison (you vs. average vs. admitted)
- Percentile display
- Category breakdown

---

#### `SuccessFactorsChart`

Pie chart showing importance of different factors.

**Props:**
- `factors` (SuccessFactor[]): Factor importance data
- `className` (string, optional)

**Features:**
- Interactive hover states
- Factor details panel
- User score overlay

---

### Utility Components

#### `ProfileStrengthMeter`

Visual meter for displaying scores (0-100).

**Props:**
- `score` (number, required): Value from 0-100
- `label` (string, optional): Display label
- `showPercentile` (boolean, optional): Show percentile ranking
- `percentile` (number, optional): Percentile value
- `comparison` ('above' | 'below' | 'neutral', optional): Comparison indicator
- `size` ('sm' | 'md' | 'lg', optional): Size variant

**Example:**
```tsx
<ProfileStrengthMeter
  score={85}
  label="GPA Score"
  showPercentile
  percentile={92}
  comparison="above"
/>
```

---

#### `PriorityBadge`

Color-coded priority indicator.

**Props:**
- `priority` ('high' | 'medium' | 'low', required)
- `showIcon` (boolean, optional): Show icon
- `size` ('sm' | 'md' | 'lg', optional)

**Example:**
```tsx
<PriorityBadge priority="high" size="md" showIcon />
```

---

#### `ImpactEstimator`

Visual impact indicator with progress bar.

**Props:**
- `impact` (number, required): Impact value 0-100
- `label` (string, optional): Custom label
- `showIcon` (boolean, optional): Show sparkle icon
- `animated` (boolean, optional): Enable animation

**Example:**
```tsx
<ImpactEstimator
  impact={45}
  label="Potential Improvement"
  animated
/>
```

---

#### `ProgressTracker`

Step-by-step progress visualization.

**Props:**
- `steps` (ProgressStep[], required): Array of steps
- `orientation` ('horizontal' | 'vertical', optional): Layout direction
- `showLabels` (boolean, optional): Show step labels

**Example:**
```tsx
<ProgressTracker
  steps={[
    { id: '1', label: 'GRE Prep', completed: true },
    { id: '2', label: 'SOP Writing', completed: false, current: true },
    { id: '3', label: 'Applications', completed: false },
  ]}
  orientation="horizontal"
/>
```

---

#### `ComparisonBar`

Horizontal bar chart for comparing values.

**Props:**
- `category` (string, required): Category name
- `userValue` (number, required): User's value
- `averageValue` (number, required): Average value
- `admittedAverageValue` (number, optional): Admitted average
- `maxValue` (number, optional): Maximum scale value
- `showLegend` (boolean, optional): Show legend
- `animated` (boolean, optional): Enable animation

---

### Feature Components

#### `ExportInsights`

Dialog for exporting insights as PDF or JSON.

**Props:**
- `insights` (AIInsights, required): Full insights data
- `userId` (string, required): User ID
- `onClose` (function, required): Close callback

**Features:**
- PDF or JSON export
- Section selection
- Email delivery option

---

#### `InsightNotification`

Toast-style notification for insights updates.

**Props:**
- `notification` (InsightNotification, required)
- `onDismiss` (function, required)
- `onAction` (function, optional): Action button handler

---

#### `NotificationCenter`

Container for displaying multiple notifications.

**Props:**
- `notifications` (InsightNotification[], required)
- `onDismiss` (function, required)
- `onAction` (function, optional)
- `maxVisible` (number, optional): Max notifications to show

---

## Data Fetching Hooks

### `useAIInsights(userId, enabled)`

Fetches complete AI insights for a user.

**Returns:**
- `data`: AIInsights object
- `isLoading`: Loading state
- `isError`: Error state
- `error`: Error object
- `refetch`: Manual refetch function

**Example:**
```tsx
const { data: insights, isLoading, refetch } = useAIInsights(userId);
```

---

### `useRefreshInsights()`

Mutation hook to trigger insights regeneration.

**Returns:**
- `mutate`: Function to trigger refresh
- `isPending`: Loading state
- `isError`: Error state

**Example:**
```tsx
const { mutate: refresh, isPending } = useRefreshInsights();

const handleRefresh = () => {
  refresh({
    userId,
    forceRecalculation: true
  });
};
```

---

### `useAdmissionPredictions(userId)`

Fetches admission predictions for all applications.

---

### `useFacultyMatches(userId, universityId?)`

Fetches faculty matches with optional university filter.

---

### `useProfileAnalysis(userId)`

Fetches profile strengths, weaknesses, and comparisons.

---

### `useRecommendations(userId)`

Fetches personalized recommendations.

---

### `useCompleteRecommendation()`

Mutation hook to mark recommendations as completed.

**Example:**
```tsx
const { mutate: complete } = useCompleteRecommendation();

complete({
  recommendationId: 'rec-123',
  userId
});
```

---

## API Integration

### API Routes

The components communicate with the backend via these API routes:

- `GET /api/insights` - Fetch all insights
- `POST /api/insights/refresh` - Trigger regeneration
- `GET /api/insights/predictions` - Get predictions
- `GET /api/insights/profile` - Get profile analysis
- `GET /api/insights/recommendations` - Get recommendations
- `GET /api/insights/faculty` - Get faculty matches
- `POST /api/insights/export` - Export insights

All routes require authentication via Better Auth session.

---

## Styling

Components use Tailwind CSS with shadcn/ui primitives. They support:

- Dark mode (via next-themes)
- Responsive layouts
- Custom theming via CSS variables
- Consistent spacing and typography

### Customization

Override styles using className prop:

```tsx
<AIInsightsDashboard
  userId={userId}
  className="custom-bg rounded-xl shadow-2xl"
/>
```

---

## Animations

Components use Framer Motion for smooth animations:

- Fade-in on mount
- Staggered list items
- Hover effects
- Progress bar animations
- Chart animations

Disable animations by setting `prefers-reduced-motion` in CSS.

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus indicators
- Color contrast
- Screen reader support

---

## Performance

### Optimizations

- React.memo for expensive components
- Lazy loading for tabs
- Virtualization for long lists (if needed)
- Optimistic updates
- Caching with TanStack Query

### Best Practices

```tsx
// ✅ Good - only fetch when needed
const { data } = useAIInsights(userId, session?.user?.id === userId);

// ❌ Bad - fetches for all users
const { data } = useAIInsights(userId);
```

---

## Error Handling

Components handle errors gracefully:

```tsx
const { data, isError, error } = useAIInsights(userId);

if (isError) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error?.message || 'Failed to load insights'}
      </AlertDescription>
    </Alert>
  );
}
```

---

## Testing

### Example Tests

```tsx
import { render, screen } from '@testing-library/react';
import { AIInsightsDashboard } from './AIInsightsDashboard';

test('renders dashboard with insights', async () => {
  render(<AIInsightsDashboard userId="user-123" />);

  expect(await screen.findByText('AI Insights Dashboard')).toBeInTheDocument();
});
```

---

## Migration Guide

### From Old Dashboard

If you have an existing dashboard, migrate like this:

```tsx
// Old
<OldDashboard user={user} />

// New
<AIInsightsDashboard userId={user.id} />
```

---

## Troubleshooting

### Insights not loading

1. Check API routes are properly configured
2. Verify authentication is working
3. Check AI service is running (port 8000)
4. Review browser console for errors

### Charts not displaying

1. Ensure Recharts is installed
2. Check data format matches TypeScript types
3. Verify responsive container has height

### Animations not working

1. Check Framer Motion is installed
2. Verify no CSS conflicts
3. Check prefers-reduced-motion setting

---

## Contributing

When adding new features:

1. Update TypeScript types in `/src/types/insights.ts`
2. Add new hooks in `/src/hooks/`
3. Create components in `/src/components/dashboard/ai-insights/`
4. Export from `index.ts`
5. Update this README

---

## License

Part of the EduLen project. See main project LICENSE.

---

## Support

For issues or questions:
- Check documentation
- Review example usage
- Check TypeScript types
- Inspect browser console
- Review API responses
