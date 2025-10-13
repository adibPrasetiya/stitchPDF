import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remove PDF Pages - Delete Pages from PDF Free | StitchPDF",
  description:
    "Free online PDF page remover. Delete unwanted pages from your PDF documents easily. 100% client-side processing, secure and private. No uploads required.",
  keywords: [
    "remove PDF pages",
    "delete PDF pages",
    "PDF page remover",
    "remove pages from PDF",
    "delete pages PDF online",
    "PDF page deleter",
  ],
  openGraph: {
    title: "Remove PDF Pages - Delete Pages from PDF Free",
    description:
      "Free online PDF page remover. Delete unwanted pages from PDFs. 100% client-side, secure and private.",
    url: "https://stitch-pdf.adibprasetiya.com/remove-pages",
  },
};

export default function RemovePagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
