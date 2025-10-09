'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Alert from '@/components/Alert';

interface ImageFile {
  id: string;
  file: File;
  url: string;
  size: string;
}

export default function ImagesToPdfPage() {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  const addFiles = async (files: FileList | File[]) => {
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
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
      setMessage('');
    } else {
      setMessage('Only PNG, JPG, and JPEG images are allowed!');
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
    setImageFiles((prev) => {
      const file = prev.find(f => f.id === id);
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
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }
          blob.arrayBuffer().then(resolve).catch(reject);
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  const handleConvertToPdf = async () => {
    if (imageFiles.length === 0) {
      setMessage('Please add at least one image!');
      setMessageType('danger');
      return;
    }

    setLoading(true);
    setMessage('');

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
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'images.pdf';
      link.click();

      setMessage(`Success! ${imageFiles.length} image(s) converted to PDF and downloaded.`);
      setMessageType('success');

      // Reload page after successful conversion
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : 'Error converting images to PDF.');
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
            <div className="loading-text">Converting images to PDF...</div>
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
            <h1 className="mb-3">Convert Images to PDF</h1>
            <p className="lead text-muted">
              Upload multiple images and convert them into a single PDF document
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h5 className="mb-2">
                  Drag & drop your images here <span className="text-muted">or click to upload</span>
                </h5>
                <p className="text-muted mb-3">Supports: PNG, JPG, JPEG</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="image-file-input"
                />
                <label htmlFor="image-file-input" className="btn btn-primary mt-3">
                  Choose Images
                </label>
              </div>

              {/* Images List */}
              {imageFiles.length > 0 && (
                <div className="pdf-files-list mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 fw-bold">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      {imageFiles.length} Image{imageFiles.length > 1 ? 's' : ''} Ready
                    </h6>
                    <small className="text-muted">Drag to reorder</small>
                  </div>

                  {imageFiles.map((imageFile, index) => (
                    <div
                      key={imageFile.id}
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
                        <div className="me-3">
                          <img
                            src={imageFile.url}
                            alt={imageFile.file.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #e0e0e0',
                            }}
                          />
                        </div>
                        <div className="flex-grow-1">
                          <div className="pdf-file-name">{imageFile.file.name}</div>
                          <div className="pdf-file-size text-muted">{imageFile.size}</div>
                        </div>
                        <div className="pdf-file-actions">
                          <button
                            className="btn btn-sm btn-outline-secondary me-2"
                            title="Move up"
                            disabled={index === 0}
                            onClick={() => {
                              if (index > 0) {
                                const newFiles = [...imageFiles];
                                [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
                                setImageFiles(newFiles);
                              }
                            }}
                          >
                            ↑
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary me-2"
                            title="Move down"
                            disabled={index === imageFiles.length - 1}
                            onClick={() => {
                              if (index < imageFiles.length - 1) {
                                const newFiles = [...imageFiles];
                                [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
                                setImageFiles(newFiles);
                              }
                            }}
                          >
                            ↓
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveFile(imageFile.id)}
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

              {/* Convert Button */}
              {imageFiles.length > 0 && (
                <div className="mt-4">
                  <Button
                    onClick={handleConvertToPdf}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Converting...' : `Convert ${imageFiles.length} Image${imageFiles.length > 1 ? 's' : ''} to PDF`}
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
                <h3 className="how-to-use-title">How to Convert Images to PDF</h3>
              </div>

              <ol className="how-to-steps">
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Upload your images</p>
                    <p className="how-to-step-description">
                      Click &quot;Choose Images&quot; or drag & drop one or more images (PNG, JPG, JPEG)
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Arrange image order</p>
                    <p className="how-to-step-description">
                      Drag & drop to change order, or use ↑ ↓ buttons
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Remove unwanted images (optional)</p>
                    <p className="how-to-step-description">
                      Click the ✕ button on the image you want to remove from the list
                    </p>
                  </div>
                </li>
                <li className="how-to-step">
                  <div className="how-to-step-content">
                    <p className="how-to-step-text">Click &quot;Convert to PDF&quot;</p>
                    <p className="how-to-step-description">
                      PDF will automatically download with the name &quot;images.pdf&quot;
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
                  <span>Each image will become one PDF page matching the original image size</span>
                </div>
                <div className="how-to-example-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>The order of images in the list will become the page order in the PDF</span>
                </div>
                <div className="how-to-example-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>All images are processed in your browser, not uploaded to server</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
