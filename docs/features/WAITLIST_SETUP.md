# Waitlist System Setup

This document explains how to use the waitlist modal system that can be triggered from anywhere in your application.

## Overview

The waitlist system consists of:
- **WaitlistModal**: A reusable modal component with a form
- **WaitlistContext**: Global state management for the modal
- **WaitlistButton**: A reusable button component
- **useWaitlistModal**: A custom hook for easy access
- **API Route**: Backend endpoint to store submissions in MongoDB

## Features

- ✅ Global modal that can be opened from anywhere
- ✅ Form validation with Zod
- ✅ MongoDB integration for data storage
- ✅ Source tracking (where users came from)
- ✅ Success/error handling with toast notifications
- ✅ Responsive design
- ✅ TypeScript support

## Setup

### 1. Environment Variables

Add your MongoDB connection string to `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017
# or for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edulens
```

### 2. Database Setup

The system will automatically create a `waitlist` collection in the `edulens` database.

## Usage

### Method 1: Using WaitlistButton Component (Recommended)

```tsx
import WaitlistButton from '@/components/WaitlistButton';

<WaitlistButton source="hero-section">
  Join Waitlist
</WaitlistButton>
```

### Method 2: Using the Hook

```tsx
import { useWaitlistModal } from '@/hooks/useWaitlistModal';

const MyComponent = () => {
  const { openWaitlistModal } = useWaitlistModal();

  return (
    <button onClick={() => openWaitlistModal('pricing-page')}>
      Join Waitlist
    </button>
  );
};
```

## Examples

### Navigation Bar
```tsx
const { openWaitlistModal } = useWaitlist();

<Button onClick={() => openWaitlistModal('navigation')}>
  Join Waitlist
</Button>
```

### Hero Section
```tsx
const { openFromHero } = useWaitlistModal();

<Button onClick={openFromHero}>
  Join Waitlist
</Button>
```

## API Endpoints

### POST /api/waitlist
Submit a new waitlist entry.

### GET /api/waitlist
Get the total count of waitlist entries.

## Testing

1. Start the development server: `npm run dev`
2. Navigate to any page with waitlist buttons
3. Click the buttons to open the modal
4. Fill out the form and submit
5. Check the MongoDB database for new entries 