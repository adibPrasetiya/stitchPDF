"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import FeatureTitle from "@/components/FeatureTitle";

interface PdfFileInfo {
  file: File;
  totalPages: number;
  thumbnail?: string;
}

interface PageThumbnail {
  pageNumber: number;
  thumbnail: string;
}

export default function InsertPage() {
  const [mainFile, setMainFile] = useState<PdfFileInfo | null>(null);
  const [insertFile, setInsertFile] = useState<PdfFileInfo | null>(null);
  const [insertAfterPage, setInsertAfterPage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "danger">(
    "success"
  );
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingInsert, setIsDraggingInsert] = useState(false);
  const [mainFileThumbnails, setMainFileThumbnails] = useState<PageThumbnail[]>([]);
  const [insertFileThumbnails, setInsertFileThumbnails] = useState<PageThumbnail[]>([]);

  const generateThumbnail = async (
    file: File,
    pageNum: number
  ): Promise<string> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();

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

  const loadPdfFile = async (file: File, isMainFile: boolean): Promise<PdfFileInfo | null> => {
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed!");
      setMessageType("danger");
      return null;
    }

    setLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();

      // Generate thumbnail for first page
      const firstPageThumbnail = await generateThumbnail(file, 1);

      // Generate thumbnails for all pages
      const thumbnails: PageThumbnail[] = [];
      for (let i = 1; i <= pageCount; i++) {
        const thumbnail = await generateThumbnail(file, i);
        thumbnails.push({ pageNumber: i, thumbnail });
      }

      if (isMainFile) {
        setMainFileThumbnails(thumbnails);
      } else {
        setInsertFileThumbnails(thumbnails);
      }

      return {
        file,
        totalPages: pageCount,
        thumbnail: firstPageThumbnail,
      };
    } catch (error) {
      console.error(error);
      setMessage("Error reading PDF file.");
      setMessageType("danger");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleMainFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileInfo = await loadPdfFile(file, true);
    if (fileInfo) {
      setMainFile(fileInfo);
      setMessage("");
    }
  };

  const handleInsertFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileInfo = await loadPdfFile(file, false);
    if (fileInfo) {
      setInsertFile(fileInfo);
      setMessage("");
    }
  };

  const handleMainFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMain(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fileInfo = await loadPdfFile(file, true);
      if (fileInfo) {
        setMainFile(fileInfo);
        setMessage("");
      }
    }
  };

  const handleInsertFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingInsert(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fileInfo = await loadPdfFile(file, false);
      if (fileInfo) {
        setInsertFile(fileInfo);
        setMessage("");
      }
    }
  };

  const handleInsertPdf = async () => {
    if (!mainFile) {
      setMessage("Please select the main PDF file (File A)!");
      setMessageType("danger");
      return;
    }

    if (!insertFile) {
      setMessage("Please select the file to insert (File B)!");
      setMessageType("danger");
      return;
    }

    const insertPosition = parseInt(insertAfterPage);
    if (
      !insertAfterPage ||
      isNaN(insertPosition) ||
      insertPosition < 0 ||
      insertPosition > mainFile.totalPages
    ) {
      setMessage(
        `Please enter a valid page number (0 to ${mainFile.totalPages})!`
      );
      setMessageType("danger");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Load both PDFs
      const mainPdfBytes = await mainFile.file.arrayBuffer();
      const insertPdfBytes = await insertFile.file.arrayBuffer();

      const mainPdf = await PDFDocument.load(mainPdfBytes);
      const insertPdf = await PDFDocument.load(insertPdfBytes);

      // Create new PDF
      const resultPdf = await PDFDocument.create();

      // Copy pages from main PDF up to insert position
      for (let i = 0; i < insertPosition; i++) {
        const [page] = await resultPdf.copyPages(mainPdf, [i]);
        resultPdf.addPage(page);
      }

      // Copy all pages from insert PDF
      const insertPageIndices = insertPdf.getPageIndices();
      const insertedPages = await resultPdf.copyPages(
        insertPdf,
        insertPageIndices
      );
      insertedPages.forEach((page) => resultPdf.addPage(page));

      // Copy remaining pages from main PDF
      for (let i = insertPosition; i < mainPdf.getPageCount(); i++) {
        const [page] = await resultPdf.copyPages(mainPdf, [i]);
        resultPdf.addPage(page);
      }

      // Save and download
      const resultPdfBytes = await resultPdf.save();
      const arrayBuffer = resultPdfBytes.buffer.slice(
        resultPdfBytes.byteOffset,
        resultPdfBytes.byteOffset + resultPdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "inserted.pdf";
      link.click();

      setMessage(
        `Success! ${
          insertFile.totalPages
        } page(s) inserted after page ${insertPosition}. Total pages: ${resultPdf.getPageCount()}`
      );
      setMessageType("success");

      // Reload page after successful merge
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while inserting PDFs."
      );
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  const switchFiles = () => {
    const tempFile = mainFile;
    const tempThumbnails = mainFileThumbnails;

    setMainFile(insertFile);
    setInsertFile(tempFile);
    setMainFileThumbnails(insertFileThumbnails);
    setInsertFileThumbnails(tempThumbnails);
    setInsertAfterPage("");
  };

  const bothFilesUploaded = mainFile && insertFile;
  const insertPosition = parseInt(insertAfterPage) || 0;

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
              {mainFile && insertFile
                ? "Inserting PDF pages..."
                : "Loading PDF..."}
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
        {!bothFilesUploaded && (
          <FeatureTitle
            title="Insert PDF"
            description="Insert pages from one PDF file into another at a specific position"
          />
        )}

        {!bothFilesUploaded ? (
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="feature-card">
                {/* Upload Zones - Side by Side */}
                <div className="row g-3 mb-4">
                  {/* Main File Upload (File A) */}
                  <div className="col-md-5">
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
                      File A - Main PDF
                    </label>
                    <div
                      className={`pdf-upload-zone ${
                        isDraggingMain ? "dragging-over" : ""
                      } ${mainFile ? "file-uploaded" : ""}`}
                      onDrop={handleMainFileDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDraggingMain(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingMain(false);
                      }}
                    >
                      {!mainFile ? (
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
                              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </div>
                          <h6 className="mb-2">Drop PDF here</h6>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleMainFileSelect}
                            style={{ display: "none" }}
                            id="main-pdf-input"
                          />
                          <label
                            htmlFor="main-pdf-input"
                            className="btn btn-primary btn-sm mt-2"
                          >
                            Choose File A
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
                            File A uploaded
                          </h6>
                          <div className="file-info mb-2">
                            <div
                              className="fw-bold text-truncate"
                              style={{ fontSize: "13px" }}
                            >
                              {mainFile.file.name}
                            </div>
                            <div
                              className="text-muted"
                              style={{ fontSize: "12px" }}
                            >
                              {mainFile.totalPages} pages
                            </div>
                          </div>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => {
                              setMainFile(null);
                              setMainFileThumbnails([]);
                              setInsertAfterPage("");
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Switch Button */}
                  <div className="col-md-2 d-flex align-items-center justify-content-center">
                    <button
                      onClick={switchFiles}
                      disabled={!mainFile || !insertFile}
                      title="Switch File A ↔ File B"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        border: "2px solid #e9ecef",
                        background: "#fff",
                        cursor: !mainFile || !insertFile ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                        opacity: !mainFile || !insertFile ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (mainFile && insertFile) {
                          e.currentTarget.style.borderColor = "var(--primary-yellow)";
                          e.currentTarget.style.background = "#fffbf0";
                          e.currentTarget.style.transform = "scale(1.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (mainFile && insertFile) {
                          e.currentTarget.style.borderColor = "#e9ecef";
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={!mainFile || !insertFile ? "#ccc" : "#6c757d"}
                        strokeWidth="2"
                      >
                        <polyline points="17 1 21 5 17 9" />
                        <path d="M3 11V9a4 4 0 014-4h14" />
                        <polyline points="7 23 3 19 7 15" />
                        <path d="M21 13v2a4 4 0 01-4 4H3" />
                      </svg>
                    </button>
                  </div>

                  {/* Insert File Upload (File B) */}
                  <div className="col-md-5">
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
                        <line x1="12" y1="11" x2="12" y2="17" />
                        <line x1="9" y1="14" x2="15" y2="14" />
                      </svg>
                      File B - PDF to Insert
                    </label>
                    <div
                      className={`pdf-upload-zone ${
                        isDraggingInsert ? "dragging-over" : ""
                      } ${insertFile ? "file-uploaded" : ""}`}
                      onDrop={handleInsertFileDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDraggingInsert(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingInsert(false);
                      }}
                    >
                      {!insertFile ? (
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
                              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </div>
                          <h6 className="mb-2">Drop PDF here</h6>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleInsertFileSelect}
                            style={{ display: "none" }}
                            id="insert-pdf-input"
                          />
                          <label
                            htmlFor="insert-pdf-input"
                            className="btn btn-primary btn-sm mt-2"
                          >
                            Choose File B
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
                                fill="#4caf50"
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
                            File B uploaded
                          </h6>
                          <div className="file-info mb-2">
                            <div
                              className="fw-bold text-truncate"
                              style={{ fontSize: "13px" }}
                            >
                              {insertFile.file.name}
                            </div>
                            <div
                              className="text-muted"
                              style={{ fontSize: "12px" }}
                            >
                              {insertFile.totalPages} pages
                            </div>
                          </div>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => {
                              setInsertFile(null);
                              setInsertFileThumbnails([]);
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
            </div>
          </div>
        ) : (
          <div className="row">
            {/* Left: Visualization */}
            <div className="col-lg-8">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* File A - Before Insertion */}
                {insertPosition > 0 && (
                  <div
                    style={{
                      border: "3px solid #4a90e2",
                      borderRadius: "16px",
                      padding: "20px",
                      background: "linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          background: "#4a90e2",
                          color: "#fff",
                          padding: "6px 16px",
                          borderRadius: "20px",
                          fontWeight: "700",
                          fontSize: "14px",
                        }}
                      >
                        File A - Pages 1 to {insertPosition}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "20px",
                      }}
                    >
                      {/* First Page */}
                      <div
                        style={{
                          background: "#fff",
                          border: "2px solid #4a90e2",
                          borderRadius: "8px",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          width: "140px",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "160px",
                            background: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {mainFileThumbnails[0]?.thumbnail ? (
                            <img
                              src={mainFileThumbnails[0].thumbnail}
                              alt="Page 1"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="#4a90e2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          )}
                        </div>
                        <div
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            background: "#4a90e2",
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          Page 1
                        </div>
                      </div>

                      {/* Dots connector if more than 1 page before insertion */}
                      {insertPosition > 1 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#4a90e2",
                            }}
                          />
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#4a90e2",
                            }}
                          />
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#4a90e2",
                            }}
                          />
                        </div>
                      )}

                      {/* Last Page before insertion (if different from first) */}
                      {insertPosition > 1 && (
                        <div
                          style={{
                            background: "#fff",
                            border: "2px solid #4a90e2",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            width: "140px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "160px",
                              background: "#f8f9fa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {mainFileThumbnails[insertPosition - 1]?.thumbnail ? (
                              <img
                                src={mainFileThumbnails[insertPosition - 1].thumbnail}
                                alt={`Page ${insertPosition}`}
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <svg width="50" height="50" viewBox="0 0 24 24" fill="#4a90e2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            )}
                          </div>
                          <div
                            style={{
                              padding: "10px",
                              textAlign: "center",
                              background: "#4a90e2",
                              color: "#fff",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            Page {insertPosition}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Connector Arrow - only show if there are pages before insertion */}
                {insertPosition > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--primary-yellow)"
                      strokeWidth="3"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <polyline points="19 12 12 19 5 12" />
                    </svg>
                  </div>
                )}

                {/* File B - To be Inserted (Highlighted) */}
                <div
                  style={{
                    border: "3px solid var(--primary-yellow)",
                    borderRadius: "16px",
                    padding: "20px",
                    background: "linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%)",
                    boxShadow: "0 4px 16px rgba(255, 193, 7, 0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--primary-yellow)",
                        color: "#000",
                        padding: "6px 16px",
                        borderRadius: "20px",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      File B - Inserted Here ({insertFile.totalPages}{" "}
                      {insertFile.totalPages === 1 ? "page" : "pages"})
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {/* First Page of File B */}
                    <div
                      style={{
                        background: "#fff",
                        border: "2px solid var(--primary-yellow)",
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(255, 193, 7, 0.4)",
                        width: "140px",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "160px",
                          background: "#f8f9fa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {insertFileThumbnails[0]?.thumbnail ? (
                          <img
                            src={insertFileThumbnails[0].thumbnail}
                            alt="File B Page 1"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <svg width="50" height="50" viewBox="0 0 24 24" fill="var(--primary-yellow)">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )}
                      </div>
                      <div
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          background: "var(--primary-yellow)",
                          color: "#000",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        File B Preview
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {insertPosition < mainFile.totalPages && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--primary-yellow)"
                      strokeWidth="3"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <polyline points="19 12 12 19 5 12" />
                    </svg>
                  </div>
                )}

                {/* File A - After Insertion */}
                {insertPosition < mainFile.totalPages && (
                  <div
                    style={{
                      border: "3px solid #4a90e2",
                      borderRadius: "16px",
                      padding: "20px",
                      background: "linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          background: "#4a90e2",
                          color: "#fff",
                          padding: "6px 16px",
                          borderRadius: "20px",
                          fontWeight: "700",
                          fontSize: "14px",
                        }}
                      >
                        File A - Pages {insertPosition + 1} to {mainFile.totalPages}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "20px",
                      }}
                    >
                      {/* First Page after insertion */}
                      <div
                        style={{
                          background: "#fff",
                          border: "2px solid #4a90e2",
                          borderRadius: "8px",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          width: "140px",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "160px",
                            background: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {mainFileThumbnails[insertPosition]?.thumbnail ? (
                            <img
                              src={mainFileThumbnails[insertPosition].thumbnail}
                              alt={`Page ${insertPosition + 1}`}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="#4a90e2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          )}
                        </div>
                        <div
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            background: "#4a90e2",
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          Page {insertPosition + 1}
                        </div>
                      </div>

                      {/* Dots connector if more than 1 page after insertion */}
                      {mainFile.totalPages - insertPosition > 1 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#4a90e2",
                            }}
                          />
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#4a90e2",
                            }}
                          />
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#4a90e2",
                            }}
                          />
                        </div>
                      )}

                      {/* Last Page (if different from first after insertion) */}
                      {mainFile.totalPages - insertPosition > 1 && (
                        <div
                          style={{
                            background: "#fff",
                            border: "2px solid #4a90e2",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            width: "140px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "160px",
                              background: "#f8f9fa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {mainFileThumbnails[mainFile.totalPages - 1]?.thumbnail ? (
                              <img
                                src={mainFileThumbnails[mainFile.totalPages - 1].thumbnail}
                                alt={`Page ${mainFile.totalPages}`}
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <svg width="50" height="50" viewBox="0 0 24 24" fill="#4a90e2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            )}
                          </div>
                          <div
                            style={{
                              padding: "10px",
                              textAlign: "center",
                              background: "#4a90e2",
                              color: "#fff",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            Page {mainFile.totalPages}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Control Card */}
            <div className="col-lg-4">
              <div
                style={{
                  position: "sticky",
                  top: "24px",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* File Info */}
                  <div
                    style={{
                      marginBottom: "20px",
                      padding: "16px",
                      background: "#f8f9fa",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#212529",
                        marginBottom: "12px",
                      }}
                    >
                      Files Selected
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#4a90e2",
                        marginBottom: "6px",
                        fontWeight: "600",
                      }}
                    >
                      📄 File A: {mainFile.totalPages} pages
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "12px",
                        wordBreak: "break-word",
                      }}
                    >
                      {mainFile.file.name}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#4caf50",
                        marginBottom: "6px",
                        fontWeight: "600",
                      }}
                    >
                      📄 File B: {insertFile.totalPages} pages
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        wordBreak: "break-word",
                      }}
                    >
                      {insertFile.file.name}
                    </div>
                  </div>

                  {/* Insert Position Input */}
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
                      Insert File B After Page
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={insertAfterPage}
                      onChange={(e) => setInsertAfterPage(e.target.value)}
                      placeholder={`0 to ${mainFile.totalPages}`}
                      min="0"
                      max={mainFile.totalPages}
                      style={{
                        fontSize: "14px",
                        padding: "10px 14px",
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    />
                  </div>

                  {/* Result Preview */}
                  {insertAfterPage && (
                    <div
                      style={{
                        marginBottom: "20px",
                        padding: "16px",
                        background: "linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%)",
                        borderRadius: "10px",
                        border: "2px solid var(--primary-yellow)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#212529",
                          marginBottom: "12px",
                        }}
                      >
                        Result Preview
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6c757d",
                          lineHeight: "1.6",
                        }}
                      >
                        Total pages:{" "}
                        <strong style={{ color: "#212529" }}>
                          {mainFile.totalPages + insertFile.totalPages}
                        </strong>
                        <br />
                        Order:{" "}
                        <span style={{ fontSize: "12px" }}>
                          {insertPosition > 0 && `A(1-${insertPosition}) → `}
                          <strong style={{ color: "var(--primary-yellow-dark)" }}>
                            B(1-{insertFile.totalPages})
                          </strong>
                          {insertPosition < mainFile.totalPages &&
                            ` → A(${insertPosition + 1}-${mainFile.totalPages})`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Switch Files Button */}
                  <button
                    onClick={switchFiles}
                    style={{
                      width: "100%",
                      marginBottom: "12px",
                      fontWeight: "600",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "2px solid #e9ecef",
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.3s ease",
                      fontSize: "14px",
                      color: "#495057",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary-yellow)";
                      e.currentTarget.style.background = "#fffbf0";
                      e.currentTarget.style.color = "#212529";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e9ecef";
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.color = "#495057";
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 014-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 01-4 4H3" />
                    </svg>
                    Switch File A ↔ File B
                  </button>

                  {/* Insert Button */}
                  <Button
                    onClick={handleInsertPdf}
                    disabled={loading || !insertAfterPage}
                    fullWidth
                  >
                    {loading ? "Inserting..." : "Insert PDF"}
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
