import type { Metadata } from 'next';
import { headers } from 'next/headers';
import NewNavigation from '@/components/homepage/NewNavigation';
import Footer from '@/components/Footer';
import HomeClient from '@/components/homepage/HomeClient';
import { auth } from '@/lib/auth-config';

export const metadata: Metadata = {
  title: {
    default: 'Study Abroad Platform — AI-Powered Tools & Resources | Edulens',
    template: '%s | Edulens',
  },
  description:
    'Explore AI-powered agents and comprehensive tools to plan your study abroad journey. Compare programs, get guidance, and join the waitlist on Edulens.',
  keywords: [
    'Edulens',
    'study abroad',
    'AI agents',
    'international students',
    'scholarships',
    'visa guidance',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Edulens — Study Abroad Made Simple',
    description:
      'AI-powered study abroad platform with intelligent agents and comprehensive tools. Discover resources, explore opportunities, and start your journey.',
    url: 'https://edulens.app/',
    siteName: 'Edulens',
    images: [
      {
        url: 'https://edulens.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Edulens - Study Abroad Made Simple',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edulens — Study Abroad Made Simple',
    description:
      'AI-powered study abroad platform with intelligent agents and comprehensive tools. Discover resources, explore opportunities, and start your journey.',
    images: ['https://edulens.app/og-image.png'],
    site: '@edulens',
    creator: '@edulens',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="min-h-screen bg-white">
      <NewNavigation />
      <HomeClient initialIsSignedIn={Boolean(session?.user)} />
      <Footer />
    </div>
  );
}