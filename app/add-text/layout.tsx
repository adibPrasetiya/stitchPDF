import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Text to PDF - PDF Text Editor Online Free | StitchPDF",
  description:
    "Free online PDF text editor. Add custom text boxes, annotations, and labels to your PDF documents. 100% client-side processing, secure and private.",
  keywords: [
    "add text to PDF",
    "PDF text editor",
    "edit PDF text",
    "PDF annotation",
    "add text box to PDF",
    "write on PDF",
    "PDF editor online",
  ],
  openGraph: {
    title: "Add Text to PDF - PDF Text Editor Online Free",
    description:
      "Free online PDF text editor. Add customizable text to your PDFs. 100% client-side, secure and private.",
    url: "https://stitch-pdf.adibprasetiya.com/add-text",
  },
};

export default function AddTextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
