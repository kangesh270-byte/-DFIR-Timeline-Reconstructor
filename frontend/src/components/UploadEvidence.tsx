import React, { useEffect, useState } from 'react';
import { CloudUpload, CheckCircle2, AlertTriangle, Loader, X } from 'lucide-react';
import { API_BASE } from '../api/axios';
import { Scenario } from '../types';
import { parseEvidenceUpload } from '../utils/evidenceUpload';

interface UploadResponse {
  success: boolean;
  fileType: string;
  recordsFound: number;
  recordsCreated: number;
  records?: object[];
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

interface UploadEvidenceProps {
  selectedFile: File | null;
  selectedScenarioId: string | null;
  scenarios: Scenario[];
  onUploadSuccess?: () => void;
}

export function UploadEvidence({ 
  selectedFile, 
  selectedScenarioId, 
  scenarios,
  onUploadSuccess,
}: UploadEvidenceProps) {
  const [file, setFile] = useState<File | null>(selectedFile);
  const [scenarioId, setScenarioId] = useState<string | null>(selectedScenarioId);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    recordsFound: number;
    recordsCreated: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    setFile(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    setScenarioId(selectedScenarioId);
  }, [selectedScenarioId]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (['csv', 'json', 'evtx'].includes(ext || '')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Unsupported file type. Please select CSV, JSON, or EVTX.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (['csv', 'json', 'evtx'].includes(ext || '')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Unsupported file type. Please select CSV, JSON, or EVTX.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file.');
      return;
    }

    if (!scenarioId) {
      setError('Please select a scenario.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await parseEvidenceUpload(file);
      console.log('Parse Result:', result);
      console.log('Records:', result.records);
      console.log('First Record:', result.records[0]);

      if (result.errors.length > 0) {
        setError(result.errors.join('\n'));
        setToast({
          type: 'error',
          message: 'Evidence validation failed.',
        });
        return;
      }

      console.log('Uploading:', result.records);
      console.log('API_BASE =', API_BASE);

      const requestUrl = `${API_BASE}/evidence/upload?scenario_id=${encodeURIComponent(scenarioId)}`;
      console.log('Request URL:', requestUrl);

      const payload = JSON.stringify(result.records, null, 2);
      console.log('Payload:', payload);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (!response.ok) {
        console.log('Backend Error:', response);
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data: UploadResponse = await response.json();

      setUploadResult({
        success: true,
        recordsFound: data.recordsFound,
        recordsCreated: data.recordsCreated,
      });

      setFile(null);

      // Show success toast
      setToast({
        type: 'success',
        message: 'Evidence uploaded successfully.',
      });

      // Call the success callback to refresh the scenario and evidence cards
      if (onUploadSuccess) {
        setTimeout(() => {
          onUploadSuccess();
        }, 500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);

      // Show error toast
      setToast({
        type: 'error',
        message: 'Evidence upload failed.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-950 text-white px-4 py-6 sm:px-6">
      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg border px-4 py-3 flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success'
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
            : 'border-rose-500/60 bg-rose-500/10 text-rose-100'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 inline-flex text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl">
          <div>
            <p className="text-sm uppercase tracking-widest text-emerald-400/80">Evidence Management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Upload Evidence</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Import evidence files in CSV or JSON format to add new artifacts to your investigation.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          {/* Main Upload Area */}
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-10 transition-all ${
                dragActive ? 'border-emerald-400/80 bg-emerald-500/10' : 'border-slate-700 bg-slate-950/70'
              }`}
            >
              <CloudUpload className="h-16 w-16 text-emerald-400" />
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {file ? `Ready: ${file.name}` : 'Drag & drop your file here'}
                </p>
                <p className="mt-2 text-sm text-slate-400">or click to browse for CSV, JSON, or EVTX files</p>
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:border-emerald-400/80 hover:text-emerald-300">
                Choose File
                <input
                  type="file"
                  accept=".csv,.json,.evtx"
                  className="sr-only"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* Supported Files Info */}
            <div className="mt-6 rounded-3xl border border-slate-800/90 bg-slate-950/80 p-4">
              <p className="text-sm font-semibold text-slate-200">Supported Formats</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-white">CSV</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-white">JSON</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-slate-400">EVTX (Soon)</span>
                </div>
              </div>
            </div>

            {/* Selected File Info */}
            {file && (
              <div className="mt-6 rounded-3xl border border-slate-800/90 bg-slate-950/80 p-4">
                <p className="text-sm font-semibold text-slate-200">Selected File</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-900 p-3">
                    <p className="text-xs uppercase tracking-wider text-slate-500">File Name</p>
                    <p className="mt-2 truncate text-sm text-white">{file.name}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Size</p>
                    <p className="mt-2 text-sm text-white">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Scenario Selection */}
            <div className="mt-6 rounded-3xl border border-slate-800/90 bg-slate-950/80 p-4">
              <label className="text-sm font-semibold text-slate-200">Select Scenario</label>
              <select
                value={scenarioId || ''}
                onChange={(e) => setScenarioId(e.target.value || null)}
                className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
              >
                <option value="">-- Choose a scenario --</option>
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || !scenarioId || uploading}
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Evidence'
                )}
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mt-4 rounded-3xl border border-rose-500/60 bg-rose-500/10 p-4 text-rose-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Success Notification */}
            {uploadResult && uploadResult.success && (
              <div className="mt-4 rounded-3xl border border-emerald-500/60 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-emerald-100 mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold">Upload Successful</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 text-sm">
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-xs text-slate-400">Records Found</p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">{uploadResult.recordsFound}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-xs text-slate-400">Created</p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">{uploadResult.recordsCreated}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-xs text-slate-400">Evidence Pool</p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">Updated</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6 rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl">
            <div className="rounded-lg bg-slate-950/80 p-4">
              <h3 className="text-sm font-semibold text-white">Upload Tips</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li>• CSV files should contain one evidence record per row</li>
                <li>• JSON can be a single object or an array of objects</li>
                <li>• Required fields: timestamp, title, description, severity, source</li>
                <li>• Optional: user, host, processName, fileName, fileHash, registryKey</li>
              </ul>
            </div>
            <div className="rounded-lg bg-slate-950/80 p-4">
              <h3 className="text-sm font-semibold text-white">File Requirements</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Ensure your file follows the expected schema and contains valid data. Invalid records will be skipped and reported.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
