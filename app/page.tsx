import Image from "next/image";
import Container from "@/components/Container";
import ToolCard from "@/components/ToolCard";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "StitchPDF",
    alternateName: "Stitch PDF",
    url: "https://stitch-pdf.adibprasetiya.com",
    description:
      "100% Free PDF tools that run entirely in your browser. Merge, split, edit, and manage PDF files with complete privacy.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Merge PDF files",
      "Split PDF files",
      "Convert PDF to images",
      "Convert images to PDF",
      "Add text to PDF",
      "Stamp PDF",
      "Insert pages to PDF",
      "Remove pages from PDF",
    ],
    screenshot:
      "https://stitch-pdf.adibprasetiya.com/assets/images/stitchPDF-logo.png",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "100",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="hero-section">
        <Container className="text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h1 className="hero-title mb-4">
                <span className="text-primary-yellow">Free</span> All-in-One{" "}
                <br />
                <span className="text-primary-yellow">Client-Side</span> PDF
                Editor
              </h1>
              <p className="hero-description mb-5">
                StitchPDF is a completely <strong>free PDF tool</strong> that
                runs <strong>100% in your browser</strong>. No server uploads,
                all processing happens on your device using{" "}
                <strong>client-side rendering</strong>. Your privacy is
                protected, free forever, no watermarks, and works offline!
              </p>

              <a href="#donate" className="btn btn-outline-dark btn-lg mb-3">
                Support Us
              </a>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="mt-5">
            <div className="tools-grid">
              {/* Merge PDFs */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dc3545"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                }
                title="Merge PDFs"
                description="Combine multiple PDF files into one document"
                href="/merge"
                iconBgColor="#ffe8eb"
              />

              {/* Slice PDF */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dc3545"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="16" y2="17" />
                  </svg>
                }
                title="Slice PDF"
                description="Split PDF into multiple parts as needed"
                href="/slice"
                iconBgColor="#ffe8eb"
              />

              {/* PDF to Images */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dc3545"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                }
                title="PDF to Images"
                description="Convert each PDF page into separate images"
                iconBgColor="#ffe8eb"
                href="/pdf-to-images"
              />

              {/* Images to PDF */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4285f4"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <rect x="8" y="12" width="8" height="6" />
                  </svg>
                }
                title="Images to PDF"
                description="Convert images into PDF documents easily"
                iconBgColor="#e3f2fd"
                href="/images-to-pdf"
              />

              {/* Stamp PDF */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff5722"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <circle cx="12" cy="15" r="3" />
                    <path d="M12 12v3" />
                  </svg>
                }
                title="Stamp PDF"
                description="Add stamps or watermarks to your PDF"
                iconBgColor="#fbe9e7"
                href="/stamp"
              />

              {/* Add Text to PDF */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#673ab7"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                }
                title="Add Text"
                description="Add customizable text boxes to your PDF"
                iconBgColor="#ede7f6"
                href="/add-text"
              />

              {/* Remove Pages */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f57c00"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="12" y1="10" x2="12" y2="16" />
                  </svg>
                }
                title="Remove Pages"
                description="Delete unwanted pages from your PDF"
                iconBgColor="#fff3e0"
                href="/remove-pages"
              />

              {/* Insert to PDF */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4caf50"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                }
                title="Insert to PDF"
                description="Insert new pages into PDF documents"
                iconBgColor="#e8f5e9"
                href="/insert"
              />

              {/* Fill PDF Form */}
              <ToolCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9c27b0"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <rect x="8" y="12" width="8" height="2" />
                    <rect x="8" y="16" width="8" height="2" />
                  </svg>
                }
                title="Fill PDF Form"
                description="Fill PDF forms easily online"
                iconBgColor="#f3e5f5"
                comingSoon
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Donate Section */}
      <section
        id="donate"
        style={{
          background:
            "linear-gradient(135deg, var(--primary-yellow) 0%, var(--primary-yellow-dark) 100%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "80px 0",
        }}
      >
        <Container>
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="mb-3" style={{ color: "#000", fontWeight: "700" }}>
                Support StitchPDF
              </h2>
              <p className="mb-4" style={{ color: "#333", fontSize: "18px" }}>
                StitchPDF is and will always be <strong>completely free</strong>
                . However, if you find this tool helpful and would like to
                support its development and hosting costs, you can buy me a
                coffee! ☕
              </p>
              <p className="mb-4" style={{ color: "#333" }}>
                Your support helps keep this service running and motivates me to
                add more features!
              </p>
              <div className="donate-buttons">
                <a
                  href="https://buymeacoffee.com/abu_ibrahim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="donate-btn donate-btn-coffee"
                >
                  <Image
                    src="/assets/images/coffee.png"
                    alt="Coffee"
                    width={24}
                    height={24}
                    style={{ objectFit: "contain" }}
                  />
                  Buy Me a Coffee
                </a>
                <a
                  href="https://trakteer.id/abu_ibrahim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="donate-btn donate-btn-trakteer"
                >
                  <Image
                    src="/assets/images/paw.png"
                    alt="Trakteer"
                    width={24}
                    height={24}
                    style={{ objectFit: "contain" }}
                  />
                  Trakteer
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
