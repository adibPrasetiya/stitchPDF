import Container from "@/components/Container";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      {/* Page Header */}
      <section className="page-header">
        <Container>
          <div className="text-center">
            <h1 className="mb-3">About StitchPDF</h1>
            <p className="lead text-muted">
              Fast, easy, and free PDF tools for everyone
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Our Story */}
            <div className="card p-4 mb-4">
              <h3 className="mb-4">Our Story</h3>
              <p className="mb-3">
                StitchPDF was born out of a personal need. As someone who
                frequently works with PDF files, I found myself constantly
                looking for simple, reliable tools to merge, split, and manage
                my documents. Instead of relying on multiple online services
                with limitations, I decided to create my own solution.
              </p>
              <p className="mb-3">
                This platform was built to make my daily work easier—and now,
                I&apos;m hosting it online with the hope that it can help others
                facing the same challenges. Whether you&apos;re a student,
                professional, or anyone who deals with PDFs, StitchPDF is here
                to simplify your workflow.
              </p>
              <p className="mb-3">
                <strong>Best of all, it&apos;s completely free to use.</strong> No
                hidden fees, no subscriptions, no watermarks. Just
                straightforward PDF tools that work.
              </p>
              <p className="mb-0">
                What makes StitchPDF special is that{" "}
                <strong>everything runs 100% in your browser</strong> 🔒. Your
                files never leave your device—there&apos;s no upload to servers, no
                backend processing, and we don&apos;t store or collect any of your
                documents. All the magic happens right on your computer using
                client-side rendering, which means your privacy is completely
                protected. Once the page loads, you can even use it offline!
              </p>
            </div>

            {/* Support Section */}
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

            {/* Thank You */}
            <div className="text-center py-4">
              <p className="text-muted mb-2">
                Thank you for using StitchPDF! 🙏
              </p>
              <p className="text-muted small">
                Love StitchPDF? Consider supporting us via the{" "}
                <Link href="/contribute" className="text-primary">
                  Donate
                </Link>{" "}
                page.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
