"use client";

import { useDropzone } from "react-dropzone";
import { Label } from "./Cards";

export function UploadOne({
  label,
  accept,
  multiple = false,
  file,
  onFile,
  onFiles,
  helper,
}: {
  label: string;
  accept: any;
  multiple?: boolean;
  file?: File | null;
  onFile?: (f: File | null) => void;
  onFiles?: (fs: File[]) => void;
  helper?: string;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    accept,
    onDrop: (accepted) => {
      if (multiple) onFiles?.(accepted);
      else onFile?.(accepted?.[0] || null);
    },
  });

  const one = !multiple ? file : null;

  return (
    <div className="rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-soft backdrop-blur">
      <Label>{label}</Label>
      {helper ? <div className="mt-1 text-xs text-stone-500">{helper}</div> : null}

      <div
        {...getRootProps()}
        className={[
          "mt-3 cursor-pointer rounded-2xl border border-dashed p-6 transition",
          isDragActive ? "border-stone-400 bg-stone-50" : "border-stone-200 bg-white",
        ].join(" ")}
      >
        <input {...getInputProps()} />
        {!multiple && !one ? (
          <div className="text-sm text-stone-600">
            Drag & drop here, or <span className="text-stone-900 underline">browse</span>
          </div>
        ) : null}

        {!multiple && one ? (
          <div className="text-sm text-stone-700">
            <div className="font-medium text-stone-900">{one.name}</div>
            <div className="mt-1 text-xs text-stone-500">{Math.round(one.size / 1024)} KB</div>
            <button
              className="mt-3 text-xs text-stone-600 underline-offset-4 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                onFile?.(null);
              }}
            >
              Remove
            </button>
          </div>
        ) : null}

        {multiple ? (
          <div className="text-sm text-stone-600">
            Drop multiple files here, or <span className="text-stone-900 underline">browse</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FileChips({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (idx: number) => void;
}) {
  if (!files.length) return null;
  return (
    <div className="mt-4 space-y-2">
      {files.map((f, idx) => (
        <div
          key={`${f.name}-${idx}`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-2"
        >
          <div className="truncate text-sm font-medium text-stone-900">{f.name}</div>
          <button className="text-xs text-stone-600 underline-offset-4 hover:underline" onClick={() => onRemove(idx)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
