import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Dropzone({ label, labelAccent, file, onSelect, onRemove }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted[0]) onSelect(accepted[0]);
    },
    [onSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  });

  if (file) {
    return (
      <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-sm text-gray-500">
          Upload <span className="text-accent font-medium">{labelAccent}</span>
        </p>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <div className="rounded-md bg-red-50 p-2 text-red-500">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={`Remove ${file.name}`}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex-1 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        isDragActive ? 'border-accent bg-orange-50' : 'border-gray-300 bg-white hover:border-accent/60'
      }`}
    >
      <input {...getInputProps()} />
      <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Upload size={18} />
      </div>
      <p className="text-sm text-gray-600">
        Upload <span className="text-accent font-medium">{labelAccent}</span>
      </p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  );
}
