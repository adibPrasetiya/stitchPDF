interface FileUploadProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
}

export default function FileUpload({ label, file, onChange, accept = '.pdf' }: FileUploadProps) {
  return (
    <div className="mb-3">
      <label className="form-label fw-bold">{label}</label>
      <label className="file-upload-label">
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        {file ? '✓ File dipilih' : `Klik untuk pilih ${label.toLowerCase()}`}
      </label>
      {file && <div className="file-name">{file.name}</div>}
    </div>
  );
}
