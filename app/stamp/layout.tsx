import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Stamp to PDF - PDF Watermark Tool Free | StitchPDF",
  description:
    "Free online PDF stamp tool. Add watermarks, stamps, or images to your PDF documents. 100% client-side processing, secure and private. No uploads required.",
  keywords: [
    "PDF stamp",
    "PDF watermark",
    "add stamp to PDF",
    "watermark PDF",
    "PDF stamp tool",
    "add watermark to PDF",
    "stamp PDF online",
  ],
  openGraph: {
    title: "Add Stamp to PDF - PDF Watermark Tool Free",
    description:
      "Free online PDF stamp tool. Add watermarks or stamps to PDF. 100% client-side, secure and private.",
    url: "https://stitch-pdf.adibprasetiya.com/stamp",
  },
};

export default function StampLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
