import Container from "@/components/Container";
import Image from "next/image";

export default function DonatePage() {
  return (
    <>
      {/* Page Header */}
      <section className="page-header">
        <Container>
          <div className="text-center">
            <h1 className="mb-3">❤️ Support StitchPDF</h1>
            <p className="lead text-muted">
              Love using our free PDF tools? Help us keep them free for
              everyone!
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container>
        <div className="row justify-content-center">
          <div className="col-lg-9">
            {/* Impact Statement */}
            <div
              className="card p-4 mb-4"
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                border: "2px solid #dee2e6",
              }}
            >
              <div className="text-center">
                <h2
                  className="mb-4"
                  style={{ fontSize: "28px", fontWeight: "700" }}
                >
                  You&apos;ve Enjoyed Free PDF Tools. Help Others Do The Same! 🎉
                </h2>
                <p
                  className="mb-0"
                  style={{ fontSize: "18px", color: "#495057" }}
                >
                  StitchPDF has helped you manage your PDFs without paying a
                  cent. With your support, we can keep it that way for everyone.
                </p>
              </div>
            </div>

            <div className="row g-4 mb-4">
              {/* What You Get */}
              <div className="col-md-6">
                <div className="card h-100 p-4">
                  <div className="text-center mb-3">
                    <span style={{ fontSize: "48px" }}>✨</span>
                  </div>
                  <h4 className="text-center mb-3" style={{ color: "#ffc107" }}>
                    What You Already Get
                  </h4>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-3 d-flex align-items-start">
                      <span
                        className="me-2"
                        style={{ color: "#28a745", fontSize: "20px" }}
                      >
                        ✓
                      </span>
                      <span>
                        <strong>100% Free</strong> - No hidden costs, ever
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span
                        className="me-2"
                        style={{ color: "#28a745", fontSize: "20px" }}
                      >
                        ✓
                      </span>
                      <span>
                        <strong>Private & Secure</strong> - Files never leave
                        your device
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span
                        className="me-2"
                        style={{ color: "#28a745", fontSize: "20px" }}
                      >
                        ✓
                      </span>
                      <span>
                        <strong>No Ads</strong> - Clean, distraction-free
                        experience
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span
                        className="me-2"
                        style={{ color: "#28a745", fontSize: "20px" }}
                      >
                        ✓
                      </span>
                      <span>
                        <strong>No Watermarks</strong> - Your PDFs stay pristine
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span
                        className="me-2"
                        style={{ color: "#28a745", fontSize: "20px" }}
                      >
                        ✓
                      </span>
                      <span>
                        <strong>Works Offline</strong> - Use it anywhere,
                        anytime
                      </span>
                    </li>
                    <li className="mb-0 d-flex align-items-start">
                      <span
                        className="me-2"
                        style={{ color: "#28a745", fontSize: "20px" }}
                      >
                        ✓
                      </span>
                      <span>
                        <strong>All Features Unlocked</strong> - No premium
                        tiers
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Your Support Helps */}
              <div className="col-md-6">
                <div
                  className="card h-100 p-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #fff9e6 0%, #fffbea 100%)",
                    border: "2px solid #ffc107",
                  }}
                >
                  <div className="text-center mb-3">
                    <span style={{ fontSize: "48px" }}>🚀</span>
                  </div>
                  <h4 className="text-center mb-3" style={{ color: "#5d4037" }}>
                    Your Support Enables
                  </h4>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-3 d-flex align-items-start">
                      <span className="me-2" style={{ fontSize: "20px" }}>
                        💪
                      </span>
                      <span>
                        <strong>Keep it Free</strong> - For students,
                        professionals, everyone
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span className="me-2" style={{ fontSize: "20px" }}>
                        ⚡
                      </span>
                      <span>
                        <strong>Faster Development</strong> - More time for new
                        features
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span className="me-2" style={{ fontSize: "20px" }}>
                        🛠️
                      </span>
                      <span>
                        <strong>More Tools</strong> - Sign, compress, and more
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span className="me-2" style={{ fontSize: "20px" }}>
                        🌐
                      </span>
                      <span>
                        <strong>Better Infrastructure</strong> - Reliable
                        hosting & performance
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span className="me-2" style={{ fontSize: "20px" }}>
                        🐛
                      </span>
                      <span>
                        <strong>Quick Fixes</strong> - Rapid bug resolution &
                        updates
                      </span>
                    </li>
                    <li className="mb-0 d-flex align-items-start">
                      <span className="me-2" style={{ fontSize: "20px" }}>
                        ❌
                      </span>
                      <span>
                        <strong>Stay Ad-Free</strong> - No need for intrusive
                        monetization
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Donate CTA */}
            <div
              className="card p-5 mb-4"
              style={{
                background: "linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%)",
                border: "3px solid #ffb74d",
                boxShadow: "0 8px 24px rgba(255, 183, 77, 0.3)",
              }}
            >
              <div className="text-center">
                <h2
                  className="mb-4"
                  style={{
                    color: "#5d4037",
                    fontSize: "32px",
                    fontWeight: "700",
                  }}
                >
                  ☕ Buy Me a Coffee
                </h2>
                <p
                  className="mb-4"
                  style={{
                    color: "#6d4c41",
                    fontSize: "18px",
                    maxWidth: "600px",
                    margin: "0 auto 24px",
                  }}
                >
                  Enjoyed merging, slicing, or converting your PDFs? <br />
                  <strong>
                    A coffee helps fuel more late-night coding sessions!
                  </strong>
                </p>
                <div className="donate-buttons mb-4">
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
                <p
                  style={{
                    color: "#8d6e63",
                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  Every contribution, big or small, keeps the servers running
                  and motivation high! 💛
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
