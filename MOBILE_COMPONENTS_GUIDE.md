# Mobile Component Usage Examples

This guide shows how to use the new mobile-responsive components in the Edulens app.

## Table of Contents
- [Mobile Bottom Navigation](#mobile-bottom-navigation)
- [Mobile Sheet (Bottom Sheet)](#mobile-sheet)
- [Pull to Refresh](#pull-to-refresh)
- [Responsive Layouts](#responsive-layouts)
- [Touch Optimization](#touch-optimization)

## Mobile Bottom Navigation

The `MobileBottomNav` component provides a native app-like navigation experience on mobile devices.

### Usage

```tsx
import MobileBottomNav from '@/components/MobileBottomNav';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      {/* Your content */}
      {children}
      
      {/* Mobile bottom nav - automatically hidden on desktop */}
      <MobileBottomNav />
      
      {/* Add padding bottom to prevent content from being hidden behind nav */}
      <div className="h-20 md:h-0" />
    </div>
  );
}
```

### Customization

Edit the nav items in `src/components/MobileBottomNav.tsx`:

```tsx
const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  // Add your custom routes here
];
```

## Mobile Sheet

The `MobileSheet` component creates a bottom sheet that slides up from the bottom of the screen.

### Basic Usage

```tsx
'use client';

import { useState } from 'react';
import MobileSheet from '@/components/ui/mobile-sheet';
import { Button } from '@/components/ui/button';

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Sheet
      </Button>

      <MobileSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Filter Options"
        description="Customize your search results"
      >
        <div className="space-y-4">
          <p>Your content here</p>
          <Button onClick={() => setIsOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </MobileSheet>
    </>
  );
}
```

### Features
- ✅ Swipe down to dismiss
- ✅ Backdrop blur
- ✅ Smooth animations
- ✅ Auto body scroll lock
- ✅ Touch-optimized

## Pull to Refresh

Add pull-to-refresh functionality to any scrollable content.

### Usage

```tsx
'use client';

import { useState } from 'react';
import PullToRefresh from '@/components/ui/pull-to-refresh';

export default function FeedPage() {
  const [data, setData] = useState([]);

  const handleRefresh = async () => {
    // Fetch new data
    const response = await fetch('/api/feed');
    const newData = await response.json();
    setData(newData);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 p-4">
        {data.map((item) => (
          <div key={item.id} className="p-4 bg-white rounded-lg shadow">
            {item.content}
          </div>
        ))}
      </div>
    </PullToRefresh>
  );
}
```

### Props
- `onRefresh`: Async function called when refresh is triggered
- `threshold`: Pull distance required to trigger refresh (default: 80px)
- `disabled`: Disable pull to refresh
- `className`: Additional CSS classes

## Responsive Layouts

### Container with Mobile Padding

```tsx
<div className="mobile-container">
  {/* Automatically adjusts padding: 4 (mobile) → 6 (tablet) → 8 (desktop) */}
  <h1>Your Content</h1>
</div>
```

### Responsive Grid

```tsx
{/* 1 column mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

### Responsive Text

```tsx
{/* Small mobile → Medium tablet → Large desktop */}
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

<p className="text-sm sm:text-base lg:text-lg">
  Responsive paragraph text
</p>
```

### Stack on Mobile, Row on Desktop

```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

## Touch Optimization

### Touch-Optimized Buttons

All buttons now have:
- Minimum 44x44px touch targets
- Active feedback (scales to 0.95 on press)
- Proper touch action handling

```tsx
<Button className="touch-manipulation active:scale-95">
  Tap Me
</Button>
```

### Custom Touch Element

```tsx
<div 
  onClick={handleClick}
  className="touch-manipulation active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
>
  <Icon />
</div>
```

### Prevent Text Selection

```tsx
<div className="no-select">
  This text can't be selected (good for UI labels)
</div>
```

## Responsive Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    {/* Title automatically adjusts: lg → xl → 2xl */}
    <CardTitle>Card Title</CardTitle>
    {/* Description: xs → sm */}
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Padding: 4 → 6 */}
    <p>Card content here</p>
  </CardContent>
</Card>
```

## Form Inputs

```tsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

<form className="space-y-4">
  {/* Input automatically has proper mobile height (44px minimum) */}
  <Input 
    type="email" 
    placeholder="Enter your email"
    className="touch-manipulation"
  />
  
  {/* Button has proper touch target */}
  <Button type="submit" className="w-full sm:w-auto">
    Submit
  </Button>
</form>
```

## Navigation with Mobile Menu

```tsx
import Navigation from '@/components/Navigation';

{/* Navigation component handles mobile menu automatically */}
<Navigation />
```

Features:
- Hamburger menu on mobile
- Full-screen overlay menu
- Smooth animations
- Body scroll lock when open
- Touch-optimized

## Modal vs Sheet

**Use Modal for:**
- Desktop-primary interactions
- Alert dialogs
- Confirmation prompts
- Forms that need full attention

**Use Mobile Sheet for:**
- Mobile-first interactions
- Filters and options
- Quick actions
- Bottom-up flows

## Best Practices

### 1. Always Use Mobile-First Approach

```tsx
// ✅ Good: Start with mobile, add larger breakpoints
className="text-sm md:text-base lg:text-lg"

// ❌ Bad: Requires overriding
className="text-lg md:text-sm"
```

### 2. Ensure Proper Touch Targets

```tsx
// ✅ Good: Minimum 44x44px
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon />
</button>

// ❌ Bad: Too small for touch
<button className="p-1">
  <Icon />
</button>
```

### 3. Add Active Feedback

```tsx
// ✅ Good: Visual feedback on press
<button className="active:scale-95 transition-transform">
  Click me
</button>

// ❌ Bad: No feedback
<button>
  Click me
</button>
```

### 4. Use Semantic Breakpoints

```tsx
// ✅ Good: Clear intention
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// ❌ Bad: Unclear
<div className="hidden sm:block md:hidden lg:block">???</div>
```

### 5. Test on Real Devices

- Use Chrome DevTools mobile emulation during development
- Test on actual iOS and Android devices before launch
- Check safe area insets on notched devices
- Test touch interactions, not just hover states

## Utility Classes Reference

```css
/* Touch optimization */
.touch-manipulation      /* Optimizes touch events */
.no-select              /* Prevents text selection */

/* Responsive padding */
.mobile-padding         /* px-4 sm:px-6 lg:px-8 */
.mobile-container       /* Container with mobile padding */

/* Safe areas */
.safe-area-inset       /* Respects notches and rounded corners */

/* Scrolling */
.momentum-scroll       /* Smooth iOS-style scrolling */
.hide-scrollbar        /* Hides scrollbar but keeps scroll */

/* Active states */
.active:scale-95       /* Feedback on press */
```

## Testing Checklist

- [ ] Test all breakpoints (mobile, tablet, desktop)
- [ ] Verify touch targets are at least 44x44px
- [ ] Check active states on all interactive elements
- [ ] Test on iOS Safari and Chrome Mobile
- [ ] Verify safe area insets on notched devices
- [ ] Test landscape orientation
- [ ] Check keyboard behavior on mobile
- [ ] Verify scroll behavior and pull-to-refresh
- [ ] Test navigation menu open/close
- [ ] Check form input behavior and autocomplete

## Need Help?

Refer to:
- `MOBILE_RESPONSIVE_UPDATE.md` - Full implementation details
- `tailwind.config.ts` - Breakpoint and utility configuration
- Component source files for implementation examples
