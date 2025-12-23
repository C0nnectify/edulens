import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Edulens",
  description: "Edulens is your all-in-one study abroad platform, offering AI-powered tools, expert mentorship, and a vibrant appmunity to guide your global education journey.",
  keywords: [
    "Edulens",
    "study abroad",
    "AI education tools",
    "mentorship",
    "international students",
    "global education",
    "university applications",
    "student appmunity",
    "scholarships",
    "visa guidance"
  ],
  openGraph: {
    title: "Edulens",
    description: "Edulens is your all-in-one study abroad platform, offering AI-powered tools, expert mentorship, and a vibrant appmunity to guide your global education journey.",
    url: "https://edulens.app",
    siteName: "Edulens",
    images: [
      {
        url: "https://edulens.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Edulens - Study Abroad Made Simple",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Edulens",
    description: "Edulens is your all-in-one study abroad platform, offering AI-powered tools, expert mentorship, and a vibrant appmunity to guide your global education journey.",
    images: ["https://edulens.app/og-image.png"],
    site: "@edulens",
    creator: "@edulens",
  },
  metadataBase: new URL("https://edulens.app"),
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
