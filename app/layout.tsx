import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import RouteTracker from "@/components/RouteTracker";
import { Suspense } from "react";

export const metadata: Metadata = {
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
  ],
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
