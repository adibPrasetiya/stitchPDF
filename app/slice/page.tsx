"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import FeatureTitle from "@/components/FeatureTitle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

interface PageRange {
  id: string;
  fromPage: number;
  toPage: number;
  customPages?: number[]; // For custom page selection like 3,4,9
  customPagesInput?: string; // Raw input string for custom pages
  isCustom?: boolean; // Flag to differentiate custom vs range
}

interface PageThumbnail {
  pageNumber: number;
  thumbnail: string;
}

export default function SlicePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState<PageRange[]>([
    { id: "1", fromPage: 1, toPage: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "danger">(
    "success"
  );
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [mergeAllRanges, setMergeAllRanges] = useState(false);
  const [pageThumbnails, setPageThumbnails] = useState<PageThumbnail[]>([]);

  const generateThumbnail = async (
    file: File,
    pageNum: number
  ): Promise<string> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

  const loadPdfFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed!");
      setMessageType("danger");
      return;
    }

    setPdfFile(file);
    setMessage("");
    setLoading(true);

    // Get total pages
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();
      setTotalPages(pageCount);

      // Set initial range
      if (pageCount > 0) {
        setRanges([{ id: "1", fromPage: 1, toPage: Math.min(5, pageCount) }]);
      }

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

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newFromPage = lastRange ? lastRange.toPage + 1 : 1;
    const newToPage = Math.min(newFromPage + 4, totalPages);

    setRanges([
      ...ranges,
      {
        id: Date.now().toString(),
        fromPage: newFromPage,
        toPage: newToPage,
        isCustom: false,
      },
    ]);
  };

  const addCustomPage = () => {
    setRanges([
      ...ranges,
      {
        id: Date.now().toString(),
        fromPage: 1,
        toPage: 1,
        customPages: [1],
        customPagesInput: "1",
        isCustom: true,
      },
    ]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((r) => r.id !== id));
    }
  };

  const updateRange = (
    id: string,
    field: "fromPage" | "toPage",
    value: number
  ) => {
    setRanges(
      ranges.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: Math.max(1, Math.min(value, totalPages)),
            }
          : r
      )
    );
  };

  const updateCustomPages = (id: string, pagesString: string) => {
    // Parse the input to get valid page numbers
    const pages = pagesString
      .split(",")
      .map((p) => parseInt(p.trim()))
      .filter((p) => !isNaN(p) && p >= 1 && p <= totalPages);

    setRanges(
      ranges.map((r) =>
        r.id === id
          ? {
              ...r,
              customPagesInput: pagesString, // Store raw input
              customPages: pages, // Store parsed array
            }
          : r
      )
    );
  };

  const handleSlicePdf = async () => {
    if (!pdfFile) {
      setMessage("Please select a PDF file first!");
      setMessageType("danger");
      return;
    }

    if (ranges.length === 0) {
      setMessage("Please add at least one range!");
      setMessageType("danger");
      return;
    }

    // Validate ranges
    for (const range of ranges) {
      if (range.isCustom) {
        if (!range.customPages || range.customPages.length === 0) {
          setMessage("Custom page selection cannot be empty!");
          setMessageType("danger");
          return;
        }
      } else {
        if (range.fromPage > range.toPage) {
          setMessage(
            `Invalid range: ${range.fromPage} to ${range.toPage}. Start page must be less than or equal to end page.`
          );
          setMessageType("danger");
          return;
        }
        if (range.fromPage < 1 || range.toPage > totalPages) {
          setMessage(
            `Invalid range: ${range.fromPage} to ${range.toPage}. Pages must be between 1 and ${totalPages}.`
          );
          setMessageType("danger");
          return;
        }
      }
    }

    setLoading(true);
    setMessage("");

    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(pdfBytes);

      if (mergeAllRanges) {
        // Merge all ranges into one PDF
        const newPdf = await PDFDocument.create();

        for (const range of ranges) {
          const pageIndices = [];

          if (range.isCustom && range.customPages) {
            // For custom pages, use the custom page array
            range.customPages.forEach((pageNum) => {
              pageIndices.push(pageNum - 1); // Convert to 0-indexed
            });
          } else {
            // For ranges, iterate from fromPage to toPage
            for (let i = range.fromPage; i <= range.toPage; i++) {
              pageIndices.push(i - 1); // Convert to 0-indexed
            }
          }

          const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach((page) => newPdf.addPage(page));
        }

        const pdfBytesOut = await newPdf.save();
        const arrayBuffer = pdfBytesOut.buffer.slice(
          pdfBytesOut.byteOffset,
          pdfBytesOut.byteOffset + pdfBytesOut.byteLength
        ) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `sliced-merged.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);

        setMessage("Successfully created merged PDF from all ranges!");
        setMessageType("success");
      } else {
        // Create separate PDFs for each range
        const slicedPdfs: Blob[] = [];

        for (const range of ranges) {
          const newPdf = await PDFDocument.create();
          const pageIndices = [];

          if (range.isCustom && range.customPages) {
            // For custom pages, use the custom page array
            range.customPages.forEach((pageNum) => {
              pageIndices.push(pageNum - 1); // Convert to 0-indexed
            });
          } else {
            // For ranges, iterate from fromPage to toPage
            for (let i = range.fromPage; i <= range.toPage; i++) {
              pageIndices.push(i - 1); // Convert to 0-indexed
            }
          }

          const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach((page) => newPdf.addPage(page));

          const pdfBytesOut = await newPdf.save();
          const arrayBuffer = pdfBytesOut.buffer.slice(
            pdfBytesOut.byteOffset,
            pdfBytesOut.byteOffset + pdfBytesOut.byteLength
          ) as ArrayBuffer;
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
      }

      // Reload page after successful operation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while slicing PDF."
      );
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

      {/* Main Content */}
      <Container>
        {!pdfFile && (
          <FeatureTitle
            title="Slice PDF"
            description="Split your PDF into multiple files by selecting page ranges"
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
              {/* Thumbnails Grid with Range Visualization */}
              <div>
                {ranges.map((range, rangeIndex) => {
                  const pagesInRange: PageThumbnail[] = [];

                  if (range.isCustom && range.customPages) {
                    // For custom pages, show all selected pages
                    range.customPages.forEach((pageNum) => {
                      const thumb = pageThumbnails.find(
                        (t) => t.pageNumber === pageNum
                      );
                      if (thumb) pagesInRange.push(thumb);
                    });
                  } else {
                    // For ranges, only show first and last page
                    const firstThumb = pageThumbnails.find(
                      (t) => t.pageNumber === range.fromPage
                    );
                    const lastThumb = pageThumbnails.find(
                      (t) => t.pageNumber === range.toPage
                    );

                    if (firstThumb) pagesInRange.push(firstThumb);
                    if (
                      lastThumb &&
                      range.fromPage !== range.toPage
                    ) {
                      pagesInRange.push(lastThumb);
                    }
                  }

                  if (pagesInRange.length === 0) return null;

                  // Color for each range
                  const rangeColors = [
                    { border: "#ffc107", bg: "#fff9e6" },
                    { border: "#e91e63", bg: "#fce4ec" },
                    { border: "#9c27b0", bg: "#f3e5f5" },
                    { border: "#2196f3", bg: "#e3f2fd" },
                    { border: "#4caf50", bg: "#e8f5e9" },
                    { border: "#ff5722", bg: "#fbe9e7" },
                  ];
                  const color = rangeColors[rangeIndex % rangeColors.length];

                  return (
                    <div
                      key={range.id}
                      style={{
                        border: `3px solid ${color.border}`,
                        borderRadius: "16px",
                        padding: "20px",
                        marginBottom: "24px",
                        background: color.bg,
                        position: "relative",
                      }}
                    >
                      {/* Range Label */}
                      <div
                        style={{
                          position: "absolute",
                          top: "-14px",
                          left: "20px",
                          background: color.border,
                          color: rangeIndex % 3 === 0 ? "#000" : "#fff",
                          padding: "6px 20px",
                          borderRadius: "20px",
                          fontWeight: "700",
                          fontSize: "14px",
                          boxShadow: `0 4px 12px ${color.border}66`,
                        }}
                      >
                        {range.isCustom
                          ? `Custom Pages ${rangeIndex + 1}`
                          : `Range ${rangeIndex + 1}`}
                      </div>

                      {/* Pages Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(140px, 1fr))",
                          gap: "16px",
                          marginTop: "12px",
                        }}
                      >
                        {pagesInRange.map((page, pageIdx) => {
                          const isLast = pageIdx === pagesInRange.length - 1;
                          const showConnector =
                            pagesInRange.length > 1 && !isLast;

                          return (
                            <div
                              key={page.pageNumber}
                              style={{
                                position: "relative",
                              }}
                            >
                              {/* Page Card */}
                              <div
                                style={{
                                  background: "#fff",
                                  border: `2px solid ${color.border}`,
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  transition: "all 0.3s ease",
                                }}
                              >
                                {/* Thumbnail */}
                                <div
                                  style={{
                                    width: "100%",
                                    height: "160px",
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
                                    padding: "8px",
                                    textAlign: "center",
                                    background: "#fff",
                                    borderTop: `1px solid ${color.border}33`,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: "600",
                                      color: "#212529",
                                    }}
                                  >
                                    Page {page.pageNumber}
                                  </div>
                                </div>
                              </div>

                              {/* Connector Line (dotted) */}
                              {showConnector && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "50%",
                                    right: "-16px",
                                    width: "16px",
                                    height: "3px",
                                    backgroundImage: `linear-gradient(to right, ${color.border} 40%, transparent 0%)`,
                                    backgroundSize: "8px 3px",
                                    backgroundRepeat: "repeat-x",
                                    zIndex: 1,
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Sticky Sidebar with Split Mode */}
            <div className="col-lg-4">
              <div
                style={{
                  position: "sticky",
                  top: "24px",
                }}
              >
                {/* Range Mode Selection */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "24px",
                    marginBottom: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Ranges List */}
                  <div>
                    {ranges.map((range, index) => (
                      <div
                        key={range.id}
                        style={{
                          background: "#f8f9fa",
                          border: "2px solid #e9ecef",
                          borderRadius: "12px",
                          padding: "20px",
                          marginBottom: "16px",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, var(--primary-yellow) 0%, var(--primary-yellow-dark) 100%)",
                              color: "#000",
                              borderRadius: "8px",
                              padding: "8px 16px",
                              fontWeight: "700",
                              fontSize: "14px",
                            }}
                          >
                            {range.isCustom
                              ? `Custom ${index + 1}`
                              : `Range ${index + 1}`}
                          </div>
                          {ranges.length > 1 && (
                            <button
                              onClick={() => removeRange(range.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#dc3545",
                                cursor: "pointer",
                                fontSize: "20px",
                                padding: "0",
                                width: "30px",
                                height: "30px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(220, 53, 69, 0.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "none";
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>

                        {range.isCustom ? (
                          <div>
                            <label
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#6c757d",
                                marginBottom: "8px",
                                display: "block",
                              }}
                            >
                              Pages (comma separated, e.g., 3, 4, 9)
                            </label>
                            <input
                              type="text"
                              value={range.customPagesInput || ""}
                              onChange={(e) =>
                                updateCustomPages(range.id, e.target.value)
                              }
                              className="form-control"
                              placeholder="1, 2, 3"
                              style={{
                                textAlign: "center",
                                fontWeight: "600",
                                fontSize: "16px",
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto 1fr",
                              gap: "16px",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#6c757d",
                                  marginBottom: "8px",
                                  display: "block",
                                }}
                              >
                                from page
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={totalPages}
                                value={range.fromPage}
                                onChange={(e) =>
                                  updateRange(
                                    range.id,
                                    "fromPage",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="form-control"
                                style={{
                                  textAlign: "center",
                                  fontWeight: "600",
                                  fontSize: "16px",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#6c757d",
                                paddingTop: "24px",
                              }}
                            >
                              to
                            </div>

                            <div>
                              <label
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#6c757d",
                                  marginBottom: "8px",
                                  display: "block",
                                }}
                              >
                                to page
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={totalPages}
                                value={range.toPage}
                                onChange={(e) =>
                                  updateRange(
                                    range.id,
                                    "toPage",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="form-control"
                                style={{
                                  textAlign: "center",
                                  fontWeight: "600",
                                  fontSize: "16px",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Range Button */}
                  <button
                    onClick={addRange}
                    className="btn btn-outline-danger"
                    style={{
                      borderRadius: "8px",
                      padding: "10px 24px",
                      fontWeight: "600",
                      width: "100%",
                      border: "2px dashed #dc3545",
                      marginBottom: "12px",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{ marginRight: "8px" }}
                    />
                    Add Range
                  </button>

                  {/* Add Custom Page Button */}
                  <button
                    onClick={addCustomPage}
                    className="btn btn-outline-secondary"
                    style={{
                      borderRadius: "8px",
                      padding: "10px 24px",
                      fontWeight: "600",
                      width: "100%",
                      border: "2px dashed #6c757d",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{ marginRight: "8px" }}
                    />
                    Add Custom Page
                  </button>

                  {/* Merge Checkbox */}
                  <div
                    style={{
                      marginTop: "24px",
                      padding: "20px",
                      background: "linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%)",
                      borderRadius: "12px",
                      border: "2px solid var(--primary-yellow)",
                      boxShadow: "0 2px 8px rgba(255, 193, 7, 0.15)",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        margin: 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={mergeAllRanges}
                        onChange={(e) => setMergeAllRanges(e.target.checked)}
                        style={{
                          width: "22px",
                          height: "22px",
                          marginRight: "14px",
                          cursor: "pointer",
                          accentColor: "var(--primary-yellow)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#333",
                          lineHeight: "1.5",
                        }}
                      >
                        Merge all ranges into one PDF file
                      </span>
                    </label>
                  </div>
                </div>

                {/* Split Button */}
                <div>
                  <Button onClick={handleSlicePdf} disabled={loading} fullWidth>
                    {loading ? "Slicing PDF..." : "Split PDF"}
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
