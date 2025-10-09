import Container from "@/components/Container";
import Image from "next/image";

export default function DonatePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="page-header" style={{ paddingBottom: "4rem" }}>
        <Container>
          <div
            className="text-center"
            style={{ maxWidth: "800px", margin: "0 auto" }}
          >
            <h1
              className="mb-4"
              style={{ fontSize: "3rem", fontWeight: "800" }}
            >
              Support StitchPDF
            </h1>
            <p
              className="lead"
              style={{
                fontSize: "1.25rem",
                color: "#6c757d",
                lineHeight: "1.8",
              }}
            >
              StitchPDF is a passion project built to help people work with PDFs
              without restrictions.
              <br />
              <strong>100% free, no ads, no tracking, no watermarks.</strong>
            </p>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#6c757d",
                marginTop: "1.5rem",
              }}
            >
              If you find this tool valuable, consider supporting its
              development and hosting costs.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Stats Section */}
            <div className="row g-4 mb-5" style={{ textAlign: "center" }}>
              <div className="col-md-3">
                <div style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      color: "var(--primary-yellow)",
                      margin: "0",
                    }}
                  >
                    100%
                  </h3>
                  <p
                    style={{
                      color: "#6c757d",
                      marginTop: "0.5rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    Free Forever
                  </p>
                </div>
              </div>
              <div className="col-md-3">
                <div style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      color: "var(--primary-yellow)",
                      margin: "0",
                    }}
                  >
                    6+
                  </h3>
                  <p
                    style={{
                      color: "#6c757d",
                      marginTop: "0.5rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    PDF Tools
                  </p>
                </div>
              </div>
              <div className="col-md-3">
                <div style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      color: "var(--primary-yellow)",
                      margin: "0",
                    }}
                  >
                    0
                  </h3>
                  <p
                    style={{
                      color: "#6c757d",
                      marginTop: "0.5rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    Ads or Trackers
                  </p>
                </div>
              </div>
              <div className="col-md-3">
                <div style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      color: "var(--primary-yellow)",
                      margin: "0",
                    }}
                  >
                    🔒
                  </h3>
                  <p
                    style={{
                      color: "#6c757d",
                      marginTop: "0.5rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    Client-Side Only
                  </p>
                </div>
              </div>
            </div>

            {/* Why Support Section */}
            <div
              style={{
                padding: "3rem 0",
                borderTop: "1px solid #e9ecef",
                borderBottom: "1px solid #e9ecef",
                marginBottom: "3rem",
              }}
            >
              <h2
                className="text-center mb-4"
                style={{ fontSize: "2rem", fontWeight: "700" }}
              >
                Why Support Matters
              </h2>
              <div className="row g-4">
                <div className="col-md-6">
                  <div style={{ padding: "1rem" }}>
                    <h5
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                      }}
                    >
                      💰 Cover Hosting Costs
                    </h5>
                    <p
                      style={{
                        color: "#6c757d",
                        fontSize: "0.95rem",
                        lineHeight: "1.7",
                      }}
                    >
                      Running a web application costs money. Domain, hosting,
                      and CDN services need to be maintained.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div style={{ padding: "1rem" }}>
                    <h5
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                      }}
                    >
                      🚀 Enable New Features
                    </h5>
                    <p
                      style={{
                        color: "#6c757d",
                        fontSize: "0.95rem",
                        lineHeight: "1.7",
                      }}
                    >
                      Your support gives me time to add features like PDF
                      compression, digital signatures, and more.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div style={{ padding: "1rem" }}>
                    <h5
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                      }}
                    >
                      🛡️ Stay Ad-Free
                    </h5>
                    <p
                      style={{
                        color: "#6c757d",
                        fontSize: "0.95rem",
                        lineHeight: "1.7",
                      }}
                    >
                      With community support, StitchPDF can remain completely
                      free without resorting to ads or paywalls.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div style={{ padding: "1rem" }}>
                    <h5
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                      }}
                    >
                      ⚡ Faster Updates
                    </h5>
                    <p
                      style={{
                        color: "#6c757d",
                        fontSize: "0.95rem",
                        lineHeight: "1.7",
                      }}
                    >
                      More resources mean faster bug fixes, performance
                      improvements, and feature development.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div
              className="text-center"
              style={{
                padding: "3rem 2rem",
                background: "linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%)",
                borderRadius: "16px",
                marginBottom: "3rem",
              }}
            >
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  marginBottom: "1rem",
                }}
              >
                Support the Project
              </h2>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#6c757d",
                  maxWidth: "600px",
                  margin: "0 auto 2.5rem",
                  lineHeight: "1.7",
                }}
              >
                Every contribution helps keep StitchPDF running and improving.
                <br />
                Choose your preferred platform below.
              </p>

              <div
                className="donate-buttons"
                style={{ marginBottom: "1.5rem" }}
              >
                <a
                  href="https://buymeacoffee.com/abu_ibrahim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="donate-btn donate-btn-coffee"
                  style={{ margin: "0.5rem" }}
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
                  style={{ margin: "0.5rem" }}
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

              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#8d6e63",
                  fontStyle: "italic",
                  margin: "0",
                }}
              >
                Your support, no matter the size, makes a real difference. Thank
                you! 🙏
              </p>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
