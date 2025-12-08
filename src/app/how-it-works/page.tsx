import Footer from "@/components/Footer";
import HowItWorksClient from "@/components/how-it-works/HowItWorksClient";
import Navigation from "@/components/Navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works - Study Abroad AI Platform | Edulens",
  description:
    "Discover how our AI-powered study abroad platform works. From profile analysis to university matching, document creation, and application tracking - see the complete process.",
  keywords: [
    "how it works",
    "study abroad process",
    "AI platform",
    "university application",
    "document creation",
    "application tracking",
  ],
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works - Edulens Study Abroad Platform",
    description:
      "See how our AI-powered platform transforms your study abroad journey from complex to simple.",
    url: "https://edulens.app/how-it-works",
    siteName: "Edulens",
    images: [
      {
        url: "https://edulens.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "How It Works - Edulens Study Abroad Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HowItWorksClient />
      <Footer />
    </div>
  );
}
