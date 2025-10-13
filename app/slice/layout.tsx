import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF Files - Slice PDF Pages Online Free | StitchPDF",
  description:
    "Free online PDF splitter tool. Split PDF into multiple parts, extract pages, or divide PDF documents. 100% client-side, secure and private. No uploads required.",
  keywords: [
    "split PDF",
    "slice PDF",
    "PDF splitter",
    "divide PDF",
    "extract PDF pages",
    "split PDF online free",
    "separate PDF pages",
  ],
  openGraph: {
    title: "Split PDF Files - Slice PDF Pages Online Free",
    description:
      "Free online PDF splitter tool. Split PDF into multiple parts or extract specific pages. 100% client-side, secure and private.",
    url: "https://stitch-pdf.adibprasetiya.com/slice",
  },
};

export default function SliceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
