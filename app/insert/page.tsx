"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";

interface PdfFileInfo {
  file: File;
  totalPages: number;
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

  const loadPdfFile = async (file: File): Promise<PdfFileInfo | null> => {
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed!");
      setMessageType("danger");
      return null;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      return {
        file,
        totalPages: pdf.getPageCount(),
      };
    } catch (error) {
      console.error(error);
      setMessage("Error reading PDF file.");
      setMessageType("danger");
      return null;
    }
  };

  const handleMainFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileInfo = await loadPdfFile(file);
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
    const fileInfo = await loadPdfFile(file);
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
      const fileInfo = await loadPdfFile(file);
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
      const fileInfo = await loadPdfFile(file);
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
      const arrayBuffer = resultPdfBytes.buffer.slice(resultPdfBytes.byteOffset, resultPdfBytes.byteOffset + resultPdfBytes.byteLength) as ArrayBuffer;
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
      setMessage(error instanceof Error ? error.message : "An error occurred while inserting PDFs.");
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  const switchFiles = () => {
    const temp = mainFile;
    setMainFile(insertFile);
    setInsertFile(temp);
    setInsertAfterPage("");
    setMessage("Files switched!");
    setMessageType("success");
    setTimeout(() => setMessage(""), 2000);
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
            <div className="loading-text">Inserting PDF pages...</div>
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
            <h1 className="mb-3">Insert PDF into Another PDF</h1>
            <p className="lead text-muted">
              Insert pages from one PDF file into another at a specific position
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container>
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
                    className="btn btn-outline-secondary btn-sm"
                    onClick={switchFiles}
                    disabled={!mainFile || !insertFile}
                    title="Switch files"
                    style={{ padding: "8px 12px" }}
                  >
                    <svg
                      width="20"
                      height="20"
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
                          onClick={() => setInsertFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Insert Position Input */}
              {mainFile && insertFile && (
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Insert after page: (0 = insert at beginning,{" "}
                    {mainFile.totalPages} = insert at end)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={insertAfterPage}
                    onChange={(e) => setInsertAfterPage(e.target.value)}
                    placeholder={`Enter 0 to ${mainFile.totalPages}`}
                    min="0"
                    max={mainFile.totalPages}
                  />
                  <small className="text-muted">
                    Example: Enter &quot;2&quot; to insert File B after page 2 of File A
                  </small>
                </div>
              )}

              {/* Insert Button */}
              {mainFile && insertFile && (
                <div className="mt-4">
                  <Button
                    onClick={handleInsertPdf}
                    disabled={loading || !insertAfterPage}
                    fullWidth
                  >
                    {loading ? "Inserting PDF..." : "Insert PDF"}
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
                <h3 className="how-to-use-title">How to Insert PDF</h3>
              </div>

              <ol className="how-to-steps">
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">
                      Upload File A (Main PDF)
                    </p>
                    <p className="how-to-step-description">
                      This is the main document that will receive the insertion
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">
                      Upload File B (PDF to be inserted)
                    </p>
                    <p className="how-to-step-description">
                      This file will be inserted into File A
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">
                      Specify insertion position
                    </p>
                    <p className="how-to-step-description">
                      Enter the page number after which File B will be inserted
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Click &quot;Insert PDF&quot;</p>
                    <p className="how-to-step-description">
                      The resulting file will automatically download with the name &quot;inserted.pdf&quot;
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
                  Usage Examples
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
                    File A (4 hal) + File B (2 hal) insert after page 2 = A1,
                    A2, B1, B2, A3, A4 (6 hal)
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
                    Insert after page 0 = File B will be inserted at the beginning (before all pages of File A)
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
                    Use the &quot;Switch Files&quot; button to swap File A and File B positions
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
