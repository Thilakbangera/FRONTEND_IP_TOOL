"use client";

import { useMemo, useState } from "react";
import { Shell } from "../../components/Shell";
import { Card, Label, Hint, PrimaryButton } from "../../components/Cards";
import { UploadOne, FileChips } from "../../components/Upload";
import { responseToDownload } from "../../lib/download";

type GenState = "idle" | "generating" | "done" | "error";
type PriorArtMode = "pdf" | "text";
type PriorArtEntry = {
  id: number;
  label: string;
  abstract: string;
  pdf: File | null;
  diagram: File | null;
};

const WS_BACKEND_BASE = (
  process.env.NEXT_PUBLIC_WS_BACKEND_URL || "https://automated-written-submission-tool.onrender.com"
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

export default function WsPage() {
  const [city, setCity] = useState("Chennai");
  const [filedOn, setFiledOn] = useState("");

  const [hn, setHn] = useState<File | null>(null);
  const [specification, setSpecification] = useState<File | null>(null);
  const [amendedClaims, setAmendedClaims] = useState<File | null>(null);
  const [techImages, setTechImages] = useState<File[]>([]);

  const [priorArtMode, setPriorArtMode] = useState<PriorArtMode>("pdf");
  const [priorArts, setPriorArts] = useState<PriorArtEntry[]>([createPriorArtEntry(0)]);

  const [state, setState] = useState<GenState>("idle");
  const [error, setError] = useState("");
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);

  const priorArtsComplete = useMemo(() => {
    if (!priorArts.length) return false;
    if (priorArtMode === "pdf") return priorArts.every((entry) => !!entry.pdf);
    return priorArts.every((entry) => entry.abstract.trim().length > 0);
  }, [priorArts, priorArtMode]);

  const ready = useMemo(() => {
    return (
      city.trim().length > 1 &&
      filedOn.trim().length > 0 &&
      !!hn &&
      !!specification &&
      !!amendedClaims &&
      techImages.length > 0 &&
      priorArtsComplete &&
      (state === "idle" || state === "error")
    );
  }, [city, filedOn, hn, specification, amendedClaims, techImages, priorArtsComplete, state]);

  function addPriorArt() {
    setPriorArts((prev) => [...prev, createPriorArtEntry(prev.length)]);
  }

  function removePriorArt(id: number) {
    setPriorArts((prev) => (prev.length <= 1 ? prev : prev.filter((entry) => entry.id !== id)));
  }

  function updatePriorArt(id: number, patch: Partial<PriorArtEntry>) {
    setPriorArts((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  async function generate() {
    setError("");
    setDownload(null);
    setState("generating");
    try {
      const form = new FormData();
      form.append("city", city.trim());
      form.append("filed_on", filedOn.trim());
      form.append("prior_art_input_mode", priorArtMode);

      form.append("hn", hn!);
      form.append("specification", specification!);
      if (amendedClaims) form.append("amended_claims", amendedClaims);

      techImages.forEach((img) => form.append("tech_solution_images", img));
      priorArts.forEach((entry) => {
        if (entry.diagram) form.append("prior_art_diagrams", entry.diagram);
      });

      if (priorArtMode === "pdf") {
        const meta = priorArts.map((entry, index) => ({
          label: entry.label.trim() || `D${index + 1}`,
          has_diagram: !!entry.diagram,
        }));
        form.append("prior_arts_meta_json", JSON.stringify(meta));
        priorArts.forEach((entry) => {
          if (entry.pdf) form.append("prior_art_pdfs", entry.pdf);
        });
      } else {
        const payload = priorArts.map((entry, index) => ({
          label: entry.label.trim() || `D${index + 1}`,
          abstract: entry.abstract.trim(),
          has_diagram: !!entry.diagram,
        }));
        form.append("prior_arts_json", JSON.stringify(payload));
      }

      const res = await fetch(`${WS_BACKEND_BASE}/api/generate`, { method: "POST", body: form });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        throw new Error(parseBackendError(raw, `WS failed (${res.status})`));
      }

      const dl = await responseToDownload(res, "written_submission.docx");
      setDownload({ url: dl.url, filename: dl.filename });
      setState("done");
    } catch (e: any) {
      const message = e?.message || "WS generation failed";
      setError(
        message === "Failed to fetch"
          ? "Network/CORS error while calling Render backend. Allow your frontend origin in backend CORS."
          : message
      );
      setState("error");
    }
  }

  const checklist = [
    { k: "Office city", ok: city.trim().length > 1 },
    { k: "Filed On", ok: filedOn.trim().length > 0 },
    { k: "Hearing Notice PDF", ok: !!hn },
    { k: "Specification PDF", ok: !!specification },
    { k: "Amended claims (PDF/DOC/DOCX/TXT)", ok: !!amendedClaims },
    { k: "Tech solution diagrams (>=1)", ok: techImages.length > 0 },
    { k: "Prior Arts", ok: priorArtsComplete },
  ];

  return (
    <Shell
      title="WS Generator"
      subtitle="Organize required documents and prior-art inputs, then generate WS."
      active="ws"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <UploadOne
          label="Hearing Notice (HN) PDF (required)"
          accept={{ "application/pdf": [".pdf"] }}
          file={hn}
          onFile={setHn}
          helper="Backend key: hn"
        />
        <UploadOne
          label="Complete Specification PDF (required)"
          accept={{ "application/pdf": [".pdf"] }}
          file={specification}
          onFile={setSpecification}
          helper="Backend key: specification"
        />
        <UploadOne
          label="Amended Claims (PDF / DOC / DOCX / TXT)"
          accept={{
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "text/plain": [".txt"],
          }}
          file={amendedClaims}
          onFile={setAmendedClaims}
          helper="Backend key: amended_claims"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-soft backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-stone-900">Technical Solution Diagrams</div>
            <div className="mt-1 text-sm text-stone-600">Upload one or more PNG/JPG images.</div>
          </div>
          <div className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700">
            {techImages.length} file(s)
          </div>
        </div>

        <div className="mt-4">
          <UploadOne
            label="Drop images here"
            accept={{ "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] }}
            multiple
            onFiles={(fs) => setTechImages((prev) => [...prev, ...fs])}
            helper="Backend key: tech_solution_images (multiple)"
          />
          <FileChips
            files={techImages}
            onRemove={(idx) => setTechImages((prev) => prev.filter((_, i) => i !== idx))}
          />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-stone-900">Prior Arts (D1-Dn)</div>
            <div className="mt-1 text-sm text-stone-600">Choose PDF mode or manual text mode for prior-art input.</div>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <Label>To Office (city)</Label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
            placeholder="Chennai / Mumbai / Delhi / Kolkata"
          />

          <div className="mt-4">
            <Label>Filed On</Label>
          </div>
          <input
            value={filedOn}
            onChange={(e) => setFiledOn(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
            placeholder="DD/MM/YYYY"
          />

          <Hint>
            Backend keys: <code className="rounded bg-stone-100 px-1 py-0.5">city</code>,{" "}
            <code className="rounded bg-stone-100 px-1 py-0.5">filed_on</code>
          </Hint>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-stone-900">Checklist</div>
              <div className="mt-1 text-sm text-stone-600">All listed items are required to generate.</div>
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
            <PrimaryButton disabled={!ready} onClick={generate}>
              {state === "generating" ? "Generating..." : "Generate Written Submission"}
            </PrimaryButton>
            {download && (
              <a
                href={download.url}
                download={download.filename}
                className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-900 shadow-sm hover:bg-stone-50"
              >
                Download DOCX
              </a>
            )}
          </div>

          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
          {state === "generating" ? <div className="mt-4 text-xs text-stone-500 shimmer">Working...</div> : null}
        </Card>

        <Card>
          <div className="text-sm font-semibold text-stone-900">Notes</div>
          <div className="mt-2 text-sm text-stone-600">
            Prior arts can be provided either as PDF uploads (auto abstract extraction) or manual abstract text.
            <br />
            Optional prior-art diagrams are submitted with backend key{" "}
            <span className="mx-1 rounded bg-stone-100 px-1 py-0.5 font-mono text-xs">prior_art_diagrams</span>.
            <br />
            Technical solution diagrams are submitted under{" "}
            <span className="mx-1 rounded bg-stone-100 px-1 py-0.5 font-mono text-xs">tech_solution_images</span>.
          </div>
        </Card>
      </div>
    </Shell>
  );
}
