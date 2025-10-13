import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert PDF to Images - PDF to JPG/PNG Converter Free | StitchPDF",
  description:
    "Free online PDF to image converter. Convert each PDF page into separate images (JPG, PNG). 100% client-side processing, no uploads, secure and private.",
  keywords: [
    "PDF to image",
    "PDF to JPG",
    "PDF to PNG",
    "convert PDF to images",
    "PDF image converter",
    "PDF to picture",
    "extract images from PDF",
  ],
  openGraph: {
    title: "Convert PDF to Images - PDF to JPG/PNG Converter Free",
    description:
      "Free online PDF to image converter. Convert PDF pages to images. 100% client-side, secure and private.",
    url: "https://stitch-pdf.adibprasetiya.com/pdf-to-images",
  },
};

export default function PdfToImagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
