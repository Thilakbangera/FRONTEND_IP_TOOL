"use client";

import { useMemo, useState } from "react";
import { Shell } from "../../components/Shell";
import { Card, Label, Hint, PrimaryButton } from "../../components/Cards";
import { UploadOne, FileChips } from "../../components/Upload";
import { responseToDownload } from "../../lib/download";

type GenState = "idle" | "generating" | "done" | "error";
const WS_BACKEND_BASE = (
  process.env.NEXT_PUBLIC_WS_BACKEND_URL || "https://automated-written-submission-tool.onrender.com"
).replace(/\/$/, "");

export default function WsPage() {
  const [city, setCity] = useState("Chennai");

  const [fer, setFer] = useState<File | null>(null);
  const [hn, setHn] = useState<File | null>(null);
  const [specification, setSpecification] = useState<File | null>(null);
  const [amendedClaims, setAmendedClaims] = useState<File | null>(null);
  const [techImages, setTechImages] = useState<File[]>([]);

  const [state, setState] = useState<GenState>("idle");
  const [error, setError] = useState("");
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);

  const ready = useMemo(() => {
    return (
      city.trim().length > 1 &&
      !!fer &&
      !!hn &&
      !!specification &&
      !!amendedClaims &&
      techImages.length > 0 &&
      (state === "idle" || state === "error")
    );
  }, [city, fer, hn, specification, amendedClaims, techImages, state]);

  async function generate() {
    setError("");
    setDownload(null);
    setState("generating");
    try {
      const form = new FormData();
      // Keys must match your WS backend (from earlier Streamlit app)
      form.append("city", city.trim());
      form.append("fer", fer!);
      form.append("hn", hn!);
      form.append("specification", specification!);
      form.append("amended_claims", amendedClaims!);
      techImages.forEach((img) => form.append("tech_solution_images", img));

      const res = await fetch(`${WS_BACKEND_BASE}/api/generate`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text().catch(() => `WS failed (${res.status})`));

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
    { k: "FER PDF", ok: !!fer },
    { k: "Hearing Notice PDF", ok: !!hn },
    { k: "Specification PDF", ok: !!specification },
    { k: "Amended claims (PDF/DOCX/TXT)", ok: !!amendedClaims },
    { k: "Tech solution diagrams (>=1)", ok: techImages.length > 0 },
  ];

  return (
    <Shell
      title="WS Generator"
      subtitle="Organize required documents and generate WS by calling the Render backend directly."
      active="ws"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <UploadOne
          label="FER PDF (required)"
          accept={{ "application/pdf": [".pdf"] }}
          file={fer}
          onFile={setFer}
          helper="Backend key: fer"
        />
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
          label="Amended Claims (PDF / DOCX / TXT)"
          accept={{
            "application/pdf": [".pdf"],
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <Label>To Office (city)</Label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-300"
            placeholder="Chennai / Mumbai / Delhi / Kolkata"
          />
          <Hint>
            Backend key: <code className="rounded bg-stone-100 px-1 py-0.5">city</code>
          </Hint>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-stone-900">Checklist</div>
              <div className="mt-1 text-sm text-stone-600">All items required.</div>
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
            Tech solution diagrams are uploaded as multiple files under the same form key:<br></br>
            Prior art details (D1, D2, etc.), disclosures, and related mappings are automatically extracted from the FER. Due to variations in IPO formatting (e.g., combined references on a single line or unconventional phrasing), the extraction may not always be fully accurate.
            Please verify: prior art list, disclosures table, and key technical sections (problem/solution/effect) before finalizing the Written Submission.
            <span className="mx-1 rounded bg-stone-100 px-1 py-0.5 font-mono text-xs">tech_solution_images</span>.
          </div>
        </Card>
      </div>
    </Shell>
  );
}
