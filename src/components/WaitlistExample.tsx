'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import WaitlistButton from './WaitlistButton';
import { useWaitlistModal } from '@/hooks/useWaitlistModal';

const WaitlistExample: React.FC = () => {
  const { openWaitlistModal, openFromCTA, openFromFeature } = useWaitlistModal();

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Waitlist Modal Examples
        </h2>
        <p className="text-gray-600 mb-8">
          These examples show different ways to trigger the waitlist modal from anywhere in your application.
        </p>
      </div>

      {/* Example 1: Using the WaitlistButton component */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-semibold mb-4">1. Using WaitlistButton Component</h3>
        <p className="text-gray-600 mb-4">
          The easiest way to add waitlist functionality to any button.
        </p>
        <div className="flex flex-wrap gap-4">
          <WaitlistButton source="example-primary">
            Join Waitlist
          </WaitlistButton>
          <WaitlistButton 
            variant="outline" 
            source="example-outline"
          >
            Get Early Access
          </WaitlistButton>
          <WaitlistButton 
            variant="secondary" 
            size="sm"
            source="example-small"
          >
            Sign Up
          </WaitlistButton>
        </div>
      </div>

      {/* Example 2: Using the hook directly */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-semibold mb-4">2. Using useWaitlistModal Hook</h3>
        <p className="text-gray-600 mb-4">
          For more control, use the hook directly with custom buttons.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={() => openWaitlistModal('custom-button')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Custom Button
          </Button>
          <Button 
            onClick={openFromCTA}
            variant="outline"
          >
            Call to Action
          </Button>
          <Button 
            onClick={openFromFeature}
            variant="secondary"
          >
            Feature Demo
          </Button>
        </div>
      </div>

      {/* Example 3: Different trigger sources */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-semibold mb-4">3. Different Trigger Sources</h3>
        <p className="text-gray-600 mb-4">
          Track where users are coming from by using different source parameters.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            onClick={() => openWaitlistModal('pricing-page')}
            variant="outline"
            size="sm"
          >
            Pricing Page
          </Button>
          <Button 
            onClick={() => openWaitlistModal('footer')}
            variant="outline"
            size="sm"
          >
            Footer
          </Button>
          <Button 
            onClick={() => openWaitlistModal('sidebar')}
            variant="outline"
            size="sm"
          >
            Sidebar
          </Button>
          <Button 
            onClick={() => openWaitlistModal('popup')}
            variant="outline"
            size="sm"
          >
            Popup
          </Button>
        </div>
      </div>

      {/* Example 4: Inline text links */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-semibold mb-4">4. Inline Text Links</h3>
        <p className="text-gray-600 mb-4">
          You can also trigger the modal from text links or any other element.
        </p>
        <div className="space-y-2">
          <p className="text-gray-700">
            Ready to get started?{' '}
            <button
              onClick={() => openWaitlistModal('inline-text')}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Join our waitlist
            </button>
            {' '}to be notified when we launch.
          </p>
          <p className="text-gray-700">
            Want to learn more?{' '}
            <button
              onClick={() => openWaitlistModal('learn-more')}
              className="text-emerald-600 hover:text-emerald-800 underline font-medium"
            >
              Sign up for updates
            </button>
            {' '}and get exclusive early access.
          </p>
        </div>
      </div>

      {/* Example 5: Card with waitlist CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-semibold mb-4">5. Feature Card with Waitlist CTA</h3>
        <p className="text-gray-600 mb-4">
          Perfect for feature showcases or product cards.
        </p>
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-lg font-semibold mb-2">AI-Powered University Matching</h4>
          <p className="text-gray-600 mb-4">
            Our advanced AI algorithm matches you with the perfect universities based on your profile, preferences, and goals.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Coming Soon</span>
            <WaitlistButton 
              source="feature-card"
              size="sm"
            >
              Get Early Access
            </WaitlistButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistExample; 