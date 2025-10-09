'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Alert from '@/components/Alert';

interface PdfFile {
  id: string;
  file: File;
  size: string;
}

export default function MergePage() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const addFiles = (files: FileList | File[]) => {
    const newFiles: PdfFile[] = Array.from(files)
      .filter((file) => file.type === 'application/pdf')
      .map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        size: formatFileSize(file.size),
      }));

    if (newFiles.length > 0) {
      setPdfFiles((prev) => [...prev, ...newFiles]);
      setMessage('');
    } else {
      setMessage('Only PDF files are allowed!');
      setMessageType('danger');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    addFiles(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      setMessage('At least 2 PDF files are required to merge!');
      setMessageType('danger');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const pdfBytes = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const arrayBuffer = mergedPdfBytes.buffer.slice(mergedPdfBytes.byteOffset, mergedPdfBytes.byteOffset + mergedPdfBytes.byteLength) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      link.click();

      setMessage(`${pdfFiles.length} PDF files successfully merged and downloaded!`);
      setMessageType('success');

      // Reload page after successful merge
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while merging PDFs.');
      setMessageType('danger');
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
            <div className="loading-text">Merging your PDFs...</div>
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
            <h1 className="mb-3">Merge Your PDFs in Seconds</h1>
            <p className="lead text-muted">
              Combine two or more PDF documents into one file, drag & drop, then download the result.
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
                className={`pdf-upload-zone ${isDraggingOver ? 'dragging-over' : ''}`}
                onDrop={handleFileDrop}
                onDragOver={handleDragOverZone}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                <div className="upload-icon mb-3">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h5 className="mb-2">
                  Drag & drop your PDFs here <span className="text-muted">or click to upload</span>
                </h5>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="pdf-file-input"
                />
                <label htmlFor="pdf-file-input" className="btn btn-primary mt-3">
                  Choose Files
                </label>
              </div>

              {/* Files List */}
              {pdfFiles.length > 0 && (
                <div className="pdf-files-list mt-4">
                  {pdfFiles.map((pdfFile, index) => (
                    <div
                      key={pdfFile.id}
                      className={`pdf-file-item ${draggedIndex === index ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                    >
                      <div className="d-flex align-items-center">
                        <div className="drag-handle me-3">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="3" y1="15" x2="21" y2="15" />
                          </svg>
                        </div>
                        <div className="pdf-icon me-3">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#4a90e2" stroke="currentColor" strokeWidth="1">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        </div>
                        <div className="flex-grow-1">
                          <div className="pdf-file-name">{pdfFile.file.name}</div>
                          <div className="pdf-file-size text-muted">{pdfFile.size}</div>
                        </div>
                        <div className="pdf-file-actions">
                          <button
                            className="btn btn-sm btn-outline-secondary me-2"
                            title="Move up"
                            disabled={index === 0}
                            onClick={() => {
                              if (index > 0) {
                                const newFiles = [...pdfFiles];
                                [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
                                setPdfFiles(newFiles);
                              }
                            }}
                          >
                            ↑
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary me-2"
                            title="Move down"
                            disabled={index === pdfFiles.length - 1}
                            onClick={() => {
                              if (index < pdfFiles.length - 1) {
                                const newFiles = [...pdfFiles];
                                [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
                                setPdfFiles(newFiles);
                              }
                            }}
                          >
                            ↓
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveFile(pdfFile.id)}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Merge Button */}
              {pdfFiles.length > 0 && (
                <div className="mt-4">
                  <Button
                    onClick={handleMergePdf}
                    disabled={loading || pdfFiles.length < 2}
                    fullWidth
                  >
                    {loading ? 'Merging your PDFs... Please wait' : 'Merge PDFs'}
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
                <h3 className="how-to-use-title">How to Merge PDFs</h3>
              </div>

              <ol className="how-to-steps">
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Upload your PDF files</p>
                    <p className="how-to-step-description">
                      Click &quot;Choose Files&quot; button or drag & drop at least 2 PDF files to the upload area
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Arrange file order</p>
                    <p className="how-to-step-description">
                      Drag & drop to change position, or use ↑ ↓ buttons to move files
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Remove unnecessary files (optional)</p>
                    <p className="how-to-step-description">
                      Click the ✕ button on files you want to remove from the list
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Click &quot;Merge PDFs&quot; and wait for the process to complete</p>
                    <p className="how-to-step-description">
                      The merged file will be automatically downloaded as &quot;merged.pdf&quot;
                    </p>
                  </div>
                </li>
              </ol>

              <div className="how-to-examples">
                <div className="how-to-examples-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  Useful Tips
                </div>
                <div className="how-to-example-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>No limit on the number of files you can merge</span>
                </div>
                <div className="how-to-example-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>The order of files in the list will be the order of pages in the result PDF</span>
                </div>
                <div className="how-to-example-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>All files are processed in your browser, not uploaded to any server</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
