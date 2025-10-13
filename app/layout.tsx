import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import RouteTracker from "@/components/RouteTracker";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://stitch-pdf.adibprasetiya.com"),
  title: "StitchPDF - Free All-in-One Client-Side PDF Editor",
  description:
    "100% Free PDF tools that run entirely in your browser. Merge, split, edit, and manage PDF files with complete privacy. No uploads, no tracking, no watermarks - all processing happens client-side on your device.",
  icons: {
    icon: "/assets/images/stitchPDF-logo.png",
    shortcut: "/assets/images/stitchPDF-logo.png",
    apple: "/assets/images/stitchPDF-logo.png",
  },
  keywords: [
    "Free PDF editor",
    "merge PDF",
    "split PDF",
    "edit PDF online",
    "PDF tools",
    "StitchPDF",
    "client-side PDF",
    "privacy-safe PDF editor",
    "PDF merger",
    "PDF splitter",
    "combine PDF",
    "compress PDF",
    "PDF converter",
  ],
  authors: [{ name: "StitchPDF" }],
  creator: "StitchPDF",
  publisher: "StitchPDF",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://stitch-pdf.adibprasetiya.com",
    siteName: "StitchPDF",
    title: "StitchPDF - Free All-in-One Client-Side PDF Editor",
    description:
      "100% Free PDF tools that run entirely in your browser. Merge, split, edit, and manage PDF files with complete privacy. No uploads, no tracking, no watermarks.",
    images: [
      {
        url: "/assets/images/stitchPDF-logo.png",
        width: 1200,
        height: 630,
        alt: "StitchPDF - Free PDF Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StitchPDF - Free All-in-One Client-Side PDF Editor",
    description:
      "100% Free PDF tools that run entirely in your browser. Merge, split, edit, and manage PDF files with complete privacy.",
    images: ["/assets/images/stitchPDF-logo.png"],
    creator: "@stitchpdf",
  },
  alternates: {
    canonical: "https://stitch-pdf.adibprasetiya.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <RouteTracker />
        </Suspense>
        <Navbar />
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
