'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold,
  faItalic,
  faUnderline,
  faFont,
  faPalette,
  faFillDrip,
  faEyeDropper,
  faCircle
} from '@fortawesome/free-solid-svg-icons';

interface TextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
}

export default function AddTextPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBox, setSelectedTextBox] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [draggingTextBox, setDraggingTextBox] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingTextBox, setResizingTextBox] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [eyeDropperSupported, setEyeDropperSupported] = useState(false);
  const [editingTextBox, setEditingTextBox] = useState<string | null>(null);
  const [showTextColorDropdown, setShowTextColorDropdown] = useState(false);
  const [showBgColorDropdown, setShowBgColorDropdown] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const textColorDropdownRef = useRef<HTMLDivElement>(null);
  const bgColorDropdownRef = useRef<HTMLDivElement>(null);

  // Check if EyeDropper API is supported
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEyeDropperSupported('EyeDropper' in (window as any));
  }, []);

  // Auto-focus edit input when editing starts
  useEffect(() => {
    if (editingTextBox && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTextBox]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textColorDropdownRef.current && !textColorDropdownRef.current.contains(event.target as Node)) {
        setShowTextColorDropdown(false);
      }
      if (bgColorDropdownRef.current && !bgColorDropdownRef.current.contains(event.target as Node)) {
        setShowBgColorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setMessage('Please select a valid PDF file!');
      setMessageType('danger');
      return;
    }
    setPdfFile(file);
    setMessage('');
    loadPdf(file);
  };

  const loadPdf = async (file: File) => {
    setLoading(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(0);
      setShowPreview(true);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessage('Error loading PDF. Please try again.');
      setMessageType('danger');
      setLoading(false);
    }
  };

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
    const context = canvas.getContext('2d');

    if (!context) return;

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
    if (draggingTextBox || resizingTextBox) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create new text box with default values
    const newTextBox: TextBox = {
      id: `textbox-${Date.now()}-${Math.random()}`,
      text: 'Double click to edit',
      x: x - 100,
      y: y - 25,
      width: 200,
      height: 50,
      pageIndex: currentPage,
      fontSize: 14,
      fontFamily: 'Helvetica',
      bold: false,
      italic: false,
      underline: false,
      textColor: '#000000',
      backgroundColor: '#FFFFFF',
      backgroundOpacity: 1,
    };

    setTextBoxes([...textBoxes, newTextBox]);
    setSelectedTextBox(newTextBox.id);
  };

  const removeTextBox = (id: string) => {
    setTextBoxes(textBoxes.filter((t) => t.id !== id));
    if (selectedTextBox === id) {
      setSelectedTextBox(null);
    }
  };

  const handleTextBoxMouseDown = (e: React.MouseEvent, textBox: TextBox) => {
    // Don't drag if editing
    if (editingTextBox) return;

    e.stopPropagation();
    setDraggingTextBox(textBox.id);
    setSelectedTextBox(textBox.id);

    const textBoxElement = e.currentTarget as HTMLElement;
    const rect = textBoxElement.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleTextBoxDoubleClick = (e: React.MouseEvent, textBoxId: string) => {
    e.stopPropagation();
    setEditingTextBox(textBoxId);
    setDraggingTextBox(null);
  };

  const handleEditingComplete = () => {
    setEditingTextBox(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditingComplete();
    }
    if (e.key === 'Escape') {
      setEditingTextBox(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Handle resize
    if (resizingTextBox) {
      const deltaX = mouseX - resizeStart.x;
      const deltaY = mouseY - resizeStart.y;

      const newWidth = Math.max(50, resizeStart.width + deltaX);
      const newHeight = Math.max(30, resizeStart.height + deltaY);

      setTextBoxes(textBoxes.map(textBox =>
        textBox.id === resizingTextBox
          ? { ...textBox, width: newWidth, height: newHeight }
          : textBox
      ));
      return;
    }

    // Handle drag
    if (draggingTextBox) {
      const x = mouseX - dragOffset.x;
      const y = mouseY - dragOffset.y;

      setTextBoxes(textBoxes.map(textBox =>
        textBox.id === draggingTextBox
          ? { ...textBox, x, y }
          : textBox
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingTextBox(null);
    setResizingTextBox(null);
  };

  const handleResizeStart = (e: React.MouseEvent, textBox: TextBox) => {
    e.stopPropagation();
    setResizingTextBox(textBox.id);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setResizeStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: textBox.width,
      height: textBox.height,
    });
  };

  const updateSelectedTextBox = (updates: Partial<TextBox>) => {
    if (!selectedTextBox) return;

    setTextBoxes(textBoxes.map(textBox =>
      textBox.id === selectedTextBox
        ? { ...textBox, ...updates }
        : textBox
    ));
  };

  const getSelectedTextBox = (): TextBox | null => {
    if (!selectedTextBox) return null;
    return textBoxes.find(t => t.id === selectedTextBox) || null;
  };

  const handleEyeDropper = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!('EyeDropper' in (window as any))) {
      setMessage('EyeDropper not supported in your browser. Try Chrome/Edge.');
      setMessageType('danger');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      updateSelectedTextBox({ backgroundColor: result.sRGBHex });
    } catch (error) {
      console.error('EyeDropper error:', error);
    }
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 1, g: 1, b: 1 };
  };

  const handleApplyText = async () => {
    if (!pdfFile || textBoxes.length === 0) {
      setMessage('Please add at least one text box!');
      setMessageType('danger');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDocument = await PDFDocument.load(pdfBytes);

      // Embed all font variants
      const fonts = {
        Helvetica: {
          normal: await pdfDocument.embedFont(StandardFonts.Helvetica),
          bold: await pdfDocument.embedFont(StandardFonts.HelveticaBold),
          italic: await pdfDocument.embedFont(StandardFonts.HelveticaOblique),
          boldItalic: await pdfDocument.embedFont(StandardFonts.HelveticaBoldOblique),
        },
        Times: {
          normal: await pdfDocument.embedFont(StandardFonts.TimesRoman),
          bold: await pdfDocument.embedFont(StandardFonts.TimesRomanBold),
          italic: await pdfDocument.embedFont(StandardFonts.TimesRomanItalic),
          boldItalic: await pdfDocument.embedFont(StandardFonts.TimesRomanBoldItalic),
        },
        Courier: {
          normal: await pdfDocument.embedFont(StandardFonts.Courier),
          bold: await pdfDocument.embedFont(StandardFonts.CourierBold),
          italic: await pdfDocument.embedFont(StandardFonts.CourierOblique),
          boldItalic: await pdfDocument.embedFont(StandardFonts.CourierBoldOblique),
        },
      };

      // Helper function to get the right font
      const getFont = (family: string, bold: boolean, italic: boolean) => {
        const fontFamily = fonts[family as keyof typeof fonts] || fonts.Helvetica;
        if (bold && italic) return fontFamily.boldItalic;
        if (bold) return fontFamily.bold;
        if (italic) return fontFamily.italic;
        return fontFamily.normal;
      };

      // Apply text boxes to pages
      textBoxes.forEach((textBox) => {
        const page = pdfDocument.getPage(textBox.pageIndex);
        const { height: pageHeight } = page.getSize();

        // Convert canvas coordinates to PDF coordinates
        const pdfX = textBox.x / canvasScale;
        const pdfY = pageHeight - (textBox.y / canvasScale) - (textBox.height / canvasScale);
        const pdfWidth = textBox.width / canvasScale;
        const pdfHeight = textBox.height / canvasScale;

        // Draw background rectangle if not transparent
        if (textBox.backgroundOpacity > 0) {
          const bgColor = hexToRgb(textBox.backgroundColor);
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            color: rgb(bgColor.r, bgColor.g, bgColor.b),
            opacity: textBox.backgroundOpacity,
          });
        }

        // Draw text
        const textColor = hexToRgb(textBox.textColor);
        const font = getFont(textBox.fontFamily, textBox.bold, textBox.italic);

        // Calculate text position (center vertically in box)
        const textHeight = font.heightAtSize(textBox.fontSize / canvasScale);
        const textY = pdfY + (pdfHeight - textHeight) / 2;
        const textX = pdfX + 5; // Small padding from left

        page.drawText(textBox.text, {
          x: textX,
          y: textY,
          size: textBox.fontSize / canvasScale,
          font: font,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });

        // Draw underline if enabled
        if (textBox.underline) {
          const textWidth = font.widthOfTextAtSize(textBox.text, textBox.fontSize / canvasScale);
          const underlineY = textY - (textBox.fontSize / canvasScale) * 0.15; // Slightly below text
          const underlineThickness = Math.max(1, (textBox.fontSize / canvasScale) * 0.05);

          page.drawLine({
            start: { x: textX, y: underlineY },
            end: { x: textX + textWidth, y: underlineY },
            thickness: underlineThickness,
            color: rgb(textColor.r, textColor.g, textColor.b),
          });
        }
      });

      // Save and download
      const modifiedPdfBytes = await pdfDocument.save();
      const arrayBuffer = modifiedPdfBytes.buffer.slice(
        modifiedPdfBytes.byteOffset,
        modifiedPdfBytes.byteOffset + modifiedPdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'pdf-with-text.pdf';
      link.click();

      setMessage(`Success! PDF with ${textBoxes.length} text box(es) has been downloaded.`);
      setMessageType('success');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : 'Error applying text to PDF.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setPdfFile(null);
    setShowPreview(false);
    setPdfDoc(null);
    setCurrentPage(0);
    setTotalPages(0);
    setTextBoxes([]);
    setSelectedTextBox(null);
    setMessage('');
  };

  const selectedBox = getSelectedTextBox();

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
              {showPreview ? 'Applying text...' : 'Loading PDF...'}
            </div>
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
            <h1 className="mb-3">Add Text to PDF</h1>
            <p className="lead text-muted">
              Click anywhere on your PDF to add customizable text boxes with backgrounds
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {!showPreview ? (
              <div className="feature-card">
                {/* PDF Upload */}
                <div className={`pdf-upload-zone ${pdfFile ? 'file-uploaded' : ''}`}>
                  {!pdfFile ? (
                    <>
                      <div className="upload-icon mb-3">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <h5 className="mb-2">Upload PDF Document</h5>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                        id="pdf-input"
                      />
                      <label htmlFor="pdf-input" className="btn btn-primary mt-3">
                        Choose PDF File
                      </label>
                    </>
                  ) : (
                    <div className="uploaded-file-display">
                      <div className="uploaded-file-icon mb-2">
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#4a90e2" fillOpacity="0.15" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <h6 className="mb-2 text-success">PDF uploaded</h6>
                      <div className="file-info mb-2">
                        <div className="fw-bold text-truncate" style={{ fontSize: '13px' }}>{pdfFile.name}</div>
                      </div>
                    </div>
                  )}
                </div>

                {message && <Alert message={message} type={messageType} />}
              </div>
            ) : (
              <div className="feature-card">
                {/* Toolbar */}
                <div className="d-flex justify-content-between align-items-center mb-3 pb-3" style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <h5 className="mb-0 fw-bold">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                      <path d="M4 7h16M4 12h16M4 17h10" />
                    </svg>
                    Click to add text box
                  </h5>
                  <button className="btn btn-outline-secondary btn-sm" onClick={resetAll}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    Start Over
                  </button>
                </div>

                {/* Text Box Settings - MS Word Style */}
                {selectedBox && (
                  <div className="card mb-3" style={{
                    background: '#ffffff',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    {/* Single Toolbar Row */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        {/* Font Family */}
                        <div style={{ position: 'relative' }}>
                          <FontAwesomeIcon icon={faFont} style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#666',
                            fontSize: '11px',
                            pointerEvents: 'none',
                            zIndex: 1
                          }} />
                          <select
                            className="form-select"
                            value={selectedBox.fontFamily}
                            onChange={(e) => updateSelectedTextBox({ fontFamily: e.target.value })}
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px 4px 26px',
                              border: '1px solid #adadad',
                              borderRadius: '3px',
                              height: '28px',
                              width: '130px',
                              backgroundColor: 'white'
                            }}
                          >
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times">Times</option>
                            <option value="Courier">Courier</option>
                          </select>
                        </div>

                        {/* Font Size */}
                        <select
                          className="form-select"
                          value={selectedBox.fontSize}
                          onChange={(e) => updateSelectedTextBox({ fontSize: Number(e.target.value) })}
                          style={{
                            fontSize: '12px',
                            padding: '4px 6px',
                            border: '1px solid #adadad',
                            borderRadius: '3px',
                            height: '28px',
                            width: '60px',
                            backgroundColor: 'white'
                          }}
                        >
                          {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '20px', background: '#d0d0d0', margin: '0 2px' }} />

                        {/* Bold, Italic, Underline */}
                        <button
                          onClick={() => updateSelectedTextBox({ bold: !selectedBox.bold })}
                          title="Bold"
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '1px solid #adadad',
                            borderRadius: '3px',
                            background: selectedBox.bold ? '#ffc107' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            color: selectedBox.bold ? '#000' : '#444'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedBox.bold) e.currentTarget.style.background = '#f0f0f0';
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedBox.bold) e.currentTarget.style.background = 'white';
                          }}
                        >
                          <FontAwesomeIcon icon={faBold} style={{ fontSize: '13px' }} />
                        </button>
                        <button
                          onClick={() => updateSelectedTextBox({ italic: !selectedBox.italic })}
                          title="Italic"
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '1px solid #adadad',
                            borderRadius: '3px',
                            background: selectedBox.italic ? '#ffc107' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            color: selectedBox.italic ? '#000' : '#444'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedBox.italic) e.currentTarget.style.background = '#f0f0f0';
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedBox.italic) e.currentTarget.style.background = 'white';
                          }}
                        >
                          <FontAwesomeIcon icon={faItalic} style={{ fontSize: '13px' }} />
                        </button>
                        <button
                          onClick={() => updateSelectedTextBox({ underline: !selectedBox.underline })}
                          title="Underline"
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '1px solid #adadad',
                            borderRadius: '3px',
                            background: selectedBox.underline ? '#ffc107' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            color: selectedBox.underline ? '#000' : '#444'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedBox.underline) e.currentTarget.style.background = '#f0f0f0';
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedBox.underline) e.currentTarget.style.background = 'white';
                          }}
                        >
                          <FontAwesomeIcon icon={faUnderline} style={{ fontSize: '13px' }} />
                        </button>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '20px', background: '#d0d0d0', margin: '0 2px' }} />

                        {/* Text Color with Dropdown */}
                        <div ref={textColorDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            onClick={() => {
                              setShowTextColorDropdown(!showTextColorDropdown);
                              setShowBgColorDropdown(false);
                            }}
                            title="Text Color"
                            style={{
                              width: '45px',
                              height: '28px',
                              border: '1px solid #adadad',
                              borderRadius: '3px',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px',
                              position: 'relative',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f0f0f0';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                            }}
                          >
                            <FontAwesomeIcon icon={faFont} style={{ fontSize: '12px', color: '#444', marginBottom: '2px' }} />
                            <div style={{
                              width: '100%',
                              height: '3px',
                              background: selectedBox.textColor,
                              borderRadius: '1px'
                            }} />
                          </button>

                          {/* Text Color Dropdown */}
                          {showTextColorDropdown && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              marginTop: '4px',
                              background: 'white',
                              border: '1px solid #adadad',
                              borderRadius: '4px',
                              padding: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              zIndex: 1000,
                              minWidth: '160px'
                            }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>Text Color</div>
                              <div className="d-flex flex-wrap gap-1 mb-2">
                                {['#000000', '#dc3545', '#0d6efd', '#198754', '#ffc107', '#6c757d', '#ff6b6b', '#4ecdc4'].map(color => (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      updateSelectedTextBox({ textColor: color });
                                      setShowTextColorDropdown(false);
                                    }}
                                    title={color}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '3px',
                                      background: color,
                                      border: selectedBox.textColor.toLowerCase() === color ? '2px solid #ffc107' : '1px solid #ccc',
                                      cursor: 'pointer',
                                      padding: 0,
                                      transition: 'transform 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  />
                                ))}
                              </div>
                              <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '6px', marginTop: '6px' }}>
                                <label style={{ fontSize: '10px', color: '#666', marginBottom: '4px', display: 'block' }}>Custom</label>
                                <input
                                  type="color"
                                  value={selectedBox.textColor}
                                  onChange={(e) => updateSelectedTextBox({ textColor: e.target.value })}
                                  style={{
                                    width: '100%',
                                    height: '28px',
                                    border: '1px solid #ccc',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Background Color with Dropdown */}
                        <div ref={bgColorDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            onClick={() => {
                              setShowBgColorDropdown(!showBgColorDropdown);
                              setShowTextColorDropdown(false);
                            }}
                            title="Background Color"
                            style={{
                              width: '45px',
                              height: '28px',
                              border: '1px solid #adadad',
                              borderRadius: '3px',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px',
                              position: 'relative',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f0f0f0';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                            }}
                          >
                            <FontAwesomeIcon icon={faFillDrip} style={{ fontSize: '12px', color: '#444', marginBottom: '2px' }} />
                            <div style={{
                              width: '100%',
                              height: '3px',
                              background: selectedBox.backgroundOpacity > 0 ? selectedBox.backgroundColor : 'transparent',
                              border: selectedBox.backgroundOpacity === 0 ? '1px solid #ccc' : 'none',
                              borderRadius: '1px'
                            }} />
                          </button>

                          {/* Background Color Dropdown */}
                          {showBgColorDropdown && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              marginTop: '4px',
                              background: 'white',
                              border: '1px solid #adadad',
                              borderRadius: '4px',
                              padding: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              zIndex: 1000,
                              minWidth: '160px'
                            }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>Background Color</div>
                              <div className="d-flex flex-wrap gap-1 mb-2">
                                <button
                                  onClick={() => {
                                    updateSelectedTextBox({ backgroundOpacity: 0 });
                                    setShowBgColorDropdown(false);
                                  }}
                                  title="No Fill"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '3px',
                                    background: 'white',
                                    border: selectedBox.backgroundOpacity === 0 ? '2px solid #ffc107' : '1px solid #ccc',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  <div style={{
                                    width: '18px',
                                    height: '1px',
                                    background: '#dc3545',
                                    transform: 'rotate(-45deg)'
                                  }} />
                                </button>
                                {['#FFFFFF', '#000000', '#ffc107', '#e3f2fd', '#ffe8eb', '#e8f5e9', '#f3e5f5'].map(color => (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      updateSelectedTextBox({ backgroundColor: color, backgroundOpacity: 1 });
                                      setShowBgColorDropdown(false);
                                    }}
                                    title={color}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '3px',
                                      background: color,
                                      border: selectedBox.backgroundColor.toLowerCase() === color && selectedBox.backgroundOpacity > 0 ? '2px solid #ffc107' : '1px solid #ccc',
                                      cursor: 'pointer',
                                      padding: 0,
                                      transition: 'transform 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  />
                                ))}
                              </div>
                              <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '6px', marginTop: '6px' }}>
                                <label style={{ fontSize: '10px', color: '#666', marginBottom: '4px', display: 'block' }}>Custom</label>
                                <input
                                  type="color"
                                  value={selectedBox.backgroundColor}
                                  onChange={(e) => updateSelectedTextBox({ backgroundColor: e.target.value, backgroundOpacity: 1 })}
                                  style={{
                                    width: '100%',
                                    height: '28px',
                                    border: '1px solid #ccc',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                />
                                {eyeDropperSupported && (
                                  <button
                                    onClick={() => {
                                      handleEyeDropper();
                                      setShowBgColorDropdown(false);
                                    }}
                                    style={{
                                      width: '100%',
                                      marginTop: '4px',
                                      padding: '4px',
                                      fontSize: '10px',
                                      border: '1px solid #adadad',
                                      borderRadius: '3px',
                                      background: 'white',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faEyeDropper} style={{ fontSize: '10px' }} />
                                    Pick from screen
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <small style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>
                        Double-click to edit
                      </small>
                    </div>
                  </div>
                )}

                {/* Stats and Apply */}
                <div className="card p-3 mb-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                  <div className="row align-items-center g-3">
                    <div className="col-md-6">
                      <label className="form-label mb-1 fw-bold" style={{ fontSize: '13px' }}>
                        Text boxes on this page:
                      </label>
                      <div className="fw-bold" style={{ fontSize: '24px', color: 'var(--primary-yellow-dark)' }}>
                        {textBoxes.filter(t => t.pageIndex === currentPage).length}
                      </div>
                      <small className="text-muted">Click to add • Drag to move • Resize from corner</small>
                    </div>
                    <div className="col-md-6">
                      {textBoxes.length > 0 && (
                        <Button onClick={handleApplyText} disabled={loading} fullWidth>
                          Apply {textBoxes.length} Text Box(es)
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
                    position: 'relative',
                    border: '2px solid #dee2e6',
                    borderRadius: '12px',
                    overflow: 'visible', // Changed from hidden to visible
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <div style={{
                    overflow: 'hidden',
                    borderRadius: '12px',
                  }}>
                    <canvas
                      ref={canvasRef}
                      onClick={handleCanvasClick}
                      style={{
                        display: 'block',
                        width: '100%',
                        cursor: draggingTextBox ? 'grabbing' : 'crosshair',
                      }}
                    />
                  </div>

                  {/* Render text boxes on current page */}
                  {textBoxes
                    .filter(textBox => textBox.pageIndex === currentPage)
                    .map((textBox) => (
                      <div
                        key={textBox.id}
                        onMouseDown={(e) => handleTextBoxMouseDown(e, textBox)}
                        onDoubleClick={(e) => handleTextBoxDoubleClick(e, textBox.id)}
                        style={{
                          position: 'absolute',
                          left: `${textBox.x}px`,
                          top: `${textBox.y}px`,
                          width: `${textBox.width}px`,
                          height: `${textBox.height}px`,
                          backgroundColor: textBox.backgroundOpacity > 0 ? textBox.backgroundColor : 'transparent',
                          opacity: textBox.backgroundOpacity,
                          border: selectedTextBox === textBox.id ? '2px solid var(--primary-yellow)' : '2px dashed #adb5bd',
                          borderRadius: '6px',
                          cursor: editingTextBox === textBox.id ? 'text' : (draggingTextBox === textBox.id ? 'grabbing' : 'move'),
                          transition: draggingTextBox === textBox.id ? 'none' : 'all 0.2s ease',
                          boxShadow: selectedTextBox === textBox.id ? '0 6px 16px rgba(255, 193, 7, 0.5)' : 'none',
                          zIndex: selectedTextBox === textBox.id ? 1000 : 1,
                          overflow: 'visible',
                        }}
                      >
                        {/* Inner content wrapper with overflow hidden */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          overflow: 'hidden',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '5px',
                          pointerEvents: 'none',
                          fontFamily: textBox.fontFamily,
                          fontSize: `${textBox.fontSize}px`,
                          color: textBox.textColor,
                          fontWeight: textBox.bold ? 'bold' : 'normal',
                          fontStyle: textBox.italic ? 'italic' : 'normal',
                          textDecoration: textBox.underline ? 'underline' : 'none',
                          wordWrap: 'break-word',
                        }}>
                          {editingTextBox === textBox.id ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={textBox.text}
                              onChange={(e) => updateSelectedTextBox({ text: e.target.value })}
                              onKeyDown={handleEditKeyDown}
                              onBlur={handleEditingComplete}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontFamily: textBox.fontFamily,
                                fontSize: `${textBox.fontSize}px`,
                                color: textBox.textColor,
                                fontWeight: textBox.bold ? 'bold' : 'normal',
                                fontStyle: textBox.italic ? 'italic' : 'normal',
                                textDecoration: textBox.underline ? 'underline' : 'none',
                                padding: '0',
                                pointerEvents: 'auto',
                              }}
                            />
                          ) : (
                            <span style={{
                              opacity: textBox.backgroundOpacity === 0 ? 1 : 'inherit',
                              textShadow: textBox.backgroundOpacity === 0 ? '0 0 3px white, 0 0 3px white' : 'none',
                              pointerEvents: 'none',
                            }}>
                              {textBox.text}
                            </span>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTextBox(textBox.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '-12px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: '2px solid #dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.95)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            padding: 0,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)',
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.2)';
                            e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.95)';
                          }}
                        >
                          ×
                        </button>

                        {/* Resize Handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, textBox)}
                          style={{
                            position: 'absolute',
                            bottom: '-10px',
                            right: '-10px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: 'var(--primary-yellow)',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.2s ease',
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.3)';
                            e.currentTarget.style.backgroundColor = 'var(--primary-yellow-dark)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.backgroundColor = 'var(--primary-yellow)';
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
                        backgroundColor: currentPage === 0 ? '#e9ecef' : 'white',
                        border: '2px solid var(--primary-yellow-light)',
                        color: currentPage === 0 ? '#6c757d' : 'var(--foreground)',
                        fontWeight: '600',
                        padding: '8px 20px',
                        borderRadius: 'var(--border-radius)',
                        transition: 'all 0.3s ease',
                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Previous
                    </button>
                    <div style={{
                      padding: '8px 24px',
                      backgroundColor: 'var(--primary-yellow)',
                      borderRadius: 'var(--border-radius)',
                      fontWeight: '700',
                      fontSize: '15px',
                      boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
                    }}>
                      {currentPage + 1} / {totalPages}
                    </div>
                    <button
                      className="btn btn-sm"
                      disabled={currentPage === totalPages - 1}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      style={{
                        backgroundColor: currentPage === totalPages - 1 ? '#e9ecef' : 'white',
                        border: '2px solid var(--primary-yellow-light)',
                        color: currentPage === totalPages - 1 ? '#6c757d' : 'var(--foreground)',
                        fontWeight: '600',
                        padding: '8px 20px',
                        borderRadius: 'var(--border-radius)',
                        transition: 'all 0.3s ease',
                        cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Next
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                )}

                {message && <Alert message={message} type={messageType} />}
              </div>
            )}

            {/* How to use */}
            {!showPreview && (
              <div className="how-to-use-card">
                <div className="how-to-use-header">
                  <div className="how-to-use-icon">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <h3 className="how-to-use-title">How to Add Text to PDF</h3>
                </div>

                <ol className="how-to-steps">
                  <li className="how-to-step">
                    <div className="how-to-step-content">
                      <p className="how-to-step-text">Upload your PDF document</p>
                      <p className="how-to-step-description">
                        Select the PDF file where you want to add text boxes
                      </p>
                    </div>
                  </li>
                  <li className="how-to-step">
                    <div className="how-to-step-content">
                      <p className="how-to-step-text">Click on PDF to add text box</p>
                      <p className="how-to-step-description">
                        Click anywhere on the PDF canvas to create a new text box at that position
                      </p>
                    </div>
                  </li>
                  <li className="how-to-step">
                    <div className="how-to-step-content">
                      <p className="how-to-step-text">Customize your text</p>
                      <p className="how-to-step-description">
                        Edit text content, choose font family, adjust size, and set text/background colors
                      </p>
                    </div>
                  </li>
                  <li className="how-to-step">
                    <div className="how-to-step-content">
                      <p className="how-to-step-text">Position and resize</p>
                      <p className="how-to-step-description">
                        Drag text boxes to reposition, use corner handle to resize the text area
                      </p>
                    </div>
                  </li>
                  <li className="how-to-step">
                    <div className="how-to-step-content">
                      <p className="how-to-step-text">Apply and download</p>
                      <p className="how-to-step-description">
                        Click &quot;Apply Text Boxes&quot; to save your PDF with the added text
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
                    <span>Use white background to cover/hide existing text, black for redaction</span>
                  </div>
                  <div className="how-to-example-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Set background to transparent for text-only overlay without blocking content</span>
                  </div>
                  <div className="how-to-example-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Use eyedropper tool (Chrome/Edge) to match colors from your PDF</span>
                  </div>
                  <div className="how-to-example-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>All processing happens in your browser - your PDF never leaves your device</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
