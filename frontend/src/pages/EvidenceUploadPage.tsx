import React, { useMemo, useState } from 'react';
import { CloudUpload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

const acceptedExtensions = ['csv', 'json', 'evtx'];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function EvidenceUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInfo = useMemo(() => {
    if (!selectedFile) return null;
    return {
      name: selectedFile.name,
      size: formatBytes(selectedFile.size),
      type: getFileExtension(selectedFile.name),
    };
  }, [selectedFile]);

  const validateFile = (file: File) => {
    const ext = getFileExtension(file.name);
    return acceptedExtensions.includes(ext);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!validateFile(file)) {
      setNotification({ type: 'error', message: 'Unsupported file type. Please select CSV, JSON, or EVTX.' });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setNotification(null);
    setUploadState('idle');
    setUploadProgress(0);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleFileSelect(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setNotification({ type: 'error', message: 'Please choose a file before uploading.' });
      return;
    }

    setUploadState('uploading');
    setUploadProgress(0);
    setNotification(null);

    const duration = 900;
    const steps = 6;
    const increment = 100 / steps;
    let current = 0;

    const interval = window.setInterval(() => {
      current += increment;
      setUploadProgress(Math.min(100, Math.round(current)));
      if (current >= 100) {
        window.clearInterval(interval);
        setUploadState('success');
        setNotification({ type: 'success', message: 'Evidence file uploaded successfully.' });
      }
    }, duration / steps);

    setTimeout(() => {
      setUploadProgress(100);
      window.clearInterval(interval);
    }, duration + 100);
  };

  const uploadText = selectedFile ? `Ready to upload ${selectedFile.name}` : 'Drop a file here or browse to choose one.';

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-950 text-white px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-emerald-400/80">Evidence Upload</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Import Your Evidence Files</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Drag and drop your CSV, JSON, or EVTX evidence package here. This interface supports file selection and upload progress tracking, without changing existing timeline or reporting flows.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-slate-800/80 bg-slate-950 px-4 py-3 shadow-sm">
              <FileText className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Supported formats</p>
                <p className="text-sm font-semibold text-white">CSV · JSON · EVTX</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/10">
            <div
              className={`relative flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-10 transition-all duration-200 ${
                dragActive ? 'border-emerald-400/80 bg-emerald-500/10' : 'border-slate-700 bg-slate-950/70'
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <CloudUpload className="h-16 w-16 text-emerald-400" />
              <div className="text-center">
                <p className="text-lg font-semibold text-white">{uploadText}</p>
                <p className="mt-2 text-sm text-slate-400">CSV, JSON, and EVTX files are accepted. Drag one file into the area or click to browse.</p>
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:border-emerald-400/80 hover:text-emerald-300">
                Select File
                <input
                  type="file"
                  accept=".csv,.json,.evtx"
                  className="sr-only"
                  onChange={handleInputChange}
                />
              </label>
              <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-4 text-left text-sm text-slate-400">
                <p className="font-semibold text-slate-200">EVTX support is placeholder only.</p>
                <p>File parsing and backend integration are not implemented in this preview interface.</p>
              </div>
            </div>

            {fileInfo && (
              <div className="mt-6 rounded-3xl border border-slate-800/90 bg-slate-950/80 p-4">
                <p className="text-sm font-semibold text-slate-200">Selected Evidence File</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">File name</p>
                    <p className="mt-2 text-sm text-white">{fileInfo.name}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">File size</p>
                    <p className="mt-2 text-sm text-white">{fileInfo.size}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</p>
                    <p className="mt-2 text-sm text-white">{fileInfo.type.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploadState === 'uploading'}
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload Evidence
              </button>
              <div className="min-w-[220px] rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                <p className="font-semibold text-slate-100">Status</p>
                <p className="mt-1">{uploadState === 'idle' ? 'Ready' : uploadState === 'uploading' ? 'Uploading...' : uploadState === 'success' ? 'Upload complete' : 'Waiting for action'}</p>
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            {notification && (
              <div className={`mt-4 rounded-3xl border p-4 text-sm ${notification.type === 'success' ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/60 bg-rose-500/10 text-rose-100'}`}>
                <div className="flex items-center gap-2">
                  {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>{notification.message}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/10">
            <div className="rounded-3xl bg-slate-950/80 p-5">
              <h2 className="text-lg font-semibold text-white">Upload Tips</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li>• CSV files should contain rows of evidence metadata.</li>
                <li>• JSON files can include structured incident artifacts.</li>
                <li>• EVTX support is currently a placeholder, not parsed yet.</li>
                <li>• Only one file can be selected at a time for this preview upload flow.</li>
                <li>• Upload progress and notifications are displayed locally.</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-slate-950/80 p-5">
              <h2 className="text-lg font-semibold text-white">File Selection Notes</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                The upload control supports drag-and-drop and manual browsing. It validates file extensions for CSV, JSON, and EVTX, then simulates an upload progress state.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
