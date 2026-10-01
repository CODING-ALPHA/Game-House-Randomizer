import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daughters of the King | Royal Tribe Randomizer",
  description:
    "👑 Loved by the father, claimed by the king. Discover your royal tribe: Tribe Jael, Tribe Abigail, Tribe Esther, Tribe Deborah, or Tribe Priscilla!",
  keywords: [
    "Daughters of the King",
    "Royal Tribe Randomizer",
    "Tribe Jael",
    "Tribe Abigail",
    "Tribe Esther",
    "Tribe Deborah",
    "Tribe Priscilla",
    "Lilac and Gold",
    "University",
    "Sports Day",
  ],
  authors: [{ name: "Daughters of the King" }],
  creator: "Daughters of the King",
  publisher: "Daughters of the King",

  // Open Graph for social media sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Daughters of the King | Loved by the father, claimed by the king",
    description:
      "👑 Discover your royal tribe: Tribe Jael, Tribe Abigail, Tribe Esther, Tribe Deborah, or Tribe Priscilla! Saturday, 17th October, 2026.",
    siteName: "Daughters of the King",
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Daughters of the King",
    description:
      "👑 Loved by the father, claimed by the king. Join us Saturday, 17th October, 2026 at the Main school field!",
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  // Manifest for PWA
  manifest: "/manifest.json",

  // Verification for search consoles (optional)
  verification: {
    // google: "your-google-search-console-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
};

// Structured data object
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "Game of Thrones - NACOS x NAMACOS",
  description:
    "Student house randomization event for NACOS and NAMACOS members. Get assigned to your Game of Thrones house!",
  startDate: "2024-11-18T00:00:00Z",
  endDate: "2024-11-30T23:59:59Z",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  location: {
    "@type": "VirtualLocation",
    url: "https://game-of-thrones-seven-sooty.vercel.app",
  },
  organizer: {
    "@type": "Organization",
    name: "NACOS x NAMACOS",
    url: "https://game-of-thrones-seven-sooty.vercel.app",
  },
  image: "https://game-of-thrones-seven-sooty.vercel.app/og-image.jpg",
  offers: {
    "@type": "Offer",
    url: "https://game-of-thrones-seven-sooty.vercel.app",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    validFrom: "2024-11-18T00:00:00Z",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags */}
        <meta name="theme-color" content="#3B0764" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Daughters of the King" />

        {/* Canonical URL */}
        <link
          rel="canonical"
          href="https://game-of-thrones-seven-sooty.vercel.app"
        />

        {/* Structured data for better SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {children}
      </body>
    </html>
  );
}