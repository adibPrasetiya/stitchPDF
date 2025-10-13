import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insert Pages to PDF - Add Pages to PDF Online Free | StitchPDF",
  description:
    "Free online PDF page insertion tool. Insert new pages or another PDF into existing PDF documents. 100% client-side, secure and private. No uploads required.",
  keywords: [
    "insert PDF pages",
    "add pages to PDF",
    "PDF insert tool",
    "insert PDF into PDF",
    "add pages PDF online",
    "PDF page inserter",
  ],
  openGraph: {
    title: "Insert Pages to PDF - Add Pages to PDF Online Free",
    description:
      "Free online PDF page insertion tool. Insert new pages into your PDFs. 100% client-side, secure and private.",
    url: "https://stitch-pdf.adibprasetiya.com/insert",
  },
};

export default function InsertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
