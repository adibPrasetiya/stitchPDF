import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert Images to PDF - JPG/PNG to PDF Converter Free | StitchPDF",
  description:
    "Free online image to PDF converter. Convert multiple images (JPG, PNG) into a single PDF document. 100% client-side, no uploads, secure and private.",
  keywords: [
    "images to PDF",
    "JPG to PDF",
    "PNG to PDF",
    "convert images to PDF",
    "image PDF converter",
    "picture to PDF",
    "photo to PDF",
  ],
  openGraph: {
    title: "Convert Images to PDF - JPG/PNG to PDF Converter Free",
    description:
      "Free online image to PDF converter. Convert multiple images into PDF. 100% client-side, secure and private.",
    url: "https://stitch-pdf.adibprasetiya.com/images-to-pdf",
  },
};

export default function ImagesToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
