"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import FeatureTitle from "@/components/FeatureTitle";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ImageFormat {
  value: string;
  label: string;
  mimeType: string;
  extension: string;
}

interface PageThumbnail {
  pageNumber: number;
  thumbnail: string;
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
  const [pageRangeInput, setPageRangeInput] = useState<string>("");
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
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

      // Set all pages as selected by default
      const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
      setSelectedPages(allPages);
      setPageRangeInput(`1-${pageCount}`);

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
    setSelectedPages(pages);
  };

  const handleThumbnailClick = (pageNumber: number) => {
    let newSelectedPages: number[];

    if (selectedPages.includes(pageNumber)) {
      // Deselect page
      newSelectedPages = selectedPages.filter((p) => p !== pageNumber);
    } else {
      // Select page
      newSelectedPages = [...selectedPages, pageNumber].sort((a, b) => a - b);
    }

    setSelectedPages(newSelectedPages);
    setPageRangeInput(pagesToRangeString(newSelectedPages));
  };

  const convertPdfToImages = async () => {
    if (!pdfFile) return;

    if (selectedPages.length === 0) {
      setMessage("Please select at least one page to convert!");
      setMessageType("danger");
      return;
    }

    setIsProcessing(true);
    setMessage("");

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const format = IMAGE_FORMATS.find((f) => f.value === selectedFormat);
      if (!format) throw new Error("Invalid format selected");

      // Convert each selected page to image
      for (const pageNum of selectedPages) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 }); // 2x scale for better quality

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not get canvas context");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

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
        `Successfully converted ${selectedPages.length} page(s) to ${format.label} images!`
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
    setPageRangeInput("");
    setSelectedPages([]);
    setPageThumbnails([]);
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
              {loading ? "Loading PDF..." : "Converting PDF to Images..."}
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
            title="PDF to Images"
            description="Convert PDF pages into high-quality images in PNG, JPG, or JPEG format"
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
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
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
                  const isSelected = selectedPages.includes(page.pageNumber);

                  return (
                    <div
                      key={page.pageNumber}
                      onClick={() => handleThumbnailClick(page.pageNumber)}
                      style={{
                        background: "#fff",
                        border: isSelected
                          ? "3px solid #dc3545"
                          : "2px solid #e9ecef",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: isSelected
                          ? "0 4px 12px rgba(220, 53, 69, 0.3)"
                          : "0 2px 8px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 16px rgba(0,0,0,0.15)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 2px 8px rgba(0,0,0,0.1)";
                        }
                      }}
                    >
                      {/* Selected Indicator */}
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "#dc3545",
                            color: "#fff",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(220, 53, 69, 0.4)",
                            zIndex: 2,
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
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
                          background: isSelected ? "#dc3545" : "#fff",
                          color: isSelected ? "#fff" : "#212529",
                          fontWeight: "600",
                          fontSize: "14px",
                          borderTop: isSelected
                            ? "none"
                            : "1px solid #e9ecef",
                        }}
                      >
                        Page {page.pageNumber}
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
                      Selected: {selectedPages.length}{" "}
                      {selectedPages.length === 1 ? "page" : "pages"}
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
                      Select Pages
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

                  {/* Format Selection */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#212529",
                        marginBottom: "12px",
                        display: "block",
                      }}
                    >
                      Output Format
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "10px",
                      }}
                    >
                      {IMAGE_FORMATS.map((format) => (
                        <button
                          key={format.value}
                          type="button"
                          onClick={() => setSelectedFormat(format.value)}
                          style={{
                            padding: "12px 8px",
                            border:
                              selectedFormat === format.value
                                ? "2px solid #dc3545"
                                : "2px solid #e9ecef",
                            borderRadius: "8px",
                            background:
                              selectedFormat === format.value
                                ? "#fff5f5"
                                : "#fff",
                            color:
                              selectedFormat === format.value
                                ? "#dc3545"
                                : "#6c757d",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedFormat !== format.value) {
                              e.currentTarget.style.borderColor = "#adb5bd";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedFormat !== format.value) {
                              e.currentTarget.style.borderColor = "#e9ecef";
                            }
                          }}
                        >
                          {format.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Convert Button */}
                  <Button
                    onClick={convertPdfToImages}
                    disabled={isProcessing || selectedPages.length === 0}
                    fullWidth
                  >
                    {isProcessing
                      ? "Converting..."
                      : `Convert ${selectedPages.length} ${
                          selectedPages.length === 1 ? "Page" : "Pages"
                        }`}
                  </Button>
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
