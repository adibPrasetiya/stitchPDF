import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StitchPDF - Free All-in-One Client-Side PDF Editor",
    short_name: "StitchPDF",
    description:
      "100% Free PDF tools that run entirely in your browser. Merge, split, edit, and manage PDF files with complete privacy.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffc107",
    icons: [
      {
        src: "/assets/images/stitchPDF-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/images/stitchPDF-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["productivity", "utilities"],
    orientation: "portrait-primary",
  };
}
