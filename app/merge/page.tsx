"use client";

import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import FeatureTitle from "@/components/FeatureTitle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowsUpDown,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

interface PdfFile {
  id: string;
  file: File;
  size: string;
  thumbnail?: string;
}

export default function MergePage() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "danger">(
    "success"
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const generateThumbnail = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

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

  const addFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf"
    );

    if (validFiles.length === 0) {
      setMessage("Only PDF files are allowed!");
      setMessageType("danger");
      return;
    }

    setLoading(true);
    const newFiles: PdfFile[] = [];

    for (const file of validFiles) {
      const thumbnail = await generateThumbnail(file);
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        size: formatFileSize(file.size),
        thumbnail,
      });
    }

    setPdfFiles((prev) => [...prev, ...newFiles]);
    setMessage("");
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    addFiles(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files) {
      addFiles(files);
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

  const handleDragOverZone = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveFile = (id: string) => {
    setPdfFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null) return;

    const newFiles = [...pdfFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);

    setPdfFiles(newFiles);
    setDraggedIndex(null);
  };

  const handleMergePdf = async () => {
    if (pdfFiles.length < 2) {
      setMessage("At least 2 PDF files are required to merge!");
      setMessageType("danger");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const pdfBytes = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const arrayBuffer = mergedPdfBytes.buffer.slice(
        mergedPdfBytes.byteOffset,
        mergedPdfBytes.byteOffset + mergedPdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "merged.pdf";
      link.click();

      setMessage(
        `${pdfFiles.length} PDF files successfully merged and downloaded!`
      );
      setMessageType("success");

      // Reload page after successful merge
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("An error occurred while merging PDFs.");
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoreClick = () => {
    fileInputRef.current?.click();
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
              {pdfFiles.length === 0
                ? "Loading PDFs..."
                : "Merging your PDFs..."}
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
        {pdfFiles.length === 0 && (
          <FeatureTitle
            title="Merge PDF"
            description="Combine multiple PDF files into a single document"
          />
        )}

        <div className="row justify-content-center">
          <div className="col-lg-10">
            {pdfFiles.length === 0 ? (
              <div className="feature-card">
                {/* Upload Area */}
                <div
                  className={`pdf-upload-zone ${
                    isDraggingOver ? "dragging-over" : ""
                  }`}
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOverZone}
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
                  <h5 className="mb-2">Drag & drop your PDFs here</h5>
                  <p className="text-muted mb-3">or</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="pdf-file-input"
                  />
                  <label htmlFor="pdf-file-input" className="btn btn-primary">
                    Choose Files
                  </label>
                </div>

                {message && <Alert message={message} type={messageType} />}
              </div>
            ) : (
              <>
                {/* Header with Add Button and Instructions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                    padding: "20px",
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <div>
                    <h5 className="mb-1 fw-bold" style={{ fontSize: "18px" }}>
                      <FontAwesomeIcon
                        icon={faCircle}
                        style={{
                          fontSize: "8px",
                          color: "var(--primary-yellow)",
                          marginRight: "8px",
                        }}
                      />
                      {pdfFiles.length} PDF{pdfFiles.length !== 1 ? "s" : ""}{" "}
                      Selected
                    </h5>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#6c757d",
                        margin: 0,
                        marginLeft: "16px",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faArrowsUpDown}
                        style={{ marginRight: "6px" }}
                      />
                      Drag files to change order
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        onClick={handleAddMoreClick}
                        className="btn btn-outline-secondary btn-sm"
                        style={{
                          fontWeight: "600",
                          borderRadius: "8px",
                          padding: "8px 20px",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faPlus}
                          style={{ marginRight: "6px" }}
                        />
                        Add More
                      </button>
                      {pdfFiles.length > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-10px",
                            right: "-10px",
                            background: "#dc3545",
                            color: "white",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: "700",
                            border: "2px solid white",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                            zIndex: 10,
                          }}
                        >
                          {pdfFiles.length}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={handleMergePdf}
                      disabled={loading || pdfFiles.length < 2}
                    >
                      {loading
                        ? "Merging..."
                        : `Merge ${pdfFiles.length} PDF${
                            pdfFiles.length !== 1 ? "s" : ""
                          }`}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="pdf-file-input-more"
                  />
                </div>

                {/* PDF Grid - Direct on Background */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "24px",
                    marginBottom: "32px",
                  }}
                >
                  {pdfFiles.map((pdfFile, index) => (
                    <div
                      key={pdfFile.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      style={{
                        position: "relative",
                        opacity: draggedIndex === index ? 0.4 : 1,
                        cursor: draggedIndex === index ? "grabbing" : "grab",
                        transform:
                          draggedIndex === index
                            ? "scale(1.05) rotate(3deg)"
                            : "scale(1) rotate(0deg)",
                        transition:
                          draggedIndex === index
                            ? "opacity 0.2s ease, transform 0.1s ease"
                            : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      {/* Order Number Badge */}
                      <div
                        style={{
                          position: "absolute",
                          top: "-12px",
                          left: "-12px",
                          width: "36px",
                          height: "36px",
                          background:
                            "linear-gradient(135deg, var(--primary-yellow) 0%, var(--primary-yellow-dark) 100%)",
                          color: "#000",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: "700",
                          border: "3px solid white",
                          boxShadow: "0 4px 12px rgba(255, 193, 7, 0.4)",
                          zIndex: 10,
                          transition: "all 0.3s ease",
                        }}
                      >
                        {index + 1}
                      </div>

                      {/* PDF Card */}
                      <div
                        style={{
                          background: "#fff",
                          border: "2px solid #e9ecef",
                          borderRadius: "12px",
                          overflow: "hidden",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow:
                            draggedIndex === index
                              ? "0 20px 40px rgba(0,0,0,0.3)"
                              : "0 2px 12px rgba(0,0,0,0.1)",
                        }}
                        onMouseEnter={(e) => {
                          if (draggedIndex !== index) {
                            e.currentTarget.style.borderColor =
                              "var(--primary-yellow)";
                            e.currentTarget.style.boxShadow =
                              "0 8px 24px rgba(255, 193, 7, 0.3)";
                            e.currentTarget.style.transform =
                              "translateY(-8px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (draggedIndex !== index) {
                            e.currentTarget.style.borderColor = "#e9ecef";
                            e.currentTarget.style.boxShadow =
                              "0 2px 12px rgba(0,0,0,0.1)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                      >
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
                          {pdfFile.thumbnail ? (
                            <img
                              src={pdfFile.thumbnail}
                              alt={pdfFile.file.name}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                                transition: "transform 0.3s ease",
                                pointerEvents: "none",
                              }}
                            />
                          ) : (
                            <svg
                              width="70"
                              height="70"
                              viewBox="0 0 24 24"
                              fill="#4a90e2"
                              stroke="currentColor"
                              strokeWidth="1"
                            >
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(pdfFile.id);
                            }}
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              border: "none",
                              background: "rgba(220, 53, 69, 0.95)",
                              color: "white",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              fontWeight: "bold",
                              transition: "all 0.2s ease",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.2)";
                              e.currentTarget.style.background = "#dc3545";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.background =
                                "rgba(220, 53, 69, 0.95)";
                            }}
                          >
                            ×
                          </button>
                        </div>

                        {/* File Info */}
                        <div style={{ padding: "14px" }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#212529",
                              marginBottom: "4px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={pdfFile.file.name}
                          >
                            {pdfFile.file.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6c757d" }}>
                            {pdfFile.size}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {message && (
                  <div style={{ maxWidth: "600px", margin: "16px auto 0" }}>
                    <Alert message={message} type={messageType} />
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </Container>
    </>
  );
}
