"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <Link
          href="/"
          className="navbar-brand fw-bold d-flex align-items-center"
        >
          <Image
            src="/assets/images/stitchPDF-logo.png"
            alt="StitchPDF Logo"
            width={32}
            height={32}
            className="me-2"
          />
          <span style={{ color: "#ffc107" }}>StitchPDF</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {/* Emphasized Menu Items */}
            <li className="nav-item">
              <Link
                href="/merge"
                className="nav-link"
                style={{
                  color: "#dc3545",
                  fontWeight: "600",
                  fontSize: "16px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#bb2d3b";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#dc3545";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Merge PDF
              </Link>
            </li>

            <li className="nav-item">
              <Link
                href="/slice"
                className="nav-link"
                style={{
                  color: "#dc3545",
                  fontWeight: "600",
                  fontSize: "16px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#bb2d3b";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#dc3545";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Slice PDF
              </Link>
            </li>

            <li
              className="nav-item dropdown"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                aria-expanded={showDropdown}
              >
                More Features
              </a>
              <ul className={`dropdown-menu ${showDropdown ? "show" : ""}`}>
                <li>
                  <Link href="/insert" className="dropdown-item">
                    Insert PDF
                  </Link>
                </li>
                <li>
                  <Link href="/stamp" className="dropdown-item">
                    Stamp PDF
                  </Link>
                </li>
                <li>
                  <Link href="/add-text" className="dropdown-item">
                    Add Text
                  </Link>
                </li>
                <li>
                  <Link href="/images-to-pdf" className="dropdown-item">
                    Images to PDF
                  </Link>
                </li>
                <li>
                  <Link href="/pdf-to-images" className="dropdown-item">
                    PDF to Images
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item">
              <Link href="/about" className="nav-link">
                About
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/contribute" className="nav-link donate-nav-btn">
                ☕ Support Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
