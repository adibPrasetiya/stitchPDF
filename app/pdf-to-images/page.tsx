"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ImageFormat {
  value: string;
  label: string;
  mimeType: string;
  extension: string;
}

const IMAGE_FORMATS: ImageFormat[] = [
  { value: "png", label: "PNG", mimeType: "image/png", extension: "png" },
  { value: "jpg", label: "JPG", mimeType: "image/jpeg", extension: "jpg" },
  { value: "jpeg", label: "JPEG", mimeType: "image/jpeg", extension: "jpeg" },
];

export default function PdfToImages() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedFormat, setSelectedFormat] = useState<string>("png");
  const [pageRange, setPageRange] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "danger">(
    "success"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setPageRange(`1-${pdf.numPages}`); // Set default range to all pages
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

  const parsePageRange = (range: string, totalPages: number): number[] => {
    const pages = new Set<number>();
    const parts = range.split(",").map((p) => p.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        // Range like "7-10"
        const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
        if (
          isNaN(start) ||
          isNaN(end) ||
          start < 1 ||
          end > totalPages ||
          start > end
        ) {
          throw new Error(`Invalid range: ${part}`);
        }
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      } else {
        // Single page like "1", "3", "5"
        const page = parseInt(part);
        if (isNaN(page) || page < 1 || page > totalPages) {
          throw new Error(`Invalid page number: ${part}`);
        }
        pages.add(page);
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const convertPdfToImages = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setMessage("");

    try {
      // Parse page range
      let pagesToConvert: number[];
      try {
        pagesToConvert = parsePageRange(pageRange, totalPages);
      } catch (error) {
        throw new Error(
          `Error parsing page range: ${(error as Error).message}`
        );
      }

      if (pagesToConvert.length === 0) {
        throw new Error("No valid pages to convert");
      }

      // Load PDF
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Get selected format
      const format = IMAGE_FORMATS.find((f) => f.value === selectedFormat);
      if (!format) throw new Error("Invalid format selected");

      // Convert each page to image
      for (const pageNum of pagesToConvert) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 }); // 2x scale for better quality

        // Create canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not get canvas context");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create blob"));
            },
            format.mimeType,
            0.95 // Quality for JPEG
          );
        });

        // Download image
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${pdfFile.name.replace(".pdf", "")}_page_${pageNum}.${
          format.extension
        }`;
        link.click();
        URL.revokeObjectURL(url);

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setMessage(
        `Successfully converted ${pagesToConvert.length} page(s) to ${format.label} images!`
      );
      setMessageType("success");

      // Auto reload after 1.5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to convert PDF to images"
      );
      setMessageType("danger");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setTotalPages(0);
    setPageRange("");
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner">
              <div className="spinner-circle"></div>
              <div className="spinner-inner"></div>
            </div>
            <div className="loading-text">Converting PDF to Images...</div>
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
            <h1 className="mb-3">PDF to Images</h1>
            <p className="lead text-muted">
              Convert your PDF pages to high-quality images in your preferred
              format
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
                      ref={fileInputRef}
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
                      onClick={handleReset}
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

              {pdfFile && (
                <>
                  {/* Format Selection */}
                  <div className="mt-5 mb-4">
                    <label className="form-label fw-bold">Output Format:</label>
                    <div className="format-selection-grid">
                      {IMAGE_FORMATS.map((format) => (
                        <button
                          key={format.value}
                          type="button"
                          className={`format-option ${
                            selectedFormat === format.value ? "active" : ""
                          }`}
                          onClick={() => setSelectedFormat(format.value)}
                        >
                          <div className="format-icon">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                          <div className="format-label">{format.label}</div>
                          {selectedFormat === format.value && (
                            <div className="format-checkmark">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Range Input */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">
                      Page Range (Total: {totalPages} pages)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 1,3,5,7-10 or 1-5"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                    />
                    <small className="text-muted">
                      Enter page numbers separated by commas, or use hyphens for
                      ranges. Example: &quot;1,3,5,7-10&quot; will convert pages 1, 3, 5,
                      7, 8, 9, and 10.
                    </small>
                  </div>

                  {/* Convert Button */}
                  <div className="mt-4">
                    <Button
                      onClick={convertPdfToImages}
                      disabled={isProcessing || !pageRange.trim()}
                      fullWidth
                    >
                      {isProcessing ? "Converting..." : "Convert to Images"}
                    </Button>
                  </div>
                </>
              )}

              {message && <Alert message={message} type={messageType} />}
            </div>

            {/* How to Use Section */}
            <div className="how-to-use-card">
              <div className="how-to-use-header">
                <div className="how-to-use-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <h3 className="how-to-use-title">
                  How to Convert PDF to Images
                </h3>
              </div>

              <ol className="how-to-steps">
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Upload PDF File</p>
                    <p className="how-to-step-description">
                      Click the upload area or drag and drop your PDF file
                    </p>
                  </div>
                </li>

                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Select Format</p>
                    <p className="how-to-step-description">
                      Choose your preferred image format (PNG, JPG, or JPEG)
                    </p>
                  </div>
                </li>

                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Specify Pages</p>
                    <p className="how-to-step-description">
                      Enter the page numbers you want to convert (e.g.,
                      1,3,5,7-10)
                    </p>
                  </div>
                </li>

                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Convert & Download</p>
                    <p className="how-to-step-description">
                      Click convert and your images will be downloaded
                      automatically
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
                  Example Formats
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
                    <code>1,3,5</code> converts pages 1, 3, and 5
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
                    <code>7-10</code> converts pages 7, 8, 9, and 10
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
                    <code>1,3,5,7-10</code> converts pages 1, 3, 5, 7, 8, 9, and
                    10
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
                    <code>1-5</code> converts all pages from 1 to 5
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
