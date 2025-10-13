import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merge PDF Files - Combine Multiple PDFs Online Free | StitchPDF",
  description:
    "Free online PDF merger tool. Combine multiple PDF files into one document. 100% client-side processing, no uploads, secure and private. Works offline in your browser.",
  keywords: [
    "merge PDF",
    "combine PDF",
    "PDF merger",
    "join PDF files",
    "merge PDF online free",
    "combine PDF files",
    "PDF combiner",
  ],
  openGraph: {
    title: "Merge PDF Files - Combine Multiple PDFs Online Free",
    description:
      "Free online PDF merger tool. Combine multiple PDF files into one document. 100% client-side, secure and private.",
    url: "https://stitch-pdf.adibprasetiya.com/merge",
  },
};

export default function MergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
