"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import FeatureTitle from "@/components/FeatureTitle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface PageThumbnail {
  pageNumber: number;
  thumbnail: string;
}

export default function RemovePages() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageRangeInput, setPageRangeInput] = useState<string>("");
  const [pagesToRemove, setPagesToRemove] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "danger">(
    "success"
  );
  const [pageThumbnails, setPageThumbnails] = useState<PageThumbnail[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateThumbnail = async (
    file: File,
    pageNum: number
  ): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);

      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) return "";

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      return canvas.toDataURL();
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return "";
    }
  };

  const parsePageRange = (range: string, totalPages: number): number[] => {
    if (!range.trim()) return [];

    const pages = new Set<number>();
    const parts = range.split(",").map((p) => p.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        // Range like "1-3"
        const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
        if (
          !isNaN(start) &&
          !isNaN(end) &&
          start >= 1 &&
          end <= totalPages &&
          start <= end
        ) {
          for (let i = start; i <= end; i++) {
            pages.add(i);
          }
        }
      } else {
        // Single page like "6"
        const page = parseInt(part);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          pages.add(page);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const pagesToRangeString = (pages: number[]): string => {
    if (pages.length === 0) return "";

    const sorted = [...pages].sort((a, b) => a - b);
    const ranges: string[] = [];
    let rangeStart = sorted[0];
    let rangeEnd = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      if (i < sorted.length && sorted[i] === rangeEnd + 1) {
        rangeEnd = sorted[i];
      } else {
        if (rangeStart === rangeEnd) {
          ranges.push(`${rangeStart}`);
        } else if (rangeEnd === rangeStart + 1) {
          ranges.push(`${rangeStart}, ${rangeEnd}`);
        } else {
          ranges.push(`${rangeStart}-${rangeEnd}`);
        }
        if (i < sorted.length) {
          rangeStart = sorted[i];
          rangeEnd = sorted[i];
        }
      }
    }

    return ranges.join(", ");
  };

  const loadPdfFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed!");
      setMessageType("danger");
      return;
    }

    setPdfFile(file);
    setMessage("");
    setLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      setTotalPages(pageCount);

      // No pages selected for removal by default
      setPagesToRemove([]);
      setPageRangeInput("");

      // Generate thumbnails for all pages
      const thumbnails: PageThumbnail[] = [];
      for (let i = 1; i <= pageCount; i++) {
        const thumbnail = await generateThumbnail(file, i);
        thumbnails.push({ pageNumber: i, thumbnail });
      }
      setPageThumbnails(thumbnails);
    } catch (error) {
      console.error(error);
      setMessage("Error reading PDF file.");
      setMessageType("danger");
    } finally {
      setLoading(false);
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

  const handlePageRangeInputChange = (input: string) => {
    setPageRangeInput(input);
    const pages = parsePageRange(input, totalPages);
    setPagesToRemove(pages);
  };

  const handleThumbnailClick = (pageNumber: number) => {
    let newPagesToRemove: number[];

    if (pagesToRemove.includes(pageNumber)) {
      // Deselect page (don't remove it)
      newPagesToRemove = pagesToRemove.filter((p) => p !== pageNumber);
    } else {
      // Select page for removal
      newPagesToRemove = [...pagesToRemove, pageNumber].sort((a, b) => a - b);
    }

    setPagesToRemove(newPagesToRemove);
    setPageRangeInput(pagesToRangeString(newPagesToRemove));
  };

  const removePages = async () => {
    if (!pdfFile) return;

    if (pagesToRemove.length === 0) {
      setMessage("Please select at least one page to remove!");
      setMessageType("danger");
      return;
    }

    if (pagesToRemove.length === totalPages) {
      setMessage("Cannot remove all pages! PDF must have at least one page.");
      setMessageType("danger");
      return;
    }

    setIsProcessing(true);
    setMessage("");

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Remove pages in reverse order to maintain correct indices
      const sortedPagesToRemove = [...pagesToRemove].sort((a, b) => b - a);
      for (const pageNum of sortedPagesToRemove) {
        // pdf-lib uses 0-based indexing
        pdfDoc.removePage(pageNum - 1);
      }

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const pdfArrayBuffer = modifiedPdfBytes.buffer.slice(
        modifiedPdfBytes.byteOffset,
        modifiedPdfBytes.byteOffset + modifiedPdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Download the modified PDF
      const link = document.createElement("a");
      link.href = url;
      link.download = `${pdfFile.name.replace(".pdf", "")}_removed_pages.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      const remainingPages = totalPages - pagesToRemove.length;
      setMessage(
        `Successfully removed ${pagesToRemove.length} page(s)! New PDF has ${remainingPages} page(s).`
      );
      setMessageType("success");

      // Auto reload after 1.5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error removing pages from PDF:", error);
      setMessage(
        error instanceof Error ? error.message : "Failed to remove pages from PDF"
      );
      setMessageType("danger");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setTotalPages(0);
    setPageRangeInput("");
    setPagesToRemove([]);
    setPageThumbnails([]);
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const remainingPages = totalPages - pagesToRemove.length;

  return (
    <>
      {/* Loading Overlay */}
      {(isProcessing || loading) && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner">
              <div className="spinner-circle"></div>
              <div className="spinner-inner"></div>
            </div>
            <div className="loading-text">
              {loading ? "Loading PDF..." : "Removing Pages..."}
            </div>
            <div className="loading-subtext">Please wait</div>
            <div className="progress-bar-container">
              <div className="progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Container>
        {!pdfFile && (
          <FeatureTitle
            title="Remove Pages"
            description="Delete unwanted pages from your PDF document"
          />
        )}

        {!pdfFile ? (
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="feature-card">
                {/* Upload Area */}
                <div
                  className={`pdf-upload-zone ${
                    isDraggingOver ? "dragging-over" : ""
                  }`}
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                >
                  <div className="upload-icon mb-3">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h5 className="mb-2">Drag & drop your PDF here</h5>
                  <p className="text-muted mb-3">or</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="pdf-file-input"
                  />
                  <label htmlFor="pdf-file-input" className="btn btn-primary">
                    Choose File
                  </label>
                </div>

                {message && <Alert message={message} type={messageType} />}
              </div>
            </div>
          </div>
        ) : (
          <div className="row">
            {/* Left: Canvas with Thumbnails */}
            <div className="col-lg-8">
              {/* Thumbnails Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: "20px",
                }}
              >
                {pageThumbnails.map((page) => {
                  const isMarkedForRemoval = pagesToRemove.includes(page.pageNumber);

                  return (
                    <div
                      key={page.pageNumber}
                      onClick={() => handleThumbnailClick(page.pageNumber)}
                      style={{
                        background: "#fff",
                        border: isMarkedForRemoval
                          ? "3px solid #dc3545"
                          : "2px solid #e9ecef",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: isMarkedForRemoval
                          ? "0 4px 12px rgba(220, 53, 69, 0.3)"
                          : "0 2px 8px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        position: "relative",
                        opacity: isMarkedForRemoval ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isMarkedForRemoval) {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 16px rgba(0,0,0,0.15)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMarkedForRemoval) {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 2px 8px rgba(0,0,0,0.1)";
                        }
                      }}
                    >
                      {/* Delete Indicator */}
                      {isMarkedForRemoval && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "#dc3545",
                            color: "#fff",
                            borderRadius: "50%",
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(220, 53, 69, 0.4)",
                            zIndex: 2,
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} size="sm" />
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div
                        style={{
                          width: "100%",
                          height: "200px",
                          background: "#f8f9fa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        {page.thumbnail ? (
                          <img
                            src={page.thumbnail}
                            alt={`Page ${page.pageNumber}`}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <svg
                            width="50"
                            height="50"
                            viewBox="0 0 24 24"
                            fill="#4a90e2"
                            stroke="currentColor"
                            strokeWidth="1"
                          >
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )}
                      </div>

                      {/* Page Number */}
                      <div
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          background: isMarkedForRemoval ? "#dc3545" : "#fff",
                          color: isMarkedForRemoval ? "#fff" : "#212529",
                          fontWeight: "600",
                          fontSize: "14px",
                          borderTop: isMarkedForRemoval
                            ? "none"
                            : "1px solid #e9ecef",
                        }}
                      >
                        Page {page.pageNumber}
                        {isMarkedForRemoval && (
                          <div style={{ fontSize: "11px", marginTop: "2px" }}>
                            Will be removed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Sticky Sidebar with Controls */}
            <div className="col-lg-4">
              <div
                style={{
                  position: "sticky",
                  top: "24px",
                }}
              >
                {/* Controls Card */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "24px",
                    marginBottom: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* PDF Info */}
                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: "10px",
                      padding: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#212529",
                        marginBottom: "8px",
                        wordBreak: "break-word",
                      }}
                    >
                      {pdfFile.name}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6c757d",
                      }}
                    >
                      Total: {totalPages} {totalPages === 1 ? "page" : "pages"}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#dc3545",
                        fontWeight: "600",
                        marginTop: "4px",
                      }}
                    >
                      To Remove: {pagesToRemove.length}{" "}
                      {pagesToRemove.length === 1 ? "page" : "pages"}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#28a745",
                        fontWeight: "600",
                        marginTop: "4px",
                      }}
                    >
                      Remaining: {remainingPages}{" "}
                      {remainingPages === 1 ? "page" : "pages"}
                    </div>
                    <button
                      onClick={handleReset}
                      style={{
                        marginTop: "12px",
                        padding: "6px 12px",
                        border: "1px solid #dc3545",
                        borderRadius: "6px",
                        background: "transparent",
                        color: "#dc3545",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#dc3545";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#dc3545";
                      }}
                    >
                      Remove File
                    </button>
                  </div>

                  {/* Page Range Input */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#212529",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Pages to Remove
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 1-3, 6, 8"
                      value={pageRangeInput}
                      onChange={(e) => handlePageRangeInputChange(e.target.value)}
                      style={{
                        fontSize: "14px",
                        padding: "10px 14px",
                      }}
                    />
                    <small
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        display: "block",
                        marginTop: "6px",
                      }}
                    >
                      Enter ranges (1-3) or individual pages (6, 8). Click
                      thumbnails to select/deselect.
                    </small>
                  </div>

                  {/* Remove Button */}
                  <Button
                    onClick={removePages}
                    disabled={
                      isProcessing ||
                      pagesToRemove.length === 0 ||
                      pagesToRemove.length === totalPages
                    }
                    fullWidth
                  >
                    <FontAwesomeIcon
                      icon={faTrash}
                      style={{ marginRight: "8px" }}
                    />
                    {isProcessing
                      ? "Removing..."
                      : `Remove ${pagesToRemove.length} ${
                          pagesToRemove.length === 1 ? "Page" : "Pages"
                        }`}
                  </Button>

                  {pagesToRemove.length === totalPages && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px",
                        background: "#fff3cd",
                        border: "1px solid #ffc107",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#856404",
                      }}
                    >
                      ⚠️ Cannot remove all pages. PDF must have at least one
                      page.
                    </div>
                  )}
                </div>

                {message && (
                  <div style={{ marginTop: "16px" }}>
                    <Alert message={message} type={messageType} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
