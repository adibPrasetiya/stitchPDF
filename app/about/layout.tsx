import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About StitchPDF - Free Client-Side PDF Editor",
  description:
    "Learn about StitchPDF, a completely free PDF editor that runs 100% in your browser. Privacy-focused, no uploads, no tracking, and works offline.",
  openGraph: {
    title: "About StitchPDF - Free Client-Side PDF Editor",
    description:
      "Learn about StitchPDF, a free privacy-focused PDF editor that runs entirely in your browser.",
    url: "https://stitch-pdf.adibprasetiya.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
