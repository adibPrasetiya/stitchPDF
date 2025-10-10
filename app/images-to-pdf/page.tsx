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

interface ImageFile {
  id: string;
  file: File;
  url: string;
  size: string;
}

export default function ImagesToPdfPage() {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
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

  const addFiles = async (files: FileList | File[]) => {
    const validImageTypes = ["image/png", "image/jpeg", "image/jpg"];
    const newFiles: ImageFile[] = [];

    for (const file of Array.from(files)) {
      if (validImageTypes.includes(file.type)) {
        const url = URL.createObjectURL(file);
        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          url,
          size: formatFileSize(file.size),
        });
      }
    }

    if (newFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...newFiles]);
      setMessage("");
    } else {
      setMessage("Only PNG, JPG, and JPEG images are allowed!");
      setMessageType("danger");
    }
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
    setImageFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter((f) => f.id !== id);
    });
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

    const newFiles = [...imageFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);

    setImageFiles(newFiles);
    setDraggedIndex(null);
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

  const handleConvertToPdf = async () => {
    if (imageFiles.length === 0) {
      setMessage("Please add at least one image!");
      setMessageType("danger");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imageFile of imageFiles) {
        // Convert image to PNG for consistency
        const pngBytes = await convertImageToPng(imageFile.file);
        const image = await pdfDoc.embedPng(pngBytes);

        const imageDims = image.scale(1);

        // Create page with image dimensions
        const page = pdfDoc.addPage([imageDims.width, imageDims.height]);

        // Draw image to fill the entire page
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: imageDims.width,
          height: imageDims.height,
        });
      }

      // Save and download
      const pdfBytes = await pdfDoc.save();
      const arrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "images.pdf";
      link.click();

      setMessage(
        `Success! ${imageFiles.length} image(s) converted to PDF and downloaded.`
      );
      setMessageType("success");

      // Reload page after successful conversion
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Error converting images to PDF."
      );
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
            <div className="loading-text">Converting images to PDF...</div>
            <div className="loading-subtext">Please wait</div>
            <div className="progress-bar-container">
              <div className="progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Container>
        {imageFiles.length === 0 && (
          <FeatureTitle
            title="Images to PDF"
            description="Convert multiple images (PNG, JPG, JPEG) into a single PDF document"
          />
        )}

        <div className="row justify-content-center">
          <div className="col-lg-10">
            {imageFiles.length === 0 ? (
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
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <h5 className="mb-2">Drag & drop your images here</h5>
                  <p className="text-muted mb-3">or</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="image-file-input"
                  />
                  <label htmlFor="image-file-input" className="btn btn-primary">
                    Choose Images
                  </label>
                  <p className="text-muted mt-3" style={{ fontSize: "14px" }}>
                    Supports: PNG, JPG, JPEG
                  </p>
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
                      {imageFiles.length} Image
                      {imageFiles.length !== 1 ? "s" : ""} Selected
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
                      Drag images to change order
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
                      {imageFiles.length > 0 && (
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
                          {imageFiles.length}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={handleConvertToPdf}
                      disabled={loading || imageFiles.length === 0}
                    >
                      {loading
                        ? "Converting..."
                        : `Convert ${imageFiles.length} Image${
                            imageFiles.length !== 1 ? "s" : ""
                          } to PDF`}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="image-file-input-more"
                  />
                </div>

                {/* Images Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "24px",
                    marginBottom: "32px",
                  }}
                >
                  {imageFiles.map((imageFile, index) => (
                    <div
                      key={imageFile.id}
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

                      {/* Image Card */}
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
                        {/* Image Preview */}
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
                          <img
                            src={imageFile.url}
                            alt={imageFile.file.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              transition: "transform 0.3s ease",
                              pointerEvents: "none",
                            }}
                          />

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(imageFile.id);
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
                            title={imageFile.file.name}
                          >
                            {imageFile.file.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6c757d" }}>
                            {imageFile.size}
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
