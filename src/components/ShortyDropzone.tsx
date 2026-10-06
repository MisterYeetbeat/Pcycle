import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  FileCheck,
  FolderOpen,
  Info,
  Play,
  Upload,
} from 'lucide-react';
import { parseUploadedFile, ParsedCatalogFile } from '../utils/fileParser.ts';

interface ShortyDropzoneProps {
  onFileParsed: (parsed: ParsedCatalogFile) => void;
  parsedFile: ParsedCatalogFile | null;
}

export const ShortyDropzone: React.FC<ShortyDropzoneProps> = ({ onFileParsed, parsedFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseUploadedFile(file);
      onFileParsed(parsed);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      {/* Notice about local file access vs cloud environment */}
      <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-cyan-200/90 leading-relaxed">
          <strong className="text-white block font-semibold mb-1">
            How to test with your local Shorty dataset:
          </strong>
          Because this cloud sandbox cannot directly read your private Windows path (
          <code className="text-cyan-300 font-mono bg-black/40 px-1 py-0.5 rounded">
            C:/Users/jpozn/OneDrive/Documents/Codex-Backtest/...
          </code>
          ) without file transfer, you can drag & drop any file directly here! Supported files include:
          <span className="font-mono text-zinc-300 font-semibold">
            {' '}
            .json, .json.gz (auto-decompressed), si_series_full.json, events_eligible.json.gz,
            coil_smoke.json.gz, askside_enrichment.json, or 5m bars.
          </span>
        </div>
      </div>

      {/* Drag & drop box */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
        }`}
        onClick={() => document.getElementById('file-upload-input')?.click()}
      >
        <input
          id="file-upload-input"
          type="file"
          accept=".json,.gz"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 shadow-inner">
            {loading ? (
              <div className="h-7 w-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-7 w-7 text-cyan-400" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {loading ? 'Decompressing & Parsing JSON...' : 'Drop your Shorty Catalog file here'}
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Supports <code className="text-zinc-300">.json</code> and gzipped{' '}
              <code className="text-zinc-300">.json.gz</code>
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-700 hover:bg-zinc-700 transition"
          >
            <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>Browse Local Files</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Parsed File Summary Card */}
      {parsedFile && (
        <div className="bg-zinc-900/80 border border-emerald-900/50 rounded-xl p-4 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-sm font-bold text-white font-mono">{parsedFile.fileName}</div>
                <div className="text-xs text-emerald-400">{parsedFile.summary}</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              {parsedFile.recordCount.toLocaleString()} records
            </span>
          </div>

          <div className="text-xs text-zinc-400 bg-black/40 p-3 rounded-lg border border-white/5 font-mono overflow-x-auto max-h-40">
            <div className="text-zinc-500 mb-1">// Sample preview:</div>
            <pre>
              {JSON.stringify(
                Array.isArray(parsedFile.data)
                  ? parsedFile.data.slice(0, 3)
                  : typeof parsedFile.data === 'object'
                  ? Object.entries(parsedFile.data).slice(0, 2)
                  : parsedFile.data,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
