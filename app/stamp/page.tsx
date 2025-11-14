"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import FeatureTitle from "@/components/FeatureTitle";

interface StampPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  id: string;
}

export default function StampPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [stampImage, setStampImage] = useState<File | null>(null);
  const [stampImageUrl, setStampImageUrl] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stampPositions, setStampPositions] = useState<StampPosition[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stampSize, setStampSize] = useState({ width: 120, height: 120 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "danger">(
    "success"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [draggingStamp, setDraggingStamp] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingStamp, setResizingStamp] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      setMessage("Please select a valid PDF file!");
      setMessageType("danger");
      return;
    }
    setPdfFile(file);
    setMessage("");
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setMessage("Please select a valid image file!");
      setMessageType("danger");
      return;
    }
    setStampImage(file);
    const url = URL.createObjectURL(file);
    setStampImageUrl(url);
    setMessage("");
  };

  const loadPdf = async () => {
    if (!pdfFile) return;

    setLoading(true);
    try {
      // Load PDF.js
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(0);
      setShowPreview(true);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessage("Error loading PDF. Please try again.");
      setMessageType("danger");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pdfFile && stampImage && !showPreview) {
      loadPdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfFile, stampImage]);

  useEffect(() => {
    if (pdfDoc && showPreview) {
      renderPage(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, showPreview]);

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(pageNum + 1);
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Calculate scale to fit container
    const containerWidth = containerRef.current?.clientWidth || 600;
    const viewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / viewport.width;
    setCanvasScale(scale);

    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    await page.render(renderContext).promise;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!stampImage || draggingStamp) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStamp: StampPosition = {
      id: `stamp-${Date.now()}-${Math.random()}`,
      x: x - stampSize.width / 2,
      y: y - stampSize.height / 2,
      width: stampSize.width,
      height: stampSize.height,
      pageIndex: currentPage,
    };

    setStampPositions([...stampPositions, newStamp]);
  };

  const removeStamp = (id: string) => {
    setStampPositions(stampPositions.filter((s) => s.id !== id));
  };

  const handleStampMouseDown = (e: React.MouseEvent, stamp: StampPosition) => {
    e.stopPropagation();
    setDraggingStamp(stamp.id);

    const stampElement = e.currentTarget as HTMLElement;
    const rect = stampElement.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Handle resize
    if (resizingStamp) {
      const deltaX = mouseX - resizeStart.x;
      const deltaY = mouseY - resizeStart.y;

      // Calculate new size maintaining aspect ratio
      const aspectRatio = resizeStart.width / resizeStart.height;
      const delta = Math.max(deltaX, deltaY);
      const newWidth = Math.max(30, resizeStart.width + delta);
      const newHeight = newWidth / aspectRatio;

      setStampPositions(
        stampPositions.map((stamp) =>
          stamp.id === resizingStamp
            ? { ...stamp, width: newWidth, height: newHeight }
            : stamp
        )
      );
      return;
    }

    // Handle drag
    if (draggingStamp) {
      const x = mouseX - dragOffset.x;
      const y = mouseY - dragOffset.y;

      setStampPositions(
        stampPositions.map((stamp) =>
          stamp.id === draggingStamp ? { ...stamp, x, y } : stamp
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingStamp(null);
    setResizingStamp(null);
  };

  const handleResizeStart = (e: React.MouseEvent, stamp: StampPosition) => {
    e.stopPropagation();
    setResizingStamp(stamp.id);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setResizeStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: stamp.width,
      height: stamp.height,
    });
  };

  const convertImageToPng = async (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to convert image"));
            return;
          }
          blob.arrayBuffer().then(resolve).catch(reject);
        }, "image/png");
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  };

  const handleApplyStamps = async () => {
    if (!pdfFile || !stampImage || stampPositions.length === 0) {
      setMessage("Please add at least one stamp to the PDF!");
      setMessageType("danger");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDocument = await PDFDocument.load(pdfBytes);

      // Convert image to PNG for better compatibility
      let stampImg;
      try {
        const pngBytes = await convertImageToPng(stampImage);
        stampImg = await pdfDocument.embedPng(pngBytes);
      } catch (_embedError) {
        console.error(
          "PNG conversion failed, trying direct embed:",
          _embedError
        );
        // Fallback: try direct embed
        const imageBytes = await stampImage.arrayBuffer();
        const isPng =
          stampImage.type === "image/png" ||
          stampImage.name.toLowerCase().endsWith(".png");

        try {
          if (isPng) {
            stampImg = await pdfDocument.embedPng(imageBytes);
          } else {
            stampImg = await pdfDocument.embedJpg(imageBytes);
          }
        } catch (_embedError2) {
          // Last resort: try opposite format
          if (isPng) {
            stampImg = await pdfDocument.embedJpg(imageBytes);
          } else {
            stampImg = await pdfDocument.embedPng(imageBytes);
          }
        }
      }

      // Apply stamps to pages
      stampPositions.forEach((stamp) => {
        const page = pdfDocument.getPage(stamp.pageIndex);
        const { height: pageHeight } = page.getSize();

        // Convert canvas coordinates to PDF coordinates
        const pdfX = stamp.x / canvasScale;
        const pdfY =
          pageHeight - stamp.y / canvasScale - stamp.height / canvasScale;
        const pdfWidth = stamp.width / canvasScale;
        const pdfHeight = stamp.height / canvasScale;

        page.drawImage(stampImg, {
          x: pdfX,
          y: pdfY,
          width: pdfWidth,
          height: pdfHeight,
        });
      });

      // Save and download
      const stampedPdfBytes = await pdfDocument.save();
      const arrayBuffer = stampedPdfBytes.buffer.slice(
        stampedPdfBytes.byteOffset,
        stampedPdfBytes.byteOffset + stampedPdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "stamped.pdf";
      link.click();

      setMessage(
        `Success! PDF with ${stampPositions.length} stamp(s) has been downloaded.`
      );
      setMessageType("success");

      // Reload page after successful stamp
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Error applying stamps to PDF."
      );
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setPdfFile(null);
    setStampImage(null);
    setStampImageUrl("");
    setShowPreview(false);
    setPdfDoc(null);
    setCurrentPage(0);
    setTotalPages(0);
    setStampPositions([]);
    setMessage("");
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
            <div className="loading-text">
              {showPreview ? "Applying stamps..." : "Loading PDF..."}
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
        {!showPreview && (
          <FeatureTitle
            title="Stamp PDF"
            description="Add watermarks or stamps to your PDF documents"
          />
        )}

        <div className="row justify-content-center">
          <div className="col-lg-10">
            {!showPreview ? (
              <div className="feature-card">
                {/* Upload Forms - Side by Side */}
                <div className="row g-3 mb-4">
                  {/* PDF Upload */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold mb-2">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ marginRight: "6px", verticalAlign: "middle" }}
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      PDF Document
                    </label>
                    <div
                      className={`pdf-upload-zone ${
                        pdfFile ? "file-uploaded" : ""
                      }`}
                    >
                      {!pdfFile ? (
                        <>
                          <div className="upload-icon mb-2">
                            <svg
                              width="50"
                              height="50"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <h6 className="mb-2">Upload PDF</h6>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            style={{ display: "none" }}
                            id="pdf-input"
                          />
                          <label
                            htmlFor="pdf-input"
                            className="btn btn-primary btn-sm mt-2"
                          >
                            Choose PDF
                          </label>
                        </>
                      ) : (
                        <div className="uploaded-file-display">
                          <div className="uploaded-file-icon mb-2">
                            <svg
                              width="50"
                              height="50"
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
                            </svg>
                          </div>
                          <h6 className="mb-2 text-success">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              style={{
                                marginRight: "6px",
                                verticalAlign: "middle",
                              }}
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            PDF uploaded
                          </h6>
                          <div className="file-info mb-2">
                            <div
                              className="fw-bold text-truncate"
                              style={{ fontSize: "13px" }}
                            >
                              {pdfFile.name}
                            </div>
                          </div>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setPdfFile(null)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stamp Image Upload */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold mb-2">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ marginRight: "6px", verticalAlign: "middle" }}
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
                      Stamp Image
                    </label>
                    <div
                      className={`pdf-upload-zone ${
                        stampImage ? "file-uploaded" : ""
                      }`}
                    >
                      {!stampImage ? (
                        <>
                          <div className="upload-icon mb-2">
                            <svg
                              width="50"
                              height="50"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
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
                          <h6 className="mb-2">Upload Image</h6>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleStampUpload}
                            style={{ display: "none" }}
                            id="stamp-input"
                          />
                          <label
                            htmlFor="stamp-input"
                            className="btn btn-primary btn-sm mt-2"
                          >
                            Choose Image
                          </label>
                        </>
                      ) : (
                        <div className="uploaded-file-display">
                          <div className="uploaded-file-icon mb-2">
                            {stampImageUrl && (
                              <img
                                src={stampImageUrl}
                                alt="Stamp preview"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "contain",
                                }}
                              />
                            )}
                          </div>
                          <h6 className="mb-2 text-success">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              style={{
                                marginRight: "6px",
                                verticalAlign: "middle",
                              }}
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Image uploaded
                          </h6>
                          <div className="file-info mb-2">
                            <div
                              className="fw-bold text-truncate"
                              style={{ fontSize: "13px" }}
                            >
                              {stampImage.name}
                            </div>
                          </div>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => {
                              setStampImage(null);
                              setStampImageUrl("");
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {message && <Alert message={message} type={messageType} />}
              </div>
            ) : (
              <div className="feature-card">
                {/* Toolbar */}
                <div
                  className="d-flex justify-content-between align-items-center mb-3 pb-3"
                  style={{ borderBottom: "2px solid #e0e0e0" }}
                >
                  <h5 className="mb-0 fw-bold">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: "8px", verticalAlign: "middle" }}
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v6" />
                    </svg>
                    Click to place stamp
                  </h5>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={resetAll}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: "4px", verticalAlign: "middle" }}
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    Start Over
                  </button>
                </div>

                {/* Stamp Controls */}
                <div
                  className="card p-3 mb-3"
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div className="row align-items-center g-3">
                    <div className="col-md-6">
                      <label
                        className="form-label mb-1 fw-bold"
                        style={{ fontSize: "13px" }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{
                            marginRight: "6px",
                            verticalAlign: "middle",
                          }}
                        >
                          <circle cx="12" cy="12" r="3" />
                          <path d="M12 1v6m0 6v6" />
                        </svg>
                        Stamps on this page:
                      </label>
                      <div
                        className="fw-bold"
                        style={{
                          fontSize: "24px",
                          color: "var(--primary-yellow-dark)",
                        }}
                      >
                        {
                          stampPositions.filter(
                            (s) => s.pageIndex === currentPage
                          ).length
                        }
                      </div>
                      <small className="text-muted">
                        Drag corner to resize • Drag stamp to move
                      </small>
                    </div>
                    <div className="col-md-6">
                      {stampPositions.length > 0 && (
                        <Button
                          onClick={handleApplyStamps}
                          disabled={loading}
                          fullWidth
                        >
                          Apply {stampPositions.length} Stamp(s)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* PDF Preview Container */}
                <div
                  ref={containerRef}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    position: "relative",
                    border: "2px solid #dee2e6",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{
                      display: "block",
                      width: "100%",
                      cursor: draggingStamp ? "grabbing" : "crosshair",
                    }}
                  />

                  {/* Render stamps on current page */}
                  {stampPositions
                    .filter((stamp) => stamp.pageIndex === currentPage)
                    .map((stamp) => (
                      <div
                        key={stamp.id}
                        onMouseDown={(e) => handleStampMouseDown(e, stamp)}
                        style={{
                          position: "absolute",
                          left: `${stamp.x}px`,
                          top: `${stamp.y}px`,
                          width: `${stamp.width}px`,
                          height: `${stamp.height}px`,
                          backgroundImage: `url(${stampImageUrl})`,
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                          border:
                            draggingStamp === stamp.id ||
                            resizingStamp === stamp.id
                              ? "2px solid var(--primary-yellow)"
                              : "2px dashed var(--primary-yellow)",
                          borderRadius: "4px",
                          cursor:
                            draggingStamp === stamp.id ? "grabbing" : "move",
                          transition:
                            draggingStamp === stamp.id ||
                            resizingStamp === stamp.id
                              ? "none"
                              : "all 0.2s ease",
                          boxShadow:
                            draggingStamp === stamp.id ||
                            resizingStamp === stamp.id
                              ? "0 6px 16px rgba(255, 193, 7, 0.5)"
                              : "none",
                          zIndex:
                            draggingStamp === stamp.id ||
                            resizingStamp === stamp.id
                              ? 1000
                              : 1,
                        }}
                      >
                        {/* Delete Button Overlay */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStamp(stamp.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            top: "-8px",
                            right: "-8px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            border: "2px solid #dc3545",
                            backgroundColor: "rgba(220, 53, 69, 0.9)",
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: "bold",
                            padding: 0,
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.2)";
                            e.currentTarget.style.backgroundColor =
                              "rgba(220, 53, 69, 1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.backgroundColor =
                              "rgba(220, 53, 69, 0.9)";
                          }}
                        >
                          ×
                        </button>

                        {/* Resize Handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, stamp)}
                          style={{
                            position: "absolute",
                            bottom: "-6px",
                            right: "-6px",
                            width: "20px",
                            height: "20px",
                            backgroundColor: "var(--primary-yellow)",
                            border: "2px solid white",
                            borderRadius: "50%",
                            cursor: "nwse-resize",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.3)";
                            e.currentTarget.style.backgroundColor =
                              "var(--primary-yellow-dark)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.backgroundColor =
                              "var(--primary-yellow)";
                          }}
                        />
                      </div>
                    ))}
                </div>

                {/* Page Navigation */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center align-items-center mt-4 gap-3">
                    <button
                      className="btn btn-sm"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      style={{
                        backgroundColor:
                          currentPage === 0 ? "#e9ecef" : "white",
                        border: "2px solid var(--primary-yellow-light)",
                        color:
                          currentPage === 0 ? "#6c757d" : "var(--foreground)",
                        fontWeight: "600",
                        padding: "8px 20px",
                        borderRadius: "var(--border-radius)",
                        transition: "all 0.3s ease",
                        cursor: currentPage === 0 ? "not-allowed" : "pointer",
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== 0) {
                          e.currentTarget.style.backgroundColor =
                            "var(--primary-yellow-light)";
                          e.currentTarget.style.borderColor =
                            "var(--primary-yellow)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(255, 193, 7, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          currentPage === 0 ? "#e9ecef" : "white";
                        e.currentTarget.style.borderColor =
                          "var(--primary-yellow-light)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
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
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Previous
                    </button>
                    <div
                      style={{
                        padding: "8px 24px",
                        backgroundColor: "var(--primary-yellow)",
                        borderRadius: "var(--border-radius)",
                        fontWeight: "700",
                        fontSize: "15px",
                        boxShadow: "0 2px 8px rgba(255, 193, 7, 0.3)",
                      }}
                    >
                      {currentPage + 1} / {totalPages}
                    </div>
                    <button
                      className="btn btn-sm"
                      disabled={currentPage === totalPages - 1}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      style={{
                        backgroundColor:
                          currentPage === totalPages - 1 ? "#e9ecef" : "white",
                        border: "2px solid var(--primary-yellow-light)",
                        color:
                          currentPage === totalPages - 1
                            ? "#6c757d"
                            : "var(--foreground)",
                        fontWeight: "600",
                        padding: "8px 20px",
                        borderRadius: "var(--border-radius)",
                        transition: "all 0.3s ease",
                        cursor:
                          currentPage === totalPages - 1
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== totalPages - 1) {
                          e.currentTarget.style.backgroundColor =
                            "var(--primary-yellow-light)";
                          e.currentTarget.style.borderColor =
                            "var(--primary-yellow)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(255, 193, 7, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          currentPage === totalPages - 1 ? "#e9ecef" : "white";
                        e.currentTarget.style.borderColor =
                          "var(--primary-yellow-light)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      Next
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ marginLeft: "6px", verticalAlign: "middle" }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                )}

                {message && <Alert message={message} type={messageType} />}
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
