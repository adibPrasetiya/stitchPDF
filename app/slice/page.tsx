"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";

export default function SlicePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageRanges, setPageRanges] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "danger">(
    "success"
  );
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const loadPdfFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed!");
      setMessageType("danger");
      return;
    }

    setPdfFile(file);
    setMessage("");

    // Get total pages
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      setTotalPages(pdf.getPageCount());
    } catch (error) {
      console.error(error);
      setMessage("Error reading PDF file.");
      setMessageType("danger");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadPdfFile(file);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await loadPdfFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const parsePageRanges = (input: string): number[][] => {
    const ranges: number[][] = [];
    const parts = input
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p);

    for (const part of parts) {
      const pages: number[] = [];
      const segments = part
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      for (const segment of segments) {
        if (segment.includes("-")) {
          const [start, end] = segment
            .split("-")
            .map((n) => parseInt(n.trim()));
          if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
            throw new Error(`Invalid range: ${segment}`);
          }
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        } else {
          const pageNum = parseInt(segment);
          if (isNaN(pageNum) || pageNum < 1) {
            throw new Error(`Invalid page number: ${segment}`);
          }
          pages.push(pageNum);
        }
      }

      if (pages.length > 0) {
        ranges.push(pages);
      }
    }

    return ranges;
  };

  const handleSlicePdf = async () => {
    if (!pdfFile) {
      setMessage("Please select a PDF file first!");
      setMessageType("danger");
      return;
    }

    if (!pageRanges.trim()) {
      setMessage("Please enter page ranges!");
      setMessageType("danger");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const ranges = parsePageRanges(pageRanges);

      if (ranges.length === 0) {
        setMessage("No valid page ranges found!");
        setMessageType("danger");
        setLoading(false);
        return;
      }

      const pdfBytes = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(pdfBytes);

      // Validate page numbers
      for (const range of ranges) {
        for (const pageNum of range) {
          if (pageNum > sourcePdf.getPageCount()) {
            setMessage(
              `Page ${pageNum} does not exist! PDF has only ${sourcePdf.getPageCount()} pages.`
            );
            setMessageType("danger");
            setLoading(false);
            return;
          }
        }
      }

      // Create sliced PDFs
      const slicedPdfs: Blob[] = [];
      for (let i = 0; i < ranges.length; i++) {
        const newPdf = await PDFDocument.create();
        const pageIndices = ranges[i].map((p) => p - 1); // Convert to 0-indexed

        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        slicedPdfs.push(blob);
      }

      // Download all sliced PDFs
      slicedPdfs.forEach((blob, index) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `sliced-part-${index + 1}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      });

      setMessage(
        `Successfully sliced PDF into ${slicedPdfs.length} file(s) and downloaded!`
      );
      setMessageType("success");

      // Reload page after successful merge
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "An error occurred while slicing PDF.");
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner">
              <div className="spinner-circle"></div>
              <div className="spinner-inner"></div>
            </div>
            <div className="loading-text">Slicing your PDF...</div>
            <div className="loading-subtext">Please wait</div>
            <div className="progress-bar-container">
              <div className="progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <section className="page-header">
        <Container>
          <div className="text-center">
            <h1 className="mb-3">Slice PDF into Parts</h1>
            <p className="lead text-muted">
              Select pages or page ranges and split your PDF into multiple files
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="feature-card">
              {/* Upload Area */}
              <div
                className={`pdf-upload-zone ${
                  isDraggingOver ? "dragging-over" : ""
                } ${pdfFile ? "file-uploaded" : ""}`}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                {!pdfFile ? (
                  <>
                    <div className="upload-icon mb-3">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <h5 className="mb-2">
                      Drag & drop your PDF here{" "}
                      <span className="text-muted">or click to upload</span>
                    </h5>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                      id="pdf-file-input"
                    />
                    <label
                      htmlFor="pdf-file-input"
                      className="btn btn-primary mt-3"
                    >
                      Choose File
                    </label>
                  </>
                ) : (
                  <div className="uploaded-file-display">
                    <div className="uploaded-file-icon mb-3">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                          fill="#4a90e2"
                          fillOpacity="0.15"
                        />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <h5 className="mb-3 text-success">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{ marginRight: "8px", verticalAlign: "middle" }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      File uploaded successfully!
                    </h5>
                    <div className="file-info mb-3">
                      <div className="fw-bold">{pdfFile.name}</div>
                      <div className="text-muted">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {totalPages} {totalPages === 1 ? "page" : "pages"}
                      </div>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        setPdfFile(null);
                        setTotalPages(0);
                        setPageRanges("");
                        setMessage("");
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ marginRight: "6px", verticalAlign: "middle" }}
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Remove File
                    </button>
                  </div>
                )}
              </div>

              {/* Range Input */}
              {pdfFile && (
                <div className="mt-5 mb-4">
                  <label className="form-label fw-bold">Range:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pageRanges}
                    onChange={(e) => setPageRanges(e.target.value)}
                    placeholder="e.g., 1-3; 4-5; 6-10"
                  />
                  <small className="text-muted">
                    Use semicolon (;) to separate into different files.
                    Examples:
                    <br />• <code>1-3; 4-5; 6-10</code> = 3 separate files
                    <br />• <code>1-3,5,7</code> = 1 file with pages 1, 2, 3, 5,
                    7
                  </small>
                </div>
              )}

              {/* Slice Button */}
              {pdfFile && (
                <div className="mt-4">
                  <Button
                    onClick={handleSlicePdf}
                    disabled={loading || !pageRanges.trim()}
                    fullWidth
                  >
                    {loading ? "Slicing PDF..." : "Slice PDF"}
                  </Button>
                </div>
              )}

              {message && <Alert message={message} type={messageType} />}
            </div>

            {/* How to use */}
            <div className="how-to-use-card">
              <div className="how-to-use-header">
                <div className="how-to-use-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <h3 className="how-to-use-title">How to Slice PDF</h3>
              </div>

              <ol className="how-to-steps">
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Upload your PDF file</p>
                    <p className="how-to-step-description">
                      Click &quot;Choose File&quot; button or drag & drop the PDF file you want to slice
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Enter page range</p>
                    <p className="how-to-step-description">
                      Specify which pages you want to slice using the specified format
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">
                      Use semicolon (;) to separate files
                    </p>
                    <p className="how-to-step-description">
                      Each segment separated with ; will become a separate PDF file
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">
                      Click &quot;Slice PDF&quot; and wait for the process to complete
                    </p>
                    <p className="how-to-step-description">
                      All resulting files will automatically download with names &quot;sliced-part-1.pdf&quot;, &quot;sliced-part-2.pdf&quot;, etc.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="how-to-examples">
                <div className="how-to-examples-title">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  Format Examples
                </div>
                <div className="how-to-example-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    <code>1-3; 4-5; 6-10</code> produces 3 files with pages [1-3], [4-5], [6-10]
                  </span>
                </div>
                <div className="how-to-example-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    <code>1-3,5,7</code> produces 1 file with pages 1, 2, 3, 5, 7
                  </span>
                </div>
                <div className="how-to-example-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    <code>1,3,5; 2,4,6</code> produces 2 files with odd and even pages
                  </span>
                </div>
                <div className="how-to-example-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    <code>1-5</code> produces 1 file with pages 1 to 5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
