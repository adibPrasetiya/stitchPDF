import Container from "@/components/Container";
import Image from "next/image";

export default function DonatePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="page-header">
        <Container>
          <div className="text-center">
            <h1 className="mb-3">Support StitchPDF</h1>
            <p className="lead text-muted">
              Help us keep StitchPDF free and ad-free for everyone
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

            {/* Intro Section */}
            <div className="text-center mb-5">
              <p
                className="lead"
                style={{
                  fontSize: "1.1rem",
                  color: "#6c757d",
                  lineHeight: "1.8",
                  maxWidth: "700px",
                  margin: "0 auto",
                }}
              >
                StitchPDF is a passion project built to help people work with
                PDFs without restrictions.
                <br />
                <strong>100% free, no ads, no tracking, no watermarks.</strong>
              </p>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#6c757d",
                  marginTop: "1rem",
                }}
              >
                If you find this tool valuable, consider supporting its
                development and hosting costs.
              </p>
            </div>

            {/* CTA Section */}
            <div
              className="card p-4 mb-4"
              style={{
                background: "linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%)",
                border: "2px solid #ffb74d",
              }}
            >
              <div className="text-center">
                <h3 className="mb-3" style={{ color: "#5d4037" }}>
                  Support StitchPDF
                </h3>
                <p className="mb-4" style={{ color: "#6d4c41" }}>
                  StitchPDF is and will always be{" "}
                  <strong>completely free</strong>. However, if you find this
                  tool helpful and would like to support its development and
                  hosting costs, you can buy me a coffee! ☕
                </p>
                <p className="text-muted mb-4">
                  Your support helps keep this service running and motivates me
                  to add more features!
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
          </div>
        </div>
      </Container>
    </>
  );
}
