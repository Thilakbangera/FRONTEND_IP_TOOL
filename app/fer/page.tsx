"use client";

import { useMemo, useState } from "react";
import { Shell } from "../../components/Shell";
import { Card, Label, PrimaryButton, SecondaryButton } from "../../components/Cards";
import { UploadOne } from "../../components/Upload";
import { responseToDownload } from "../../lib/download";

type GenState = "idle" | "parsing" | "generating" | "done" | "error";
type PriorArtMode = "pdf" | "text";
type PriorArtEntry = {
  id: number;
  label: string;
  abstract: string;
  pdf: File | null;
  diagram: File | null;
};

const FER_BACKEND_BASE = (
  process.env.NEXT_PUBLIC_FER_BACKEND_URL || "https://fer-reply-tool.onrender.com"
).replace(/\/$/, "");

const createPriorArtEntry = (index: number): PriorArtEntry => ({
  id: Date.now() + index,
  label: `D${index + 1}`,
  abstract: "",
  pdf: null,
  diagram: null,
});

function parseBackendError(raw: string, fallback: string): string {
  const text = (raw || "").trim();
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.detail === "string" && parsed.detail.trim()) return parsed.detail.trim();
  } catch {
    // Keep raw response text.
  }
  return text;
}

export default function FerPage() {
  const [ferPdf, setFerPdf] = useState<File | null>(null);
  const [csPdf, setCsPdf] = useState<File | null>(null);
  const [amendedClaims, setAmendedClaims] = useState<File | null>(null);

  const [priorArtMode, setPriorArtMode] = useState<PriorArtMode>("pdf");
  const [priorArts, setPriorArts] = useState<PriorArtEntry[]>([createPriorArtEntry(0)]);

  const [state, setState] = useState<GenState>("idle");
  const [error, setError] = useState("");
  const [parseJson, setParseJson] = useState<any>(null);
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);
  const [scannedDocWarning, setScannedDocWarning] = useState("");

  const priorArtsComplete = useMemo(() => {
    if (!priorArts.length) return false;
    if (priorArtMode === "pdf") return priorArts.every((entry) => !!entry.pdf);
    return priorArts.every((entry) => entry.abstract.trim().length > 0);
  }, [priorArts, priorArtMode]);

  const canParse = useMemo(() => !!ferPdf && (state === "idle" || state === "error"), [ferPdf, state]);
  const canGenerate = useMemo(
    () =>
      !!ferPdf &&
      !!csPdf &&
      !!amendedClaims &&
      priorArtsComplete &&
      (state === "idle" || state === "error"),
    [ferPdf, csPdf, amendedClaims, priorArtsComplete, state]
  );

  function addPriorArt() {
    setPriorArts((prev) => [...prev, createPriorArtEntry(prev.length)]);
  }

  function removePriorArt(id: number) {
    setPriorArts((prev) => (prev.length <= 1 ? prev : prev.filter((entry) => entry.id !== id)));
  }

  function updatePriorArt(id: number, patch: Partial<PriorArtEntry>) {
    setPriorArts((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  async function parseFer() {
    setError("");
    setScannedDocWarning("");
    setParseJson(null);
    setDownload(null);
    setState("parsing");
    try {
      const form = new FormData();
      form.append("fer_pdf", ferPdf!);

      const res = await fetch(`${FER_BACKEND_BASE}/api/parse_fer`, { method: "POST", body: form });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        throw new Error(parseBackendError(raw, `Parse failed (${res.status})`));
      }
      const json = await res.json();
      setParseJson(json);
      setState("idle");
    } catch (e: any) {
      const message = e?.message || "Parse failed";
      setError(
        message === "Failed to fetch"
          ? "Network/CORS error while calling Render backend. Allow your frontend origin in backend CORS."
          : message
      );
      setState("error");
    }
  }

  async function generate() {
    setError("");
    setScannedDocWarning("");
    setDownload(null);
    setState("generating");
    try {
      const form = new FormData();

      form.append("fer_pdf", ferPdf!);
      form.append("cs_pdf", csPdf!);
      form.append("amended_claims_pdf", amendedClaims!);

      form.append("prior_art_input_mode", priorArtMode);
      form.append("prior_art_mode", priorArtMode);

      const priorArtMeta = priorArts.map((entry, index) => ({
        label: entry.label.trim() || `D${index + 1}`,
        has_diagram: !!entry.diagram,
      }));
      const priorArtTextPayload = priorArts.map((entry, index) => ({
        label: entry.label.trim() || `D${index + 1}`,
        abstract: entry.abstract.trim(),
        has_diagram: !!entry.diagram,
      }));

      form.append("prior_arts_meta_json", JSON.stringify(priorArtMeta));
      form.append("prior_art_pdf_meta_json", JSON.stringify(priorArtMeta));
      form.append("prior_arts_json", JSON.stringify(priorArtTextPayload));
      form.append("prior_art_manual_json", JSON.stringify(priorArtTextPayload));

      priorArts.forEach((entry) => {
        if (entry.pdf) form.append("prior_art_pdfs", entry.pdf);
      });
      priorArts.forEach((entry) => {
        if (entry.diagram) form.append("prior_art_diagrams", entry.diagram);
      });

      const res = await fetch(`${FER_BACKEND_BASE}/api/generate_reply`, { method: "POST", body: form });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        throw new Error(parseBackendError(raw, `Generate failed (${res.status})`));
      }

      const dl = await responseToDownload(res, "FER_Reply_Draft.docx");
      setDownload({ url: dl.url, filename: dl.filename });
      setState("done");
    } catch (e: any) {
      const message = e?.message || "Generate failed";
      if (/scanned copy|image-only pdf/i.test(message)) {
        setScannedDocWarning(message);
        if (typeof window !== "undefined") window.alert(message);
      }
      setError(
        message === "Failed to fetch"
          ? "Network/CORS error while calling Render backend. Allow your frontend origin in backend CORS."
          : message
      );
      setState("error");
    }
  }

  const checklist = [
    { k: "FER PDF", ok: !!ferPdf },
    { k: "CS PDF", ok: !!csPdf },
    { k: "Amended Claims (PDF/DOC/DOCX)", ok: !!amendedClaims },
    { k: "Prior Arts", ok: priorArtsComplete },
  ];

  return (
    <Shell
      title="FER Reply Generator"
      subtitle="Review extracted content and generate the FER reply with prior-art inputs."
      active="fer"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <UploadOne
          label="FER PDF (required)"
          accept={{ "application/pdf": [".pdf"] }}
          file={ferPdf}
          onFile={setFerPdf}
          helper="Backend key: fer_pdf"
        />
        <UploadOne
          label="Complete Specification (CS) PDF (required)"
          accept={{ "application/pdf": [".pdf"] }}
          file={csPdf}
          onFile={setCsPdf}
          helper="Backend key: cs_pdf"
        />
        <UploadOne
          label="Amended Claims (PDF / DOC / DOCX)"
          accept={{
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
          }}
          file={amendedClaims}
          onFile={setAmendedClaims}
          helper="Backend key: amended_claims_pdf"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-stone-900">Prior Arts (D1-Dn)</div>
            <div className="mt-1 text-sm text-stone-600">
              In PDF mode, each prior-art PDF is checked by backend. Scanned image-only PDFs are rejected.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={priorArtMode}
              onChange={(e) => setPriorArtMode(e.target.value as PriorArtMode)}
              className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700"
            >
              <option value="pdf">From Prior-Art PDF</option>
              <option value="text">Manual Abstract Text</option>
            </select>
            <button
              type="button"
              onClick={addPriorArt}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-900 hover:bg-stone-50"
            >
              + Add Prior Art
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {priorArts.map((entry, index) => (
            <div key={entry.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-stone-900">Entry {index + 1}</div>
                {priorArts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removePriorArt(entry.id)}
                    className="text-xs text-stone-600 underline-offset-4 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <div>
                  <Label>Label</Label>
                  <input
                    value={entry.label}
                    onChange={(e) => updatePriorArt(entry.id, { label: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
                    placeholder={`D${index + 1}`}
                  />
                </div>

                <div>
                  <Label>Diagram Image (Optional)</Label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={(e) => updatePriorArt(entry.id, { diagram: e.target.files?.[0] || null })}
                    className="mt-2 block w-full rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                  />
                  {entry.diagram ? <div className="mt-2 text-xs text-stone-600">{entry.diagram.name}</div> : null}
                </div>
              </div>

              {priorArtMode === "pdf" ? (
                <div className="mt-4">
                  <Label>Prior-Art PDF (required)</Label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => updatePriorArt(entry.id, { pdf: e.target.files?.[0] || null })}
                    className="mt-2 block w-full rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                  />
                  {entry.pdf ? <div className="mt-2 text-xs text-stone-600">{entry.pdf.name}</div> : null}
                </div>
              ) : (
                <div className="mt-4">
                  <Label>Prior-Art Abstract (required)</Label>
                  <textarea
                    value={entry.abstract}
                    onChange={(e) => updatePriorArt(entry.id, { abstract: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
                    rows={4}
                    placeholder="Paste abstract text for this prior art"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-stone-900">Checklist</div>
              <div className="mt-1 text-sm text-stone-600">Complete all required inputs before generating.</div>
            </div>
            <div className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700">
              {checklist.filter((c) => c.ok).length}/{checklist.length} ready
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {checklist.map((c) => (
              <div key={c.k} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-3">
                <div className="text-sm text-stone-700">{c.k}</div>
                <div className={["text-xs font-medium", c.ok ? "text-emerald-700" : "text-amber-700"].join(" ")}>
                  {c.ok ? "Ready" : "Missing"}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <SecondaryButton disabled={!canParse} onClick={parseFer}>
              {state === "parsing" ? "Parsing..." : "Parse FER (Preview JSON)"}
            </SecondaryButton>
            <PrimaryButton disabled={!canGenerate} onClick={generate}>
              {state === "generating" ? "Generating..." : "Generate FER Reply DOCX"}
            </PrimaryButton>

            {download && (
              <a
                href={download.url}
                download={download.filename}
                className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-900 shadow-sm hover:bg-stone-50"
              >
                Download
              </a>
            )}
          </div>

          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
          {state === "generating" ? <div className="mt-4 text-xs text-stone-500 shimmer">Working...</div> : null}
        </Card>
      </div>

      {parseJson ? (
        <div className="mt-6 rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-soft backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-stone-900">Parsed JSON Preview</div>
              <div className="mt-1 text-sm text-stone-600">From Render /api/parse_fer</div>
            </div>
          </div>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-800">
{JSON.stringify(parseJson, null, 2)}
          </pre>
        </div>
      ) : null}

      {scannedDocWarning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white p-5 shadow-xl">
            <div className="text-sm font-semibold text-amber-800">Scanned Prior-Art Document Detected</div>
            <div className="mt-2 text-sm text-stone-700">{scannedDocWarning}</div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setScannedDocWarning("")}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-900 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
